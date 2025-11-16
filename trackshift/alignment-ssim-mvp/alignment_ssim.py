
import argparse
import json
from pathlib import Path

import cv2
import imutils
import numpy as np
from skimage.exposure import match_histograms
from skimage.metrics import structural_similarity


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Align two images and highlight structural differences.")
    parser.add_argument("--before", required=True, help="Reference image path (time T0).")
    parser.add_argument("--after", required=True, help="Target image path (time T1).")
    parser.add_argument("--output-dir", default="outputs", help="Directory for generated artifacts.")
    parser.add_argument("--min-orb-inliers", type=int, default=50, help="Minimum inliers needed to accept ORB homography.")
    parser.add_argument("--roi-area-threshold", type=int, default=200, help="Minimum contour area (pixels) to keep.")
    parser.add_argument("--blur-kernel", type=int, default=5, help="Gaussian blur kernel size (odd integer).")
    parser.add_argument(
        "--color-normalization",
        choices=["none", "histogram", "lab-clahe", "auto"],
        default="none",
        help="Color normalization strategy (auto picks based on luminance stats).",
    )
    return parser.parse_args()


def align_orb(reference: np.ndarray, target: np.ndarray, inlier_threshold: int) -> tuple[np.ndarray, bool]:
    gray_ref = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    gray_tgt = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(2000)
    key_ref, desc_ref = orb.detectAndCompute(gray_ref, None)
    key_tgt, desc_tgt = orb.detectAndCompute(gray_tgt, None)
    if desc_ref is None or desc_tgt is None:
        return target, False
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = matcher.match(desc_ref, desc_tgt)
    if not matches:
        return target, False
    matches = sorted(matches, key=lambda m: m.distance)
    points_ref = np.float32([key_ref[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    points_tgt = np.float32([key_tgt[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
    homography, inliers = cv2.findHomography(points_tgt, points_ref, cv2.RANSAC, 5.0)
    if homography is None or inliers is None or int(inliers.sum()) < inlier_threshold:
        return target, False
    aligned = cv2.warpPerspective(target, homography, (reference.shape[1], reference.shape[0]), flags=cv2.INTER_LINEAR)
    return aligned, True


def align_ecc(reference: np.ndarray, target: np.ndarray) -> tuple[np.ndarray, bool]:
    gray_ref = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    gray_tgt = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY)
    ref_norm = gray_ref.astype(np.float32) / 255.0
    tgt_norm = gray_tgt.astype(np.float32) / 255.0
    warp_mode = cv2.MOTION_HOMOGRAPHY
    warp_matrix = np.eye(3, dtype=np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 50, 1e-6)
    try:
        _, warp_matrix = cv2.findTransformECC(ref_norm, tgt_norm, warp_matrix, warp_mode, criteria, None, 5)
        aligned = cv2.warpPerspective(target, warp_matrix, (reference.shape[1], reference.shape[0]), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
        return aligned, True
    except cv2.error:
        return target, False



def align_images(reference: np.ndarray, target: np.ndarray, inlier_threshold: int) -> tuple[np.ndarray, str]:
    aligned, ok = align_orb(reference, target, inlier_threshold)
    if ok:
        return aligned, "orb"
    aligned, ok = align_ecc(reference, target)
    if ok:
        return aligned, "ecc"
    return target, "none"


def normalize_colors(reference: np.ndarray, target: np.ndarray, mode: str) -> tuple[np.ndarray, np.ndarray]:
    if mode == "none":
        return reference, target
    if mode == "histogram":
        # Match the target histogram to the reference for each RGB channel.
        matched = match_histograms(target, reference, channel_axis=-1)
        return reference, matched.astype(np.uint8)
    if mode == "lab-clahe":
        # Normalize illumination by equalizing the L channel in LAB space for both images.
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        ref_lab = cv2.cvtColor(reference, cv2.COLOR_BGR2LAB)
        tgt_lab = cv2.cvtColor(target, cv2.COLOR_BGR2LAB)
        ref_lab[:, :, 0] = clahe.apply(ref_lab[:, :, 0])
        tgt_lab[:, :, 0] = clahe.apply(tgt_lab[:, :, 0])
        ref_eq = cv2.cvtColor(ref_lab, cv2.COLOR_LAB2BGR)
        tgt_eq = cv2.cvtColor(tgt_lab, cv2.COLOR_LAB2BGR)
        return ref_eq, tgt_eq
    return reference, target


def choose_color_mode(reference: np.ndarray, target: np.ndarray, requested: str) -> str:
    if requested != "auto":
        return requested
    gray_ref = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    gray_tgt = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY)
    mean_diff = abs(float(gray_ref.mean()) - float(gray_tgt.mean()))
    std_diff = abs(float(gray_ref.std()) - float(gray_tgt.std()))
    if mean_diff > 15.0:
        return "histogram"
    if std_diff > 10.0:
        return "lab-clahe"
    return "none"


def compute_ssim(reference_gray: np.ndarray, target_gray: np.ndarray) -> tuple[float, np.ndarray]:
    score, diff = structural_similarity(reference_gray, target_gray, full=True)
    diff_uint8 = (diff * 255).astype("uint8")
    return score, diff_uint8


def build_mask(diff_gray: np.ndarray) -> np.ndarray:
    blur = cv2.GaussianBlur(diff_gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
    return thresh


def contour_boxes(mask: np.ndarray, min_area: int) -> list[dict]:
    contours = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = imutils.grab_contours(contours)
    boxes: list[dict] = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        boxes.append({"bbox": [int(x), int(y), int(w), int(h)], "area": float(area)})
    return boxes


def overlay_boxes(image: np.ndarray, boxes: list[dict]) -> np.ndarray:
    output = image.copy()
    for box in boxes:
        x, y, w, h = box["bbox"]
        cv2.rectangle(output, (x, y), (x + w, y + h), (0, 0, 255), 2)
    return output


def apply_heatmap(diff_gray: np.ndarray) -> np.ndarray:
    normalized = cv2.normalize(diff_gray, None, 0, 255, cv2.NORM_MINMAX)
    return cv2.applyColorMap(normalized.astype(np.uint8), cv2.COLORMAP_TURBO)


def main() -> None:
    args = parse_args()
    before_path = Path(args.before)
    after_path = Path(args.after)
    if not before_path.is_file():
        raise FileNotFoundError(f"Missing reference image: {before_path}")
    if not after_path.is_file():
        raise FileNotFoundError(f"Missing target image: {after_path}")
    reference = cv2.imread(str(before_path))
    target = cv2.imread(str(after_path))
    if reference is None or target is None:
        raise ValueError("Failed to load one or both images.")
    aligned, method = align_images(reference, target, args.min_orb_inliers)
    if aligned.shape[:2] != reference.shape[:2]:
        target_h, target_w = reference.shape[:2]
        aligned = cv2.resize(aligned, (target_w, target_h), interpolation=cv2.INTER_AREA)
        method = f"{method}+resize" if method != "none" else "resize"
    color_mode = choose_color_mode(reference, aligned, args.color_normalization)
    reference, aligned = normalize_colors(reference, aligned, color_mode)
    ref_gray = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    aligned_gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY)
    if args.blur_kernel > 1 and args.blur_kernel % 2 == 1:
        ref_gray = cv2.GaussianBlur(ref_gray, (args.blur_kernel, args.blur_kernel), 0)
        aligned_gray = cv2.GaussianBlur(aligned_gray, (args.blur_kernel, args.blur_kernel), 0)
    ssim_score, diff_gray = compute_ssim(ref_gray, aligned_gray)
    mask = build_mask(diff_gray)
    boxes = contour_boxes(mask, args.roi_area_threshold)
    overlay = overlay_boxes(reference, boxes)
    heatmap = apply_heatmap(diff_gray)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_dir / "aligned.png"), aligned)
    cv2.imwrite(str(output_dir / "diff_gray.png"), diff_gray)
    cv2.imwrite(str(output_dir / "mask.png"), mask)
    cv2.imwrite(str(output_dir / "overlay.png"), overlay)
    cv2.imwrite(str(output_dir / "heatmap.png"), heatmap)
    report = {
        "alignment_method": method,
        "color_normalization": color_mode,
        "ssim": round(float(ssim_score), 4),
        "roi_count": len(boxes),
        "rois": boxes,
        "before": str(before_path.resolve()),
        "after": str(after_path.resolve()),
    }
    with (output_dir / "report.json").open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print(json.dumps({
        "status": "ok",
        "ssim": report["ssim"],
        "rois": report["roi_count"],
        "color_normalization": color_mode,
    }))


if __name__ == "__main__":
    main()
