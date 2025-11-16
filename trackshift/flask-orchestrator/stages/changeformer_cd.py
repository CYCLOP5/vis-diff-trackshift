#!/usr/bin/env python3
"""Run ChangeFormer inference on an image pair and emit infrastructure-ready artifacts."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image
from scipy import ndimage
import torch
import torch.nn.functional as F
from torchvision.transforms import functional as TF
from matplotlib import colormaps

# Resolve repository roots so we can import ChangeFormer modules without modifying PYTHONPATH globally.
STAGE_ROOT = Path(__file__).resolve().parent
WORKSPACE_ROOT = STAGE_ROOT.parents[2]
DEFAULT_CHANGEFORMER_ROOT = Path(os.getenv("CHANGEFORMER_ROOT", WORKSPACE_ROOT / "ChangeFormer")).resolve()

if str(DEFAULT_CHANGEFORMER_ROOT) not in sys.path:
    sys.path.insert(0, str(DEFAULT_CHANGEFORMER_ROOT))

from models.networks import define_G  # type: ignore  # pylint: disable=wrong-import-position


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run ChangeFormer CD inference and emit visualization artifacts.")
    parser.add_argument("--before", required=True, type=Path, help="Path to the baseline/reference image.")
    parser.add_argument("--after", required=True, type=Path, help="Path to the comparison image (aligned frame if available).")
    parser.add_argument("--output-dir", required=True, type=Path, help="Directory where artifacts + report.json will be stored.")
    parser.add_argument("--changeformer-root", default=DEFAULT_CHANGEFORMER_ROOT, type=Path, help="Path to the ChangeFormer repository root.")
    parser.add_argument("--checkpoint", type=Path, help="Explicit path to a ChangeFormer checkpoint (.pt).")
    parser.add_argument("--project-name", default=os.getenv("CHANGEFORMER_PROJECT", "ChangeFormer_LEVIR"), help="Project directory under checkpoints/ when --checkpoint is not provided.")
    parser.add_argument("--checkpoint-name", default=os.getenv("CHANGEFORMER_CHECKPOINT_NAME", "best_ckpt.pt"), help="Checkpoint filename when resolving from --project-name.")
    parser.add_argument("--net", default=os.getenv("CHANGEFORMER_NET", "ChangeFormerV6"), help="Generator backbone identifier passed to ChangeFormer.")
    parser.add_argument("--embed-dim", type=int, default=int(os.getenv("CHANGEFORMER_EMBED_DIM", "256")), help="Embedding dimension for ChangeFormer variants (default=256).")
    parser.add_argument("--img-size", type=int, default=int(os.getenv("CHANGEFORMER_IMG_SIZE", "512")), help="Square resolution used for inference (pixels).")
    parser.add_argument("--prob-threshold", type=float, default=float(os.getenv("CHANGEFORMER_PROB_THRESHOLD", "0.35")), help="Probability threshold for classifying a pixel as changed (0-1).")
    parser.add_argument("--min-region-pixels", type=int, default=int(os.getenv("CHANGEFORMER_MIN_REGION_PIXELS", "300")), help="Minimum connected-component size kept in the summary (in resized pixel units).")
    parser.add_argument("--prefer-cuda", action="store_true", default=os.getenv("CHANGEFORMER_USE_CUDA") == "1", help="Attempt to run inference on CUDA if available.")
    return parser.parse_args()


def _resolve_checkpoint(args: argparse.Namespace) -> Path:
    if args.checkpoint:
        checkpoint = args.checkpoint.expanduser().resolve()
        if not checkpoint.is_file():
            raise FileNotFoundError(f"Checkpoint not found at {checkpoint}")
        return checkpoint

    root = args.changeformer_root.expanduser().resolve()
    candidates: List[Path] = []
    if args.project_name:
        candidates.append(root / "checkpoints" / args.project_name / args.checkpoint_name)
        candidates.append(root / "checkpoints" / args.project_name)
    candidates.append(root / "checkpoints" / args.checkpoint_name)
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        f"Unable to locate checkpoint. Checked: {', '.join(str(c) for c in candidates)}"
    )


def _load_model(args: argparse.Namespace, checkpoint_path: Path) -> tuple[torch.nn.Module, torch.device]:
    device = torch.device("cuda:0" if args.prefer_cuda and torch.cuda.is_available() else "cpu")
    gpu_ids = [0] if device.type == "cuda" else []
    net_args = SimpleNamespace(net_G=args.net, embed_dim=args.embed_dim, gpu_ids=gpu_ids)
    model = define_G(net_args, gpu_ids=gpu_ids)
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    state_dict = checkpoint.get("model_G_state_dict") if isinstance(checkpoint, dict) else None
    if state_dict is None:
        state_dict = checkpoint
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model, device


def _load_image(path: Path, img_size: int) -> tuple[torch.Tensor, np.ndarray, tuple[int, int]]:
    image = Image.open(path).convert("RGB")
    original_np = np.array(image)
    original_size = image.size  # (width, height)
    if img_size and img_size > 0:
        image = image.resize((img_size, img_size), Image.BICUBIC)
    tensor = TF.to_tensor(image)
    tensor = TF.normalize(tensor, mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
    return tensor.unsqueeze(0), original_np, original_size


def _probability_to_colors(prob_map: np.ndarray) -> np.ndarray:
    cmap = colormaps["magma"]
    colored = cmap(np.clip(prob_map, 0.0, 1.0))[:, :, :3]
    return (colored * 255).astype(np.uint8)


def _build_overlay(image_rgb: np.ndarray, mask_bool: np.ndarray, color=(255, 64, 32)) -> np.ndarray:
    alpha = mask_bool.astype(np.float32)[..., None] * 0.65
    highlight = np.zeros_like(image_rgb, dtype=np.float32)
    highlight[..., 0] = color[0]
    highlight[..., 1] = color[1]
    highlight[..., 2] = color[2]
    base = image_rgb.astype(np.float32)
    blended = base * (1 - alpha) + highlight * alpha
    return np.clip(blended, 0, 255).astype(np.uint8)


def _extract_regions(mask: np.ndarray, prob_map: np.ndarray, min_pixels: int, width: int, height: int) -> List[Dict[str, Any]]:
    labeled, num = ndimage.label(mask.astype(np.uint8))
    regions: List[Dict[str, Any]] = []
    total_pixels = max(width * height, 1)
    for label_idx in range(1, num + 1):
        region_mask = labeled == label_idx
        pixel_count = int(region_mask.sum())
        if pixel_count < max(1, min_pixels):
            continue
        coords = np.argwhere(region_mask)
        y_min, x_min = coords.min(axis=0)
        y_max, x_max = coords.max(axis=0) + 1
        centroid_y, centroid_x = coords.mean(axis=0)
        mean_prob = float(prob_map[region_mask].mean()) if pixel_count else 0.0
        max_prob = float(prob_map[region_mask].max()) if pixel_count else 0.0
        bbox = [int(x_min), int(y_min), int(x_max), int(y_max)]
        bbox_norm = [
            round(bbox[0] / width, 6),
            round(bbox[1] / height, 6),
            round(bbox[2] / width, 6),
            round(bbox[3] / height, 6),
        ]
        centroid_norm = [round(centroid_x / width, 6), round(centroid_y / height, 6)]
        regions.append(
            {
                "id": f"cf-region-{len(regions) + 1}",
                "label": f"ChangeFormer region {len(regions) + 1}",
                "bbox": bbox,
                "bboxNormalized": bbox_norm,
                "centroidNormalized": centroid_norm,
                "pixelCount": pixel_count,
                "areaRatio": round(pixel_count / total_pixels, 6),
                "meanProbability": round(mean_prob, 6),
                "maxProbability": round(max_prob, 6),
                "confidence": round(max_prob, 6),
                "source": "changeformer",
            }
        )
    return regions


def main() -> None:
    args = parse_args()
    if not args.before.is_file() or not args.after.is_file():
        raise SystemExit("Both --before and --after must point to existing files.")

    output_dir = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    checkpoint_path = _resolve_checkpoint(args)
    model, device = _load_model(args, checkpoint_path)

    before_tensor, _, before_size = _load_image(args.before, args.img_size)
    after_tensor, after_np, after_size = _load_image(args.after, args.img_size)

    with torch.inference_mode():
        logits = model(before_tensor.to(device), after_tensor.to(device))
        if isinstance(logits, (list, tuple)):
            logits = logits[-1]
        probs = torch.softmax(logits, dim=1)[:, 1:2, :, :]

    # Upsample probability map back to the original AFTER frame resolution for artifact generation.
    target_h = after_np.shape[0]
    target_w = after_np.shape[1]
    prob_map = F.interpolate(probs, size=(target_h, target_w), mode="bilinear", align_corners=False)
    prob_np = prob_map.squeeze().cpu().numpy()
    mask_bool = prob_np >= max(0.0, min(1.0, args.prob_threshold))
    change_pixels = int(mask_bool.sum())
    coverage = float(change_pixels / max(target_h * target_w, 1))
    global_mean = float(prob_np[mask_bool].mean()) if change_pixels else 0.0
    global_max = float(prob_np.max()) if prob_np.size else 0.0

    regions = _extract_regions(mask_bool, prob_np, args.min_region_pixels, target_w, target_h)

    mask_path = output_dir / "mask.png"
    overlay_path = output_dir / "overlay.png"
    heatmap_path = output_dir / "heatmap.png"
    report_path = output_dir / "report.json"

    Image.fromarray((mask_bool.astype(np.uint8) * 255)).save(mask_path)
    Image.fromarray(_build_overlay(after_np, mask_bool)).save(overlay_path)
    Image.fromarray(_probability_to_colors(prob_np)).save(heatmap_path)

    summary: Dict[str, Any] = {
        "status": "completed",
        "model": {
            "net": args.net,
            "embedDim": args.embed_dim,
            "checkpoint": str(checkpoint_path),
        },
        "imageSize": {"width": target_w, "height": target_h},
        "inferenceSize": {"width": before_size[0], "height": before_size[1]},
        "threshold": args.prob_threshold,
        "minRegionPixels": args.min_region_pixels,
        "coverage": round(coverage, 6),
        "pixelsChanged": change_pixels,
        "regionCount": len(regions),
        "regions": regions,
        "globalMeanProbability": round(global_mean, 6),
        "globalMaxProbability": round(global_max, 6),
        "artifacts": {
            "mask": "mask.png",
            "overlay": "overlay.png",
            "heatmap": "heatmap.png",
        },
    }

    with report_path.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)

    payload = {
        "status": summary["status"],
        "coverage": summary["coverage"],
        "regions": summary["regionCount"],
        "artifacts": summary["artifacts"],
    }
    print(json.dumps(payload))


if __name__ == "__main__":
    main()
