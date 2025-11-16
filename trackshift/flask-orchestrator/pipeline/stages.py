"""High-level orchestration logic for SSIM, RF-DETR-Seg, and Mask R-CNN stages."""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from PIL import Image, ImageChops, ImageStat

from config import Settings, MaskRCNNConfig
from .runner import StageExecutionError, run_cli_stage

logger = logging.getLogger(__name__)

_RESAMPLE_BILINEAR = getattr(getattr(Image, "Resampling", None), "BILINEAR", Image.BILINEAR)
_ALIGNMENT_SIZE_TOLERANCE = 0.35
_ALIGNMENT_ASPECT_TOLERANCE = 0.2
_ALIGNMENT_MEAN_DIFF_THRESHOLD = 0.6
_ALIGNMENT_THUMBNAIL_SIZE = (96, 96)


def _assess_alignment_feasibility(before_path: Path, after_path: Path) -> tuple[bool, Optional[str]]:
    """Heuristically decide if SSIM alignment has any chance of producing signal."""

    try:
        with Image.open(before_path) as before, Image.open(after_path) as after:
            width_delta = abs(before.width - after.width) / max(before.width, after.width, 1)
            height_delta = abs(before.height - after.height) / max(before.height, after.height, 1)
            if width_delta > _ALIGNMENT_SIZE_TOLERANCE or height_delta > _ALIGNMENT_SIZE_TOLERANCE:
                reason = (
                    f"dimension delta (w={width_delta:.2f}, h={height_delta:.2f}) exceeds "
                    f"{_ALIGNMENT_SIZE_TOLERANCE:.2f}"
                )
                return False, reason

            aspect_before = before.width / max(before.height, 1)
            aspect_after = after.width / max(after.height, 1)
            aspect_delta = abs(aspect_before - aspect_after) / max(aspect_before, aspect_after, 1e-6)
            if aspect_delta > _ALIGNMENT_ASPECT_TOLERANCE:
                reason = f"aspect ratio delta {aspect_delta:.2f} exceeds {_ALIGNMENT_ASPECT_TOLERANCE:.2f}"
                return False, reason

            before_gray = before.convert("L").resize(_ALIGNMENT_THUMBNAIL_SIZE, _RESAMPLE_BILINEAR)
            after_gray = after.convert("L").resize(_ALIGNMENT_THUMBNAIL_SIZE, _RESAMPLE_BILINEAR)
            diff = ImageChops.difference(before_gray, after_gray)
            stats = ImageStat.Stat(diff)
            mean = (stats.mean[0] / 255.0) if stats.mean else 1.0
            if mean > _ALIGNMENT_MEAN_DIFF_THRESHOLD:
                reason = f"global difference {mean:.2f} exceeds {_ALIGNMENT_MEAN_DIFF_THRESHOLD:.2f}"
                return False, reason

            return True, None
    except Exception as exc:  # pragma: no cover - heuristic failures fall back to running the stage
        logger.warning("Alignment feasibility check failed for %s vs %s: %s", before_path, after_path, exc)
        return True, None


def _alignment_skip_payload(reason: Optional[str], status: str = "skipped") -> Dict[str, Any]:
    message = reason or "Alignment skipped due to low similarity."
    return {
        "summary": {
            "alignment_method": status,
            "reason": message,
            "ssim": None,
        },
        "report": {
            "status": status,
            "reason": message,
        },
        "artifacts": None,
        "skipped": True,
    }


def _load_json(path: Path) -> Dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(f"Expected output JSON missing: {path}")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _parse_last_json(stdout: str) -> Dict[str, Any]:
    stdout = stdout.strip()
    if not stdout:
        return {}


def _image_size(image_path: Path) -> Dict[str, int]:
    try:
        with Image.open(image_path) as image:
            return {"width": image.width, "height": image.height}
    except Exception:
        return {}
    last_line = stdout.splitlines()[-1]
    try:
        return json.loads(last_line)
    except json.JSONDecodeError:
        return {}


def run_alignment_stage(
    job_root: Path,
    before_path: Path,
    after_path: Path,
    settings: Settings,
) -> Dict[str, Any]:
    stage_dir = job_root / "stages" / "alignment"
    stage_dir.mkdir(parents=True, exist_ok=True)

    feasible, reason = _assess_alignment_feasibility(before_path, after_path)
    if not feasible:
        logger.info(
            "Skipping alignment stage for %s vs %s: %s",
            before_path.name,
            after_path.name,
            reason,
        )
        return _alignment_skip_payload(reason)

    args = [
        "--before",
        str(before_path),
        "--after",
        str(after_path),
        "--output-dir",
        str(stage_dir),
        "--color-normalization",
        "auto",
    ]
    try:
        result = run_cli_stage("alignment", settings.alignment, settings, args=args, work_dir=stage_dir)
    except StageExecutionError as exc:
        logger.warning(
            "Alignment stage failed for %s vs %s: %s", before_path.name, after_path.name, exc
        )
        return _alignment_skip_payload(f"Alignment execution failed: {exc}", status="failed")

    report_path = stage_dir / "report.json"
    try:
        report = _load_json(report_path)
    except FileNotFoundError:
        logger.warning("Alignment report missing at %s", report_path)
        return _alignment_skip_payload("Alignment report missing after execution.", status="failed")

    summary = _parse_last_json(result.stdout)
    return {
        "summary": summary or report,
        "report": report,
        "artifacts": {
            "aligned": str(stage_dir / "aligned.png"),
            "diff": str(stage_dir / "diff_gray.png"),
            "mask": str(stage_dir / "mask.png"),
            "overlay": str(stage_dir / "overlay.png"),
            "heatmap": str(stage_dir / "heatmap.png"),
        },
    }


def _collect_yolo_rois(job_root: Path, stage_dir: Path) -> Optional[Path]:
    yolo_report = job_root / "stages" / "object_diff" / "component_report.json"
    if not yolo_report.is_file():
        return None
    try:
        with yolo_report.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except Exception:
        return None
    boxes: List[Dict[str, Any]] = []
    for entry in data.get("paired", []):
        box = entry.get("box_shared") or entry.get("box_after") or entry.get("box_before")
        if not box or len(box) != 4:
            continue
        boxes.append(
            {
                "box": [int(v) for v in box],
                "class_name": entry.get("class_name"),
                "confidence": entry.get("confidence"),
                "changed": bool(entry.get("changed")),
                "source": "object_diff",
            }
        )
    if not boxes:
        return None
    roi_path = stage_dir / "yolo_rois.json"
    try:
        with roi_path.open("w", encoding="utf-8") as handle:
            json.dump({"rois": boxes}, handle, indent=2)
    except Exception:
        return None
    return roi_path


def run_yolo_stage(
    job_root: Path,
    before_path: Path,
    after_path: Path,
    settings: Settings,
) -> Dict[str, Any]:
    stage_dir = job_root / "stages" / "object_diff"
    report_path = stage_dir / "component_report.json"
    args = [
        "--before",
        str(before_path),
        "--after",
        str(after_path),
        "--output",
        str(report_path),
        "--artifacts-dir",
        str(stage_dir / "artifacts"),
        "--save-overlay",
    ]
    result = run_cli_stage("object_diff", settings.yolo, settings, args=args, work_dir=stage_dir)
    stdout_summary = _parse_last_json(result.stdout)
    report = _load_json(report_path)
    report_artifacts = report.get("artifacts") if isinstance(report, dict) else {}
    overlay_path = report_artifacts.get("overlay") if isinstance(report_artifacts, dict) else None
    roi_dir = report_artifacts.get("roi_dir") if isinstance(report_artifacts, dict) else None
    if not overlay_path:
        overlay_file = stage_dir / "artifacts" / "component_diff_overlay.png"
        if overlay_file.is_file():
            overlay_path = str(overlay_file)
    if not roi_dir:
        roi_path = stage_dir / "artifacts" / "paired_rois"
        if roi_path.exists():
            roi_dir = str(roi_path)

    return {
        "summary": stdout_summary or report,
        "report": report,
        "imageSize": _image_size(after_path) or None,
        "artifacts": {
            "overlay": overlay_path,
            "paired_roi_dir": roi_dir,
            "roboflow_visualizations": report_artifacts.get("roboflow_visualizations") if isinstance(report_artifacts, dict) else None,
        },
    }


def run_pcb_cd_stage(
    job_root: Path,
    before_path: Path,
    after_path: Path,
    settings: Settings,
) -> Dict[str, Any]:
    stage_dir = job_root / "stages" / "pcb_cd"
    stage_dir.mkdir(parents=True, exist_ok=True)

    args = [
        "--before",
        str(before_path),
        "--after",
        str(after_path),
        "--output-dir",
        str(stage_dir),
    ]
    checkpoint_override = os.getenv("PCB_CD_CHECKPOINT")
    if checkpoint_override:
        args.extend(["--checkpoint", checkpoint_override])
    img_size_override = os.getenv("PCB_CD_IMG_SIZE")
    if img_size_override:
        args.extend(["--img-size", img_size_override])

    run_cli_stage("pcb_cd", settings.pcb_cd, settings, args=args, work_dir=stage_dir)
    report_path = stage_dir / "report.json"
    report = _load_json(report_path)

    mask_path = stage_dir / "mask.png"
    overlay_path = stage_dir / "overlay.png"
    heatmap_path = stage_dir / "heatmap.png"

    artifacts = {
        "mask": str(mask_path) if mask_path.exists() else None,
        "overlay": str(overlay_path) if overlay_path.exists() else None,
        "heatmap": str(heatmap_path) if heatmap_path.exists() else None,
        "report": str(report_path),
    }

    return {
        "summary": report,
        "artifacts": artifacts,
        "imageSize": report.get("imageSize") or _image_size(after_path) or None,
    }


def run_changeformer_stage(
    job_root: Path,
    before_path: Path,
    after_path: Path,
    settings: Settings,
) -> Dict[str, Any]:
    stage_dir = job_root / "stages" / "changeformer_cd"
    stage_dir.mkdir(parents=True, exist_ok=True)

    args = [
        "--before",
        str(before_path),
        "--after",
        str(after_path),
        "--output-dir",
        str(stage_dir),
    ]
    checkpoint_override = os.getenv("CHANGEFORMER_CHECKPOINT")
    if checkpoint_override:
        args.extend(["--checkpoint", checkpoint_override])
    img_size_override = os.getenv("CHANGEFORMER_IMG_SIZE")
    if img_size_override:
        args.extend(["--img-size", img_size_override])
    prob_threshold = os.getenv("CHANGEFORMER_PROB_THRESHOLD")
    if prob_threshold:
        args.extend(["--prob-threshold", prob_threshold])
    min_region_pixels = os.getenv("CHANGEFORMER_MIN_REGION_PIXELS")
    if min_region_pixels:
        args.extend(["--min-region-pixels", min_region_pixels])

    run_cli_stage("changeformer_cd", settings.changeformer, settings, args=args, work_dir=stage_dir)

    report_path = stage_dir / "report.json"
    report = _load_json(report_path)

    mask_path = stage_dir / "mask.png"
    overlay_path = stage_dir / "overlay.png"
    heatmap_path = stage_dir / "heatmap.png"

    artifacts = {
        "mask": str(mask_path) if mask_path.exists() else None,
        "overlay": str(overlay_path) if overlay_path.exists() else None,
        "heatmap": str(heatmap_path) if heatmap_path.exists() else None,
        "report": str(report_path),
    }

    return {
        "summary": report,
        "artifacts": artifacts,
        "imageSize": report.get("imageSize") or _image_size(after_path) or None,
    }


def run_mask_rcnn_stage(
    job_root: Path,
    after_path: Path,
    settings: Settings,
) -> Dict[str, Any]:
    stage_dir = job_root / "stages" / "mask_rcnn"
    stage_dir.mkdir(parents=True, exist_ok=True)
    mask_cfg: MaskRCNNConfig = settings.mask_rcnn
    args = [
        "--weights",
        str(mask_cfg.weights),
        "--image",
        str(after_path),
        "--output-dir",
        str(stage_dir),
        "--logs",
        str(mask_cfg.logs_dir),
    ]
    if mask_cfg.class_map:
        args.extend(["--class-map", str(mask_cfg.class_map)])
    roi_file = _collect_yolo_rois(job_root, stage_dir)
    if roi_file:
        args.extend(["--roi-file", str(roi_file)])
        roi_padding = os.getenv("MASK_RCNN_ROI_PADDING")
        if roi_padding:
            args.extend(["--roi-padding", roi_padding])
    result = run_cli_stage("mask_rcnn", mask_cfg, settings, args=args, work_dir=stage_dir)
    summary_path = stage_dir / "detections.json"
    if summary_path.exists():
        detections = _load_json(summary_path)
    else:
        detections = {"detections": []}
    return {
        "summary": detections,
        "imageSize": _image_size(after_path) or None,
        "artifacts": {
            "overlay": str(stage_dir / "overlay.png"),
            "raw": str(summary_path),
        },
        "logs": result.stdout,
    }
