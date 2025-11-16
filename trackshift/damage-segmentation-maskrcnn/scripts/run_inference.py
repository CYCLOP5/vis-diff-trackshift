from __future__ import annotations
import argparse
import json
import os
import sys
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence
import numpy as np
import skimage.io
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
VENDOR_ROOT = PROJECT_ROOT / "vendor" / "Mask-RCNN-TF2"
if str(VENDOR_ROOT) not in sys.path:
    sys.path.insert(0, str(VENDOR_ROOT))
from mrcnn import model as modellib
from mrcnn import visualize
from configs.f1_damage_config import F1DamageInferenceConfig, CANONICAL_DAMAGE_CLASSES

logger = logging.getLogger("mask_rcnn_inference")


@dataclass
class TaxonomyTranslator:
    mapping: Dict[str, str]
    fallback: Optional[str] = None

    def translate(self, legacy_label: str) -> str:
        if not legacy_label:
            return self.fallback or legacy_label
        normalized = legacy_label.lower()
        if normalized in self.mapping:
            return self.mapping[normalized]
        return self.fallback or legacy_label


def _clamp_box(box: Sequence[int], width: int, height: int) -> List[int]:
    x1, y1, x2, y2 = box
    x1 = max(0, min(width - 1, int(x1)))
    y1 = max(0, min(height - 1, int(y1)))
    x2 = max(x1 + 1, min(width, int(x2)))
    y2 = max(y1 + 1, min(height, int(y2)))
    return [x1, y1, x2, y2]


def _load_roi_entries(path: Path, width: int, height: int) -> List[Dict[str, object]]:
    if not path.is_file():
        logger.warning("ROI file %s not found; running on full image.", path)
        return []
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if isinstance(payload, dict):
        candidates = payload.get("rois") or payload.get("paired") or payload.get("boxes")
    else:
        candidates = payload
    rois: List[Dict[str, object]] = []
    if not isinstance(candidates, list):
        logger.warning("ROI payload missing list of boxes; running on full image.")
        return []
    for entry in candidates:
        if not isinstance(entry, dict):
            continue
        box = entry.get("box") or entry.get("box_shared") or entry.get("bbox")
        if not box or len(box) != 4:
            continue
        rois.append(
            {
                "box": _clamp_box(box, width, height),
                "class_name": entry.get("class_name"),
                "confidence": entry.get("confidence"),
                "changed": entry.get("changed"),
            }
        )
    return rois


def _expand_box(box: Sequence[int], padding: int, width: int, height: int) -> List[int]:
    x1, y1, x2, y2 = box
    return [
        max(0, x1 - padding),
        max(0, y1 - padding),
        min(width, x2 + padding),
        min(height, y2 + padding),
    ]


def _detect_with_rois(
    model: modellib.MaskRCNN,
    image: np.ndarray,
    rois: List[Dict[str, object]],
    padding: int,
) -> Dict[str, np.ndarray]:
    height, width = image.shape[:2]
    aggregated_rois: List[List[int]] = []
    aggregated_class_ids: List[int] = []
    aggregated_scores: List[Optional[float]] = []
    aggregated_masks: List[np.ndarray] = []
    source_meta: List[Dict[str, object]] = []
    for idx, entry in enumerate(rois):
        base_box = entry["box"]
        x1, y1, x2, y2 = _expand_box(base_box, padding, width, height)
        if x2 - x1 < 2 or y2 - y1 < 2:
            continue
        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            continue
        outputs = model.detect([crop], verbose=0)[0]
        local_rois = outputs.get("rois")
        local_class_ids = outputs.get("class_ids")
        local_scores = outputs.get("scores")
        local_masks = outputs.get("masks")
        if local_rois is None or len(local_rois) == 0 or local_class_ids is None:
            continue
        for det_idx, class_id in enumerate(local_class_ids):
            roi = local_rois[det_idx]
            y1_local, x1_local, y2_local, x2_local = [int(v) for v in roi]
            global_box = [
                max(0, min(height, y1 + y1_local)),
                max(0, min(width, x1 + x1_local)),
                max(0, min(height, y1 + y2_local)),
                max(0, min(width, x1 + x2_local)),
            ]
            aggregated_rois.append(global_box)
            aggregated_class_ids.append(int(class_id))
            score_value: Optional[float] = None
            if local_scores is not None and len(local_scores) > det_idx:
                try:
                    score_value = float(local_scores[det_idx])
                except (TypeError, ValueError):
                    score_value = None
            aggregated_scores.append(score_value)
            if local_masks is not None and local_masks.size:
                mask_slice = local_masks[:, :, det_idx]
                mask_canvas = np.zeros((height, width), dtype=bool)
                mask_canvas[y1:y2, x1:x2] = mask_slice.astype(bool)
                aggregated_masks.append(mask_canvas)
            else:
                aggregated_masks.append(np.zeros((height, width), dtype=bool))
            source_meta.append({"roi_index": idx, **entry})
    masks_array = np.stack(aggregated_masks, axis=2) if aggregated_masks else np.zeros((height, width, 0), dtype=bool)
    return {
        "rois": np.array(aggregated_rois, dtype=np.int32) if aggregated_rois else np.zeros((0, 4), dtype=np.int32),
        "class_ids": np.array(aggregated_class_ids, dtype=np.int32) if aggregated_class_ids else np.zeros(0, dtype=np.int32),
        "scores": np.array(aggregated_scores, dtype=np.float32) if aggregated_scores else np.zeros(0, dtype=np.float32),
        "masks": masks_array,
        "source_rois": source_meta,
    }
def load_class_names(class_map_path: Path | None) -> List[str]:
    if class_map_path is None:
        return list(CANONICAL_DAMAGE_CLASSES)
    with open(class_map_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    items = sorted(data.items(), key=lambda kv: kv[1])
    return [name for name, _ in items]


def load_taxonomy_translator(path: Optional[Path]) -> Optional[TaxonomyTranslator]:
    if path is None:
        return None
    if not path.is_file():
        logger.warning("Taxonomy map %s not found; legacy class labels will be used.", path)
        return None
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if not isinstance(payload, dict):
        logger.warning("Taxonomy map %s is not a JSON object; ignoring translator.", path)
        return None

    legacy_map = payload.get("legacy_map") if isinstance(payload.get("legacy_map"), dict) else None
    if legacy_map is None:
        # Allow simple {"dent": "front_wing_damage"} structure
        legacy_map = {k: v for k, v in payload.items() if isinstance(v, str)}
    fallback = payload.get("fallback") if isinstance(payload.get("fallback"), str) else None

    if not legacy_map:
        logger.warning("Taxonomy map %s does not define any legacy mappings; ignoring translator.", path)
        return None

    normalized_map = {k.lower(): v for k, v in legacy_map.items() if isinstance(k, str) and isinstance(v, str)}
    return TaxonomyTranslator(mapping=normalized_map, fallback=fallback)
def build_model(weights_path: Path, logs_dir: Path, class_names: List[str], config: F1DamageInferenceConfig) -> modellib.MaskRCNN:
    config.display()
    model = modellib.MaskRCNN(mode="inference", config=config, model_dir=str(logs_dir))
    try:
        model.load_weights(str(weights_path), by_name=True)
    except ValueError as exc:
        message = str(exc)
        if "mrcnn_bbox_fc" in message or "shape" in message:
            logger.warning(
                "Mask R-CNN head mismatch detected when loading %s, retrying with detection heads excluded.",
                weights_path,
            )
            model.load_weights(
                str(weights_path),
                by_name=True,
                exclude=["mrcnn_class_logits", "mrcnn_bbox_fc", "mrcnn_bbox", "mrcnn_mask"],
            )
            logger.warning(
                "Loaded backbone weights only. Detection heads remain randomly initialised; expect low accuracy until fine-tuned."
            )
        else:
            raise
    model.class_names = class_names
    return model
def render_overlay(
    image: np.ndarray,
    outputs: Dict[str, np.ndarray],
    class_names: List[str],
    output_path: Path,
) -> None:
    import matplotlib.pyplot as plt
    _, ax = plt.subplots(1, figsize=(12, 12))
    visualize.display_instances(
        image,
        outputs["rois"],
        outputs["masks"],
        outputs["class_ids"],
        class_names,
        scores=outputs.get("scores"),
        ax=ax,
        show_mask=True,
        show_bbox=True,
    )
    ax.set_title("F1 Damage Segmentation")
    plt.savefig(output_path, bbox_inches="tight")
    plt.close()


def summarise(
    outputs: Dict[str, np.ndarray],
    class_names: List[str],
    translator: Optional[TaxonomyTranslator] = None,
) -> List[Dict[str, object]]:
    summary: List[Dict[str, object]] = []
    rois = outputs["rois"]
    class_ids = outputs["class_ids"]
    scores = outputs.get("scores", [])
    source_rois = outputs.get("source_rois") or []
    for idx, class_id in enumerate(class_ids):
        y1, x1, y2, x2 = [int(v) for v in rois[idx]]
        score = float(scores[idx]) if len(scores) else None
        mask = outputs["masks"][:, :, idx]
        area = int(mask.sum())
        legacy_class_name = class_names[class_id] if class_id < len(class_names) else str(class_id)
        translated_name = translator.translate(legacy_class_name) if translator else legacy_class_name

        entry: Dict[str, object] = {
            "class_id": int(class_id),
            "class_name": translated_name,
            "legacy_class_name": legacy_class_name,
            "bbox": [y1, x1, y2, x2],
            "score": score,
            "mask_area": area,
        }
        if translator:
            entry["translation_source"] = "taxonomy_map"
        if len(source_rois) > idx:
            entry["source_roi"] = source_rois[idx]
        summary.append(entry)
    return summary
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Mask R-CNN damage inference.")
    parser.add_argument("--weights", required=True, type=Path)
    parser.add_argument("--image", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--class-map", type=Path, default=None)
    parser.add_argument(
        "--taxonomy-map",
        type=Path,
        default=Path("assets/class_maps/f1_damage_translation.json"),
        help="Optional map translating legacy model classes to the new F1 taxonomy.",
    )
    parser.add_argument("--logs", type=Path, default=Path("outputs/keras_logs"))
    parser.add_argument("--min-conf", type=float, default=None, help="Override DETECTION_MIN_CONFIDENCE (e.g., 0.2)")
    parser.add_argument("--roi-file", type=Path, default=None, help="Optional JSON file containing ROI coordinates.")
    parser.add_argument(
        "--roi-padding",
        type=int,
        default=20,
        help="Padding (pixels) to include around each ROI crop before running inference.",
    )
    return parser.parse_args()
def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.logs.mkdir(parents=True, exist_ok=True)
    class_names = load_class_names(args.class_map)
    translator = load_taxonomy_translator(args.taxonomy_map)
    display_class_names = (
        [translator.translate(name) for name in class_names]
        if translator else class_names
    )
    config = F1DamageInferenceConfig()
    if args.min_conf is not None:
        config.DETECTION_MIN_CONFIDENCE = float(args.min_conf)
    model = build_model(args.weights, args.logs, class_names, config)
    image = skimage.io.imread(str(args.image))
    if image.ndim == 2:
        image = np.stack([image] * 3, axis=-1)
    if image.shape[-1] == 4:
        image = image[:, :, :3]
    roi_entries: List[Dict[str, object]] = []
    if args.roi_file:
        roi_entries = _load_roi_entries(args.roi_file, image.shape[1], image.shape[0])
        if roi_entries:
            logger.info("Running Mask R-CNN on %s ROI(s) extracted from %s", len(roi_entries), args.roi_file)
    if roi_entries:
        outputs = _detect_with_rois(model, image, roi_entries, padding=int(args.roi_padding))
    else:
        outputs = model.detect([image], verbose=0)[0]
    overlay_path = args.output_dir / "overlay.png"
    render_overlay(image, outputs, display_class_names, overlay_path)
    summary = summarise(outputs, class_names, translator)
    summary_path = args.output_dir / "detections.json"
    with summary_path.open("w", encoding="utf-8") as fp:
        json.dump({"detections": summary}, fp, indent=2)
    print(f"Saved overlay to {overlay_path}")
    print(f"Saved detections to {summary_path}")
if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("MASK_RCNN_LOG_LEVEL", "INFO"))
    main()