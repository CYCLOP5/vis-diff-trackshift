from __future__ import annotations
import argparse
import os
import sys
from pathlib import Path
from typing import Iterable, List, Sequence
import numpy as np
import tensorflow as tf
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
VENDOR_ROOT = PROJECT_ROOT / "vendor" / "Mask-RCNN-TF2"
if str(VENDOR_ROOT) not in sys.path:
    sys.path.insert(0, str(VENDOR_ROOT))
from mrcnn import model as modellib
from mrcnn import utils
from configs.f1_damage_config import F1DamageTrainingConfig, CANONICAL_DAMAGE_CLASSES
from scripts.datasets.cardd import CardDDataset
from scripts.datasets.vehide import VehiDEDataset
class CombinedDamageDataset(utils.Dataset):
    SOURCE_NAME = "f1_damage"
    def __init__(self) -> None:
        super().__init__()
        for idx, name in enumerate(CANONICAL_DAMAGE_CLASSES[1:], start=1):
            self.add_class(self.SOURCE_NAME, idx, name)
    def extend(self, dataset: utils.Dataset) -> None:
        dataset.prepare()
        for delegate_index in dataset.image_ids:
            info = dataset.image_info[delegate_index]
            if not info.get("source"):
                continue
            delegate_key = f"{info['source']}::{info['id']}"
            extras = {
                "delegate": dataset,
                "delegate_image_index": int(delegate_index),
                "delegate_source": info["source"],
            }
            payload = {
                key: info[key]
                for key in ("path", "width", "height", "annotations", "regions")
                if key in info
            }
            self.add_image(
                source=self.SOURCE_NAME,
                image_id=delegate_key,
                **payload,
                **extras,
            )
    def load_mask(self, image_id: int):
        info = self.image_info[image_id]
        delegate: utils.Dataset | None = info.get("delegate")
        delegate_index = info.get("delegate_image_index")
        if delegate is None or delegate_index is None:
            return super().load_mask(image_id)
        return delegate.load_mask(delegate_index)
    def image_reference(self, image_id: int) -> str:
        info = self.image_info[image_id]
        delegate: utils.Dataset | None = info.get("delegate")
        delegate_index = info.get("delegate_image_index")
        if delegate is None or delegate_index is None:
            return super().image_reference(image_id)
        return delegate.image_reference(delegate_index)
def build_dataset(dataset_root: Path, include: Sequence[str], subset: str) -> utils.Dataset:
    combined = CombinedDamageDataset()
    if "cardd" in include:
        cardd_dir = dataset_root / "cardd"
        dataset = CardDDataset()
        dataset.load_cardd(str(cardd_dir), subset=subset)
        combined.extend(dataset)
    if "vehide" in include:
        vehide_dir = dataset_root / "vehide"
        dataset = VehiDEDataset()
        dataset.load_vehide(str(vehide_dir), subset=subset)
        combined.extend(dataset)
    combined.prepare()
    return combined
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fine-tune Mask R-CNN on F1 damage datasets")
    parser.add_argument("--dataset-root", type=Path, required=True, help="Root directory with dataset folders")
    parser.add_argument(
        "--include",
        nargs="+",
        default=["cardd", "vehide"],
        choices=["cardd", "vehide"],
        help="Datasets to include in the unified training split",
    )
    parser.add_argument("--weights", default="coco", help="Path to weights file or shortcut (coco|imagenet|last)")
    parser.add_argument("--logs", type=Path, default=Path("outputs/training_logs"), help="Directory for training logs")
    parser.add_argument("--head-epochs", type=int, default=12, help="Epochs for heads-only stage")
    parser.add_argument("--full-epochs", type=int, default=24, help="Epochs for full-network fine-tune")
    parser.add_argument("--learning-rate", type=float, default=1e-3, help="Initial learning rate")
    parser.add_argument("--min-dim", type=int, default=768, help="Override config.IMAGE_MIN_DIM")
    parser.add_argument("--max-dim", type=int, default=1024, help="Override config.IMAGE_MAX_DIM")
    parser.add_argument("--steps-per-epoch", type=int, default=100)
    parser.add_argument("--validation-steps", type=int, default=100)
    parser.add_argument("--train-rois", type=int, default=256, help="Training ROIs per image")
    parser.add_argument("--images-per-gpu", type=int, default=1)
    parser.add_argument("--resume", action="store_true", help="Skip heads training and continue full fine-tune")
    return parser.parse_args()
def configure_training(args: argparse.Namespace) -> F1DamageTrainingConfig:
    config = F1DamageTrainingConfig()
    config.IMAGE_MIN_DIM = args.min_dim
    config.IMAGE_MAX_DIM = args.max_dim
    config.STEPS_PER_EPOCH = args.steps_per_epoch
    config.VALIDATION_STEPS = args.validation_steps
    config.TRAIN_ROIS_PER_IMAGE = args.train_rois
    config.IMAGES_PER_GPU = args.images_per_gpu
    try:
        gpus = tf.config.list_physical_devices("GPU")
        config.GPU_COUNT = max(1, len(gpus))
    except Exception:
        config.GPU_COUNT = 1
    config.BATCH_SIZE = config.IMAGES_PER_GPU * config.GPU_COUNT
    return config
def load_weights(model: modellib.MaskRCNN, weights: str) -> None:
    if weights.lower() == "coco":
        coco_path = Path("assets/weights/mask_rcnn_coco.h5")
        if not coco_path.exists():
            raise FileNotFoundError(
                "COCO weights not found. Download mask_rcnn_coco.h5 under assets/weights/"
            )
        model.load_weights(str(coco_path), by_name=True, exclude=[
            "mrcnn_class_logits",
            "mrcnn_bbox_fc",
            "mrcnn_bbox",
            "mrcnn_mask",
        ])
    elif weights.lower() == "imagenet":
        model.load_weights(model.get_imagenet_weights(), by_name=True)
    elif weights.lower() == "last":
        model.load_weights(model.find_last(), by_name=True)
    else:
        model.load_weights(weights, by_name=True)
def main() -> None:
    args = parse_args()
    args.logs.mkdir(parents=True, exist_ok=True)
    try:
        gpus = tf.config.list_physical_devices("GPU")
        if gpus:
            for g in gpus:
                try:
                    tf.config.experimental.set_memory_growth(g, True)
                except Exception:
                    pass
    except Exception:
        pass
    config = configure_training(args)
    config.display()
    dataset_root = args.dataset_root.resolve()
    train_dataset = build_dataset(dataset_root, args.include, subset="train")
    val_dataset = build_dataset(dataset_root, args.include, subset="val")
    if len(train_dataset.image_ids) == 0:
        raise RuntimeError("No training images found. Check dataset paths and include filters.")
    if len(val_dataset.image_ids) == 0:
        raise RuntimeError("No validation images found. Check dataset paths and include filters.")
    model = modellib.MaskRCNN(mode="training", config=config, model_dir=str(args.logs))
    load_weights(model, args.weights)
    if not args.resume:
        print("Training detection heads...")
        model.train(
            train_dataset,
            val_dataset,
            learning_rate=args.learning_rate,
            epochs=args.head_epochs,
            layers="heads",
        )
    print("Fine-tuning all layers...")
    model.train(
        train_dataset,
        val_dataset,
        learning_rate=args.learning_rate / 10.0,
        epochs=args.head_epochs + args.full_epochs,
        layers="all",
    )
if __name__ == "__main__":
    main()