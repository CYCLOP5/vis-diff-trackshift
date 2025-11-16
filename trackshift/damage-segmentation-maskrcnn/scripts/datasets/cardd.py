from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Tuple
import numpy as np
from pycocotools.coco import COCO
from pycocotools import mask as mask_utils
from mrcnn import utils
from .damage_taxonomy import (
    CANONICAL_DAMAGE_CLASSES,
    CANONICAL_TO_ID,
    CARD_RAW_TO_CANONICAL,
    canonical_label,
)
class CardDDataset(utils.Dataset):
    SOURCE_NAME = "cardd"
    def load_cardd(
        self,
        dataset_dir: str,
        subset: str,
        image_subdir: str | None = None,
        annotation_filename: str | None = None,
    ) -> None:
        if subset not in {"train", "val", "test"}:
            raise ValueError(f"Unsupported subset '{subset}'.")
        for idx, name in enumerate(CANONICAL_DAMAGE_CLASSES[1:], start=1):
            self.add_class(self.SOURCE_NAME, idx, name)
        annotations_dir = Path(dataset_dir) / "annotations"
        candidate_files = []
        if annotation_filename is not None:
            candidate_files.append(Path(dataset_dir) / annotation_filename)
            candidate_files.append(annotations_dir / annotation_filename)
        else:
            candidate_files.extend(
                [
                    annotations_dir / f"cardd_{subset}.json",
                    annotations_dir / f"{subset}.json",
                    Path(dataset_dir) / f"cardd_{subset}.json",
                    Path(dataset_dir) / f"{subset}.json",
                ]
            )
        ann_path: Path | None = None
        for candidate in candidate_files:
            if candidate and candidate.exists():
                ann_path = candidate
                break
        if ann_path is None:
            searched = "\n".join(str(p) for p in candidate_files if p)
            raise FileNotFoundError(
                "Unable to locate CarDD annotation file. Checked:\n" + searched
            )
        image_dir = os.path.join(dataset_dir, image_subdir or subset)
        if not os.path.isdir(image_dir):
            raise FileNotFoundError(
                f"Image directory '{image_dir}' not found."
            )
        coco = COCO(ann_path)
        image_ids = list(coco.imgs.keys())
        for image_id in image_ids:
            info = coco.loadImgs(image_id)[0]
            file_name = info["file_name"]
            path = os.path.join(image_dir, file_name)
            if not os.path.exists(path):
                raise FileNotFoundError(f"Expected image at '{path}'")
            annotations = coco.loadAnns(coco.getAnnIds(imgIds=[image_id]))
            self.add_image(
                self.SOURCE_NAME,
                image_id=image_id,
                path=path,
                width=info["width"],
                height=info["height"],
                annotations=annotations,
            )
        self._coco = coco
    def load_mask(self, image_id: int) -> Tuple[np.ndarray, np.ndarray]:
        image_info = self.image_info[image_id]
        if image_info["source"] != self.SOURCE_NAME:
            return super().load_mask(image_id)
        annotations = image_info.get("annotations", [])
        masks = []
        class_ids = []
        for ann in annotations:
            raw_label = ann.get("damage_type") or ann.get("category", "")
            mapped = canonical_label(raw_label, self.SOURCE_NAME)
            if not mapped:
                continue
            class_id = CANONICAL_TO_ID[mapped]
            rle = ann.get("segmentation")
            if isinstance(rle, list):
                rle = mask_utils.frPyObjects(rle, image_info["height"], image_info["width"])
            elif isinstance(rle, dict) and "counts" in rle:
                rle = mask_utils.frPyObjects(rle, image_info["height"], image_info["width"])
            mask = mask_utils.decode(rle)
            if mask.max() < 1:
                continue
            masks.append(mask.astype(np.bool_))
            class_ids.append(class_id)
        if not masks:
            print(f"SKIP: No valid mask for image_id={image_id}, path={image_info.get('path')}")
            return np.zeros((image_info["height"], image_info["width"], 0), dtype=np.bool_), np.array([], dtype=np.int32)
        stacked = np.stack(masks, axis=-1)
        return stacked, np.array(class_ids, dtype=np.int32)
    def image_reference(self, image_id: int) -> str:
        info = self.image_info[image_id]
        if info["source"] == self.SOURCE_NAME:
            return info["path"]
        return super().image_reference(image_id)