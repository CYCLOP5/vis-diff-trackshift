#!/usr/bin/env python3
"""Stage 2 component diff using a Roboflow workflow plus SSIM verification."""

from __future__ import annotations

import argparse
import base64
import binascii
import imghdr
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import cv2
import numpy as np
from inference_sdk import InferenceHTTPClient
from PIL import Image
from skimage.exposure import match_histograms
from skimage.metrics import structural_similarity


@dataclass
class ComponentDetection:
    """Normalised component prediction from the detection workflow."""

    name: str
    bbox: Tuple[int, int, int, int]
    confidence: float
    is_damaged: bool
    damage_notes: str

    def clamp(self, width: int, height: int) -> "ComponentDetection":
        x1, y1, x2, y2 = self.bbox
        x1 = max(0, min(width - 1, x1))
        y1 = max(0, min(height - 1, y1))
        x2 = max(0, min(width - 1, x2))
        y2 = max(0, min(height - 1, y2))
        if x2 <= x1:
            x2 = min(width - 1, x1 + 1)
        if y2 <= y1:
            y2 = min(height - 1, y1 + 1)
        return ComponentDetection(
            name=self.name,
            bbox=(x1, y1, x2, y2),
            confidence=self.confidence,
            is_damaged=self.is_damaged,
            damage_notes=self.damage_notes,
        )


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _decode_base64_image(payload: str) -> Optional[Tuple[bytes, str]]:
    data = payload.strip()
    if not data:
        return None
    mime: Optional[str] = None
    if data.lower().startswith("data:image"):
        header, _, body = data.partition(",")
        if not body:
            return None
        data = body
        mime = header.split(";")[0].split(":")[-1]
    if data.startswith("http://") or data.startswith("https://"):
        return None
    padding = len(data) % 4
    if padding:
        data += "=" * (4 - padding)
    try:
        decoded = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError):
        return None
    if mime:
        ext = mime.split("/")[-1]
    else:
        detected = imghdr.what(None, decoded)
        ext = detected or "jpg"
    return decoded, ext


def _save_visualizations(payload: Any, directory: Path) -> Dict[str, str]:
    saved: Dict[str, str] = {}
    stack: List[Tuple[Any, List[str]]] = [(payload, [])]
    counter = 0
    while stack:
        current, path = stack.pop()
        if isinstance(current, dict):
            for key, value in current.items():
                stack.append((value, path + [key]))
        elif isinstance(current, list):
            for idx, value in enumerate(current):
                stack.append((value, path + [str(idx)]))
        elif isinstance(current, str):
            key_name = path[-1].lower() if path else ""
            if "visualization" not in key_name:
                continue
            decoded = _decode_base64_image(current)
            if not decoded:
                continue
            data, ext = decoded
            if not directory.exists():
                directory.mkdir(parents=True, exist_ok=True)
            slug = "_".join(path) or f"visualization_{counter}"
            safe_slug = slug.replace("/", "_")
            filename = f"{counter:02d}_{safe_slug}.{ext}"
            output_path = directory / filename
            output_path.write_bytes(data)
            saved["/".join(path) or filename] = str(output_path.resolve())
            counter += 1
    return saved


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Stage 2: detect F1 components via Roboflow workflow plus SSIM validation.",
    )
    parser.add_argument("--before", required=True, help="Path to the reference image (T0).")
    parser.add_argument("--after", required=True, help="Path to the target image (T1).")
    parser.add_argument("--output", required=True, help="Path to write the JSON report.")
    parser.add_argument(
        "--artifacts-dir",
        help="Optional directory for visual artifacts (defaults to the report directory).",
    )
    parser.add_argument(
        "--ssim-threshold",
        type=float,
        default=0.9,
        help="SSIM threshold below which an object is flagged as changed.",
    )
    parser.add_argument(
        "--min-orb-inliers",
        type=int,
        default=50,
        help="Minimum inliers needed to accept ORB homography alignment.",
    )
    parser.add_argument(
        "--color-normalization",
        choices=["none", "histogram", "lab-clahe", "auto"],
        default="auto",
        help="Color normalization strategy before SSIM computation.",
    )
    parser.add_argument(
        "--save-crops",
        action="store_true",
        help="Persist before/after ROI crops and difference heatmaps for paired components.",
    )
    parser.add_argument(
        "--save-overlay",
        action="store_true",
        help="Persist an overlay image highlighting changed components.",
    )
    parser.add_argument(
        "--roboflow-api-url",
        type=str,
        default=os.getenv("ROBOFLOW_API_URL", "https://serverless.roboflow.com"),
        help="Base URL for the Roboflow inference API (default serverless endpoint).",
    )
    parser.add_argument(
        "--roboflow-api-key",
        type=str,
        default=os.getenv("ROBOFLOW_API_KEY"),
        help="Roboflow API key (defaults to ROBOFLOW_API_KEY environment variable).",
    )
    parser.add_argument(
        "--roboflow-workspace",
        type=str,
        default=os.getenv("ROBOFLOW_WORKSPACE"),
        help="Roboflow workspace slug that owns the workflow.",
    )
    parser.add_argument(
        "--roboflow-workflow-id",
        type=str,
        default=os.getenv("ROBOFLOW_WORKFLOW_ID"),
        help="Roboflow workflow identifier to invoke (e.g. custom-workflow-2).",
    )
    parser.add_argument(
        "--workflow-image-field",
        type=str,
        default=os.getenv("ROBOFLOW_IMAGE_FIELD", "image"),
        help="Name of the image slot expected by the workflow (default 'image').",
    )
    parser.add_argument(
        "--workflow-output-key",
        type=str,
        default=os.getenv("ROBOFLOW_OUTPUT_KEY", ""),
        help="Optional dot-separated path to the list of predictions (defaults to auto-detect).",
    )
    parser.add_argument(
        "--disable-workflow-cache",
        action="store_true",
        default=_env_flag("ROBOFLOW_DISABLE_CACHE", False),
        help="Disable Roboflow server-side caching for repeated requests.",
    )
    return parser.parse_args()


def align_orb(reference: np.ndarray, target: np.ndarray, min_inliers: int) -> Tuple[np.ndarray, bool]:
    gray_ref = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    gray_tgt = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(2000)
    key_ref, desc_ref = orb.detectAndCompute(gray_ref, None)
    key_tgt, desc_tgt = orb.detectAndCompute(gray_tgt, None)
    if desc_ref is None or desc_tgt is None or len(key_ref) < 4 or len(key_tgt) < 4:
        return target, False
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = matcher.match(desc_ref, desc_tgt)
    if not matches:
        return target, False
    matches = sorted(matches, key=lambda m: m.distance)[:80]
    pts_ref = np.float32([key_ref[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    pts_tgt = np.float32([key_tgt[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
    homography, inliers = cv2.findHomography(pts_tgt, pts_ref, cv2.RANSAC, 5.0)
    if homography is None or inliers is None or int(inliers.sum()) < min_inliers:
        return target, False
    aligned = cv2.warpPerspective(target, homography, (reference.shape[1], reference.shape[0]), flags=cv2.INTER_LINEAR)
    return aligned, True


def align_ecc(reference: np.ndarray, target: np.ndarray) -> Tuple[np.ndarray, bool]:
    gray_ref = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    gray_tgt = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY)
    ref_norm = gray_ref.astype(np.float32) / 255.0
    tgt_norm = gray_tgt.astype(np.float32) / 255.0
    warp_matrix = np.eye(3, dtype=np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 50, 1e-6)
    try:
        _, warp_matrix = cv2.findTransformECC(ref_norm, tgt_norm, warp_matrix, cv2.MOTION_HOMOGRAPHY, criteria, None, 5)
        aligned = cv2.warpPerspective(
            target,
            warp_matrix,
            (reference.shape[1], reference.shape[0]),
            flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
        )
        return aligned, True
    except cv2.error:
        return target, False


def align_images(reference: np.ndarray, target: np.ndarray, min_inliers: int) -> Tuple[np.ndarray, str]:
    aligned, ok = align_orb(reference, target, min_inliers)
    if ok:
        return aligned, "orb"
    aligned, ok = align_ecc(reference, target)
    if ok:
        return aligned, "ecc"
    return target, "none"


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


def normalize_colors(reference: np.ndarray, target: np.ndarray, mode: str) -> Tuple[np.ndarray, np.ndarray]:
    if mode == "none":
        return reference, target
    if mode == "histogram":
        matched = match_histograms(target, reference, channel_axis=-1)
        return reference, matched.astype(np.uint8)
    if mode == "lab-clahe":
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        ref_lab = cv2.cvtColor(reference, cv2.COLOR_BGR2LAB)
        tgt_lab = cv2.cvtColor(target, cv2.COLOR_BGR2LAB)
        ref_lab[:, :, 0] = clahe.apply(ref_lab[:, :, 0])
        tgt_lab[:, :, 0] = clahe.apply(tgt_lab[:, :, 0])
        ref_eq = cv2.cvtColor(ref_lab, cv2.COLOR_LAB2BGR)
        tgt_eq = cv2.cvtColor(tgt_lab, cv2.COLOR_LAB2BGR)
        return ref_eq, tgt_eq
    return reference, target


def crop_roi(image: np.ndarray, box: Tuple[int, int, int, int]) -> np.ndarray:
    x1, y1, x2, y2 = box
    return image[y1:y2, x1:x2]


def build_overlay(base: np.ndarray, paired: Iterable[dict]) -> np.ndarray:
    overlay = base.copy()
    color_changed = (0, 0, 255)
    color_stable = (0, 200, 0)
    for item in paired:
        x1, y1, x2, y2 = item["box_shared"]
        color = color_changed if item["changed"] else color_stable
        label = f"{item['class_name']} ({item['ssim']:.3f})"
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)
        cv2.putText(overlay, label, (x1, max(15, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)
    return overlay


def save_roi_artifacts(
    directory: Path,
    index: int,
    component: str,
    before_roi: np.ndarray,
    after_roi: np.ndarray,
    diff_gray: np.ndarray,
) -> Dict[str, str]:
    directory.mkdir(parents=True, exist_ok=True)
    safe_name = component.replace(" ", "_").lower()
    prefix = f"{index:03d}_{safe_name}"
    before_path = directory / f"{prefix}_before.png"
    after_path = directory / f"{prefix}_after.png"
    diff_norm = cv2.normalize(diff_gray, None, 0, 255, cv2.NORM_MINMAX)
    heatmap = cv2.applyColorMap(diff_norm.astype(np.uint8), cv2.COLORMAP_TURBO)
    heatmap_path = directory / f"{prefix}_diff.png"
    cv2.imwrite(str(before_path), before_roi)
    cv2.imwrite(str(after_path), after_roi)
    cv2.imwrite(str(heatmap_path), heatmap)
    return {
        "before": str(before_path.resolve()),
        "after": str(after_path.resolve()),
        "diff": str(heatmap_path.resolve()),
    }


def load_image_dimensions(path: Path) -> Tuple[int, int]:
    with Image.open(path) as image:
        return image.size


def build_roboflow_client(api_url: str, api_key: str) -> InferenceHTTPClient:
    return InferenceHTTPClient(api_url=api_url, api_key=api_key)


def invoke_workflow(
    client: InferenceHTTPClient,
    workspace: str,
    workflow_id: str,
    image_field: str,
    image_path: Path,
    use_cache: bool,
) -> Dict[str, Any]:
    images = {image_field: str(image_path)}
    return client.run_workflow(
        workspace_name=workspace,
        workflow_id=workflow_id,
        images=images,
        use_cache=use_cache,
    )


def _extract_by_path(payload: Any, path: str) -> Any:
    current = payload
    if not path:
        return current
    for part in path.split("."):
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list):
            if not part.isdigit():
                raise KeyError(f"List index required for path segment '{part}'")
            idx = int(part)
            current = current[idx]
        else:
            raise KeyError(f"Cannot descend into path segment '{part}'")
        if current is None:
            raise KeyError(f"Path segment '{part}' not found")
    return current


def _looks_like_prediction(entry: Any) -> bool:
    if not isinstance(entry, dict):
        return False
    bbox_keys = (
        {"x1", "y1", "x2", "y2"},
        {"xmin", "ymin", "xmax", "ymax"},
        {"left", "top", "right", "bottom"},
    )
    for keys in bbox_keys:
        if keys.issubset(entry.keys()):
            return True
    if {"x", "y", "width", "height"}.issubset(entry.keys()):
        return True
    bbox = entry.get("bbox")
    if isinstance(bbox, dict):
        for keys in bbox_keys:
            if keys.issubset(bbox.keys()):
                return True
    return False


def _auto_find_prediction_list(payload: Any) -> Optional[List[Dict[str, Any]]]:
    seen: set[int] = set()
    stack: List[Any] = [payload]
    while stack:
        current = stack.pop()
        try:
            identity = id(current)
        except Exception:
            identity = None
        if identity and identity in seen:
            continue
        if identity:
            seen.add(identity)
        if isinstance(current, list):
            if current and isinstance(current[0], dict) and any(_looks_like_prediction(item) for item in current):
                return current  # type: ignore[return-value]
            stack.extend(current)
        elif isinstance(current, dict):
            stack.extend(current.values())
    return None


def _denormalize_dimension(value: float, max_value: int) -> float:
    val = float(value)
    if 0 < val <= 1:
        return val * max_value
    return val


def _coerce_bbox_from_dict(source: Dict[str, Any], width: int, height: int) -> Optional[Tuple[int, int, int, int]]:
    key_sets = [
        ("x1", "y1", "x2", "y2"),
        ("xmin", "ymin", "xmax", "ymax"),
        ("left", "top", "right", "bottom"),
    ]
    for keys in key_sets:
        if all(key in source for key in keys):
            x1 = _denormalize_dimension(source[keys[0]], width)
            y1 = _denormalize_dimension(source[keys[1]], height)
            x2 = _denormalize_dimension(source[keys[2]], width)
            y2 = _denormalize_dimension(source[keys[3]], height)
            return (int(round(x1)), int(round(y1)), int(round(x2)), int(round(y2)))
    return None


def _coerce_bbox_from_center(source: Dict[str, Any], width: int, height: int) -> Optional[Tuple[int, int, int, int]]:
    candidates = [
        ("x", "y", "width", "height"),
        ("center_x", "center_y", "width", "height"),
        ("cx", "cy", "w", "h"),
    ]
    for keys in candidates:
        if all(key in source for key in keys):
            cx = _denormalize_dimension(source[keys[0]], width)
            cy = _denormalize_dimension(source[keys[1]], height)
            bw = _denormalize_dimension(source[keys[2]], width)
            bh = _denormalize_dimension(source[keys[3]], height)
            x1 = cx - bw / 2.0
            y1 = cy - bh / 2.0
            x2 = cx + bw / 2.0
            y2 = cy + bh / 2.0
            return (int(round(x1)), int(round(y1)), int(round(x2)), int(round(y2)))
    return None


def _extract_bbox(prediction: Dict[str, Any], width: int, height: int) -> Tuple[int, int, int, int]:
    bbox = prediction.get("bbox")
    if isinstance(bbox, dict):
        result = _coerce_bbox_from_dict(bbox, width, height)
        if result:
            return result
    result = _coerce_bbox_from_dict(prediction, width, height)
    if result:
        return result
    result = _coerce_bbox_from_center(prediction, width, height)
    if result:
        return result
    raise ValueError("Prediction missing usable bounding box coordinates.")


def _extract_label(prediction: Dict[str, Any]) -> str:
    for key in ("name", "class", "class_name", "label", "category"):
        value = prediction.get(key)
        if value:
            return str(value)
    return "component"


def _extract_confidence(prediction: Dict[str, Any]) -> float:
    for key in ("confidence", "confidence_score", "score", "probability"):
        value = prediction.get(key)
        if value is not None:
            try:
                return float(value)
            except (TypeError, ValueError):
                continue
    return 0.5


def parse_predictions(
    raw: Dict[str, Any],
    width: int,
    height: int,
    output_key: Optional[str],
) -> List[ComponentDetection]:
    predictions: Optional[Any] = None
    if output_key:
        try:
            predictions = _extract_by_path(raw, output_key)
        except (KeyError, IndexError):
            predictions = None
    if not isinstance(predictions, list):
        predictions = _auto_find_prediction_list(raw)
    if not isinstance(predictions, list):
        raise RuntimeError("Unable to locate prediction list in workflow response.")
    detections: List[ComponentDetection] = []
    for item in predictions:
        if not isinstance(item, dict):
            continue
        try:
            det = ComponentDetection(
                name=_extract_label(item),
                bbox=_extract_bbox(item, width, height),
                confidence=_extract_confidence(item),
                is_damaged=bool(item.get("is_damaged") or item.get("damage")),
                damage_notes=str(item.get("damage_notes") or item.get("notes") or item.get("description") or ""),
            ).clamp(width, height)
            detections.append(det)
        except Exception:
            continue
    return detections


def main() -> None:
    args = parse_args()
    if not args.roboflow_api_key:
        raise RuntimeError("Roboflow API key not provided. Use --roboflow-api-key or set ROBOFLOW_API_KEY.")
    if not args.roboflow_workspace:
        raise RuntimeError("Roboflow workspace not provided. Use --roboflow-workspace or set ROBOFLOW_WORKSPACE.")
    if not args.roboflow_workflow_id:
        raise RuntimeError(
            "Roboflow workflow ID not provided. Use --roboflow-workflow-id or set ROBOFLOW_WORKFLOW_ID."
        )

    before_path = Path(args.before)
    after_path = Path(args.after)
    if not before_path.is_file():
        raise FileNotFoundError(f"Missing --before image: {before_path}")
    if not after_path.is_file():
        raise FileNotFoundError(f"Missing --after image: {after_path}")

    before_img = cv2.imread(str(before_path))
    after_img = cv2.imread(str(after_path))
    if before_img is None or after_img is None:
        raise ValueError("Failed to load one or both images.")

    aligned_after, alignment_method = align_images(before_img, after_img, args.min_orb_inliers)
    color_mode = choose_color_mode(before_img, aligned_after, args.color_normalization)
    norm_before, norm_after = normalize_colors(before_img, aligned_after, color_mode)
    before_gray = cv2.cvtColor(norm_before, cv2.COLOR_BGR2GRAY)
    after_gray = cv2.cvtColor(norm_after, cv2.COLOR_BGR2GRAY)

    width, height = load_image_dimensions(after_path)
    client = build_roboflow_client(args.roboflow_api_url, args.roboflow_api_key)
    raw_response = invoke_workflow(
        client,
        args.roboflow_workspace,
        args.roboflow_workflow_id,
        args.workflow_image_field,
        after_path,
        use_cache=not args.disable_workflow_cache,
    )
    detections = parse_predictions(raw_response, width, height, args.workflow_output_key or None)

    artifacts_dir = Path(args.artifacts_dir) if args.artifacts_dir else Path(args.output).resolve().parent
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    roi_dir = artifacts_dir / "paired_rois"
    raw_response_path = artifacts_dir / "roboflow_response.json"
    with raw_response_path.open("w", encoding="utf-8") as raw_file:
        json.dump(raw_response, raw_file, indent=2)
    roboflow_vis_dir = artifacts_dir / "roboflow_visualizations"
    visualization_files = _save_visualizations(raw_response, roboflow_vis_dir)

    paired_reports: List[Dict[str, Any]] = []
    changed_count = 0
    for idx, det in enumerate(detections):
        box_shared = det.bbox
        roi_before_gray = crop_roi(before_gray, box_shared)
        roi_after_gray = crop_roi(after_gray, box_shared)
        if roi_before_gray.size == 0 or roi_after_gray.size == 0 or roi_before_gray.shape != roi_after_gray.shape:
            continue
        ssim_value = structural_similarity(roi_before_gray, roi_after_gray)
        diff_gray = cv2.absdiff(roi_before_gray, roi_after_gray)
        before_roi_color = crop_roi(before_img, box_shared)
        after_roi_color = crop_roi(aligned_after, box_shared)
        artifacts: Dict[str, str] = {}
        if args.save_crops and before_roi_color.size and after_roi_color.size:
            artifacts = save_roi_artifacts(roi_dir, idx, det.name or "component", before_roi_color, after_roi_color, diff_gray)
        changed = bool(det.is_damaged or (ssim_value < args.ssim_threshold))
        if changed:
            changed_count += 1
        paired_reports.append(
            {
                "class_id": None,
                "class_name": det.name or "component",
                "box_before": list(box_shared),
                "box_after": list(box_shared),
                "box_shared": list(box_shared),
                "ssim": round(float(ssim_value), 4),
                "changed": changed,
                "confidence": round(det.confidence, 4),
                "llm_is_damaged": det.is_damaged,
                "llm_damage_notes": det.damage_notes,
                "artifacts": artifacts or None,
            }
        )

    summary_totals = {
        "paired": len(paired_reports),
        "changed": changed_count,
        "stable": len(paired_reports) - changed_count,
        "new": 0,
        "missing": 0,
    }

    component_summary: Dict[str, Dict[str, int]] = {}
    for item in paired_reports:
        key = item["class_name"].lower()
        bucket = component_summary.setdefault(key, {"changed": 0, "stable": 0})
        if item["changed"]:
            bucket["changed"] += 1
        else:
            bucket["stable"] += 1

    overlay_path: Optional[str] = None
    if args.save_overlay and paired_reports:
        overlay = build_overlay(aligned_after, paired_reports)
        overlay_file = artifacts_dir / "component_diff_overlay.png"
        cv2.imwrite(str(overlay_file), overlay)
        overlay_path = str(overlay_file.resolve())

    report = {
        "detector": "roboflow-workflow",
        "roboflow": {
            "api_url": args.roboflow_api_url,
            "workspace": args.roboflow_workspace,
            "workflow_id": args.roboflow_workflow_id,
            "image_field": args.workflow_image_field,
            "output_key": args.workflow_output_key or None,
            "use_cache": not args.disable_workflow_cache,
        },
        "alignment_method": alignment_method,
        "color_normalization": color_mode,
        "ssim_threshold": args.ssim_threshold,
        "counts": summary_totals,
        "components": component_summary,
        "paired": paired_reports,
        "new_objects": [],
        "missing_objects": [],
        "artifacts": {
            "overlay": overlay_path,
            "roi_dir": str(roi_dir.resolve()) if args.save_crops else None,
            "roboflow_response": str(raw_response_path.resolve()),
            "roboflow_visualizations": visualization_files or None,
        },
        "before": str(before_path.resolve()),
        "after": str(after_path.resolve()),
        "raw_response": raw_response,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)

    print(
        json.dumps(
            {
                "status": "ok",
                "paired": summary_totals["paired"],
                "changed": summary_totals["changed"],
                "new": 0,
                "missing": 0,
                "artifacts": report["artifacts"],
            }
        )
    )


if __name__ == "__main__":
    main()
