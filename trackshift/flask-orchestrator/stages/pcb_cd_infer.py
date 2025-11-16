#!/usr/bin/env python3
"""Invoke Roboflow's pcb-defect-detection model and emit overlay artifacts."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
from inference_sdk import InferenceHTTPClient
from PIL import Image, ImageDraw, ImageOps

DEFAULT_MODEL_ID = os.getenv("ROBOFLOW_PCB_MODEL_ID", "pcb-defect-detection-9ewqw/1")
DEFAULT_API_BASE = os.getenv("ROBOFLOW_PCB_API_BASE") or os.getenv("ROBOFLOW_API_URL", "https://serverless.roboflow.com")
DEFAULT_API_KEY = os.getenv("ROBOFLOW_API_KEY")
DEFAULT_CONFIDENCE = float(os.getenv("ROBOFLOW_PCB_CONFIDENCE", "0.45"))
DEFAULT_OVERLAP = float(os.getenv("ROBOFLOW_PCB_OVERLAP", "0.2"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Call Roboflow inference for PCB defect overlays.")
    parser.add_argument("--before", required=True, type=Path, help="Path to the reference/baseline image.")
    parser.add_argument("--after", required=True, type=Path, help="Path to the comparison image (sent to Roboflow).")
    parser.add_argument("--output-dir", required=True, type=Path, help="Directory to store generated artifacts.")
    parser.add_argument("--model-id", default=DEFAULT_MODEL_ID, help="Roboflow model slug, e.g. workspace/model/version.")
    parser.add_argument("--api-base", default=DEFAULT_API_BASE, help="Base inference URL (defaults to detect.roboflow.com).")
    parser.add_argument("--api-key", default=DEFAULT_API_KEY, help="Roboflow API key (falls back to ROBOFLOW_API_KEY env).")
    parser.add_argument("--confidence", type=float, default=DEFAULT_CONFIDENCE, help="Minimum confidence score retained locally (0-1).")
    parser.add_argument("--overlap", type=float, default=DEFAULT_OVERLAP, help="Maximum IoU permitted between kept boxes (local suppression).")
    parser.add_argument("--output-key", default=os.getenv("ROBOFLOW_OUTPUT_KEY"), help="Optional dot path to predictions inside the response JSON.")
    return parser.parse_args()


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _resolve_predictions(payload: Dict[str, Any], output_key: Optional[str]) -> List[Dict[str, Any]]:
    def _traverse(node: Any, path: Sequence[str]) -> Any:
        curr = node
        for key in path:
            if isinstance(curr, dict):
                curr = curr.get(key)
            else:
                return None
        return curr

    if output_key:
        parts = [part for part in output_key.split(".") if part]
        resolved = _traverse(payload, parts)
        if isinstance(resolved, list):
            return resolved

    for candidate in ("predictions", "results", "items"):
        value = payload.get(candidate)
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            inner = value.get("predictions")
            if isinstance(inner, list):
                return inner
    return []


def _call_roboflow(after_path: Path, args: argparse.Namespace) -> Dict[str, Any]:
    if not args.api_key:
        raise RuntimeError("ROBOFLOW_API_KEY is required for PCB change detection stage.")
    client = InferenceHTTPClient(api_url=args.api_base, api_key=args.api_key)
    result = client.infer(str(after_path), model_id=args.model_id)
    if not isinstance(result, dict):
        raise RuntimeError("Unexpected response from Roboflow inference client.")
    return result


def _prediction_confidence(pred: Dict[str, Any]) -> float:
    value = (
        pred.get("confidence")
        or pred.get("confidence_score")
        or pred.get("score")
        or pred.get("probability")
        or pred.get("conf")
        or 0
    )
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _prediction_polygon(pred: Dict[str, Any], width: int, height: int) -> Optional[List[Tuple[float, float]]]:
    points = pred.get("points") or pred.get("segmentation")
    if not isinstance(points, Iterable):
        return None
    polygon: List[Tuple[float, float]] = []
    for point in points:
        if isinstance(point, dict):
            x = point.get("x")
            y = point.get("y")
        elif isinstance(point, (list, tuple)) and len(point) >= 2:
            x, y = point[0], point[1]
        else:
            continue
        if x is None or y is None:
            continue
        polygon.append((_clamp(float(x), 0, width), _clamp(float(y), 0, height)))
    return polygon or None


def _prediction_box(pred: Dict[str, Any], width: int, height: int) -> Optional[Tuple[float, float, float, float]]:
    w = float(pred.get("width") or pred.get("w") or 0)
    h = float(pred.get("height") or pred.get("h") or 0)
    x_center = float(pred.get("x") or pred.get("cx") or pred.get("center_x") or 0)
    y_center = float(pred.get("y") or pred.get("cy") or pred.get("center_y") or 0)
    if w <= 0 or h <= 0:
        return None
    x_min = _clamp(x_center - w / 2.0, 0, width)
    y_min = _clamp(y_center - h / 2.0, 0, height)
    x_max = _clamp(x_center + w / 2.0, 0, width)
    y_max = _clamp(y_center + h / 2.0, 0, height)
    if x_max <= x_min or y_max <= y_min:
        return None
    return x_min, y_min, x_max, y_max


def _bbox_from_polygon(polygon: List[Tuple[float, float]]) -> Tuple[float, float, float, float]:
    xs = [p[0] for p in polygon]
    ys = [p[1] for p in polygon]
    return min(xs), min(ys), max(xs), max(ys)


def _extract_geometry(
    pred: Dict[str, Any], width: int, height: int
) -> Tuple[Optional[List[Tuple[float, float]]], Optional[Tuple[float, float, float, float]]]:
    polygon = _prediction_polygon(pred, width, height)
    if polygon:
        return polygon, _bbox_from_polygon(polygon)
    box = _prediction_box(pred, width, height)
    return None, box


def _compute_iou(box_a: Tuple[float, float, float, float], box_b: Tuple[float, float, float, float]) -> float:
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b
    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)
    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h
    if inter_area <= 0:
        return 0.0
    area_a = max(0.0, (ax2 - ax1) * (ay2 - ay1))
    area_b = max(0.0, (bx2 - bx1) * (by2 - by1))
    denom = area_a + area_b - inter_area
    if denom <= 0:
        return 0.0
    return inter_area / denom


def _filter_predictions(
    predictions: List[Dict[str, Any]],
    width: int,
    height: int,
    min_confidence: float,
    overlap_threshold: float,
) -> List[Dict[str, Any]]:
    if not predictions:
        return []
    min_conf = _clamp(min_confidence, 0.0, 1.0)
    filtered = [pred for pred in predictions if _prediction_confidence(pred) >= min_conf]
    if overlap_threshold <= 0 or len(filtered) <= 1:
        return filtered

    prepared: List[Tuple[int, Tuple[float, float, float, float]]] = []
    passthrough_indices: List[int] = []
    for idx, pred in enumerate(filtered):
        _, bbox = _extract_geometry(pred, width, height)
        if bbox:
            prepared.append((idx, bbox))
        else:
            passthrough_indices.append(idx)

    kept_indices = set(passthrough_indices)
    order = sorted(
        prepared,
        key=lambda item: _prediction_confidence(filtered[item[0]]),
        reverse=True,
    )
    suppressed: set[int] = set()
    for i, (idx, bbox) in enumerate(order):
        if idx in suppressed:
            continue
        kept_indices.add(idx)
        for other_idx, other_bbox in order[i + 1 :]:
            if other_idx in suppressed:
                continue
            if _compute_iou(bbox, other_bbox) > overlap_threshold:
                suppressed.add(other_idx)

    return [filtered[idx] for idx in sorted(kept_indices)]


def _draw_predictions(mask: Image.Image, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    width, height = mask.size
    draw = ImageDraw.Draw(mask)
    regions: List[Dict[str, Any]] = []
    for idx, pred in enumerate(predictions):
        polygon, bbox = _extract_geometry(pred, width, height)
        if polygon:
            draw.polygon(polygon, fill=255)
        elif bbox:
            draw.rectangle(bbox, fill=255)
        else:
            continue

        x_min, y_min, x_max, y_max = bbox
        bbox_int = [int(round(v)) for v in (x_min, y_min, x_max, y_max)]
        bbox_norm = [
            round(bbox_int[0] / max(width, 1), 6),
            round(bbox_int[1] / max(height, 1), 6),
            round(bbox_int[2] / max(width, 1), 6),
            round(bbox_int[3] / max(height, 1), 6),
        ]
        area = max(1, (bbox_int[2] - bbox_int[0]) * (bbox_int[3] - bbox_int[1]))
        area_ratio = round(area / max(width * height, 1), 6)
        confidence = _prediction_confidence(pred)
        region = {
            "id": f"rf-region-{idx + 1}",
            "label": pred.get("class") or pred.get("label") or "defect",
            "confidence": round(confidence, 6),
            "bbox": bbox_int,
            "bboxNormalized": bbox_norm,
            "areaRatio": area_ratio,
            "source": "roboflow",
        }
        regions.append(region)
    return regions


def _save_overlay(after_img: Image.Image, mask_img: Image.Image, path: Path) -> None:
    highlight = Image.new("RGBA", after_img.size, (255, 64, 0, 0))
    alpha = mask_img.point(lambda v: int(v * 0.7))
    highlight.putalpha(alpha)
    overlay = Image.alpha_composite(after_img.convert("RGBA"), highlight)
    overlay.save(path)


def _save_heatmap(mask_img: Image.Image, path: Path) -> None:
    heatmap = ImageOps.colorize(mask_img, black="#050505", white="#ff6b35")
    heatmap.save(path)


def main() -> None:
    args = parse_args()
    output_dir = args.output_dir.expanduser()
    output_dir.mkdir(parents=True, exist_ok=True)

    after_img = Image.open(args.after).convert("RGB")
    try:
        response_payload = _call_roboflow(args.after, args)
    except RuntimeError as exc:
        raise SystemExit(str(exc)) from exc

    predictions = _resolve_predictions(response_payload, args.output_key)
    predictions = _filter_predictions(
        predictions,
        after_img.width,
        after_img.height,
        args.confidence,
        args.overlap,
    )
    mask_img = Image.new("L", after_img.size, color=0)
    regions = _draw_predictions(mask_img, predictions)

    mask_path = output_dir / "mask.png"
    overlay_path = output_dir / "overlay.png"
    heatmap_path = output_dir / "heatmap.png"
    report_path = output_dir / "report.json"

    mask_img.save(mask_path)
    _save_overlay(after_img, mask_img, overlay_path)
    _save_heatmap(mask_img, heatmap_path)

    mask_array = np.array(mask_img)
    coverage = float(np.count_nonzero(mask_array) / max(mask_array.size, 1))
    pixels_changed = int(np.count_nonzero(mask_array))

    summary: Dict[str, Any] = {
        "status": "completed",
        "model": args.model_id,
        "apiBase": args.api_base,
        "coverage": round(coverage, 6),
        "pixelsChanged": pixels_changed,
        "regionCount": len(regions),
        "regions": regions,
        "imageSize": {"width": after_img.width, "height": after_img.height},
        "confidence": args.confidence,
        "overlap": args.overlap,
        "rawResponse": response_payload,
    }

    with report_path.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)

    payload = {
        "status": "completed",
        "coverage": summary["coverage"],
        "regions": len(regions),
        "artifacts": {
            "mask": str(mask_path),
            "overlay": str(overlay_path),
            "heatmap": str(heatmap_path),
            "report": str(report_path),
        },
    }
    print(json.dumps(payload))


if __name__ == "__main__":
    main()
