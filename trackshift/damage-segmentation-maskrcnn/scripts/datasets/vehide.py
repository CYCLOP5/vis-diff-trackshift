from __future__ import annotations
import json
import os
from typing import Iterable, List, Tuple
import numpy as np
import skimage.draw
from PIL import Image
from mrcnn import utils
from .damage_taxonomy import CANONICAL_DAMAGE_CLASSES, CANONICAL_TO_ID, canonical_label
class VehiDEDataset(utils.Dataset):
    SOURCE_NAME = "vehide"
    def load_vehide(
        self,
        dataset_dir: str,
        subset: str,
        annotation_filename: str | None = None,
    ) -> None:
        normalised_subset = {
            "validation": "val",
            "val": "val",
            "train": "train",
            "test": "test",
        }.get(subset.lower(), subset.lower())
        if normalised_subset not in {"train", "val", "test"}:
            raise ValueError(f"Unsupported subset '{subset}'.")
        for idx, name in enumerate(CANONICAL_DAMAGE_CLASSES[1:], start=1):
            self.add_class(self.SOURCE_NAME, idx, name)
        annotations_path = self._resolve_annotations_path(
            dataset_dir, normalised_subset, annotation_filename
        )
        with open(annotations_path, "r", encoding="utf-8") as handle:
            raw_data = json.load(handle)
        if isinstance(raw_data, dict):
            entries_iter = raw_data.items()
        else:
            entries_iter = enumerate(raw_data)
        for entry_key, entry in entries_iter:
            if not isinstance(entry, dict):
                continue
            regions = entry.get("regions") or []
            if isinstance(regions, dict):
                regions = list(regions.values())
            normalised_regions = self._normalise_regions(regions)
            if not normalised_regions:
                continue
            candidate_names: List[str] = [
                entry.get("filepath"),
                entry.get("filename"),
                entry.get("name"),
            ]
            if isinstance(entry_key, str):
                candidate_names.append(entry_key)
            image_path = self._resolve_image_path(
                dataset_dir, normalised_subset, candidate_names
            )
            if image_path is None:
                raise FileNotFoundError(
                    "Unable to locate image for entry '{}' looked up via {}.".format(
                        entry.get("name") or entry_key, [n for n in candidate_names if n]
                    )
                )
            image_meta = entry.get("file_attributes", {})
            width = entry.get("width") or image_meta.get("width")
            height = entry.get("height") or image_meta.get("height")
            if not width or not height:
                height, width = self._infer_image_shape(image_path)
            image_id = (
                entry.get("filename")
                or entry.get("name")
                or (entry_key if isinstance(entry_key, str) else str(entry_key))
            )
            self.add_image(
                self.SOURCE_NAME,
                image_id=image_id,
                path=image_path,
                width=int(width),
                height=int(height),
                regions=normalised_regions,
            )
    def load_mask(self, image_id: int) -> Tuple[np.ndarray, np.ndarray]:
        info = self.image_info[image_id]
        if info["source"] != self.SOURCE_NAME:
            return super().load_mask(image_id)
        masks: List[np.ndarray] = []
        class_ids: List[int] = []
        for region in info.get("regions", []):
            attrs = region.get("region_attributes", {})
            raw_label = (
                attrs.get("damage")
                or attrs.get("label")
                or region.get("class")
                or ""
            )
            mapped = canonical_label(raw_label, self.SOURCE_NAME)
            if not mapped:
                continue
            shape = region.get("shape_attributes", {})
            all_x: Iterable[int] = (
                shape.get("all_points_x")
                or shape.get("all_x")
                or region.get("all_points_x")
                or region.get("all_x")
                or []
            )
            all_y: Iterable[int] = (
                shape.get("all_points_y")
                or shape.get("all_y")
                or region.get("all_points_y")
                or region.get("all_y")
                or []
            )
            if len(all_x) < 3 or len(all_y) < 3:
                continue
            all_x_arr = np.asarray(list(all_x), dtype=np.float32)
            all_y_arr = np.asarray(list(all_y), dtype=np.float32)
            all_x_arr = np.clip(all_x_arr, 0, info["width"] - 1)
            all_y_arr = np.clip(all_y_arr, 0, info["height"] - 1)
            rr, cc = skimage.draw.polygon(
                all_y_arr.astype(np.int32),
                all_x_arr.astype(np.int32),
                (info["height"], info["width"]),
            )
            mask = np.zeros((info["height"], info["width"]), dtype=np.bool_)
            mask[rr, cc] = True
            masks.append(mask)
            class_ids.append(CANONICAL_TO_ID[mapped])
        if not masks:
            print(f"WARNING: No valid mask for image_id={image_id}, path={info.get('path')}")
            return super().load_mask(image_id)
        stacked = np.stack(masks, axis=-1)
        return stacked, np.array(class_ids, dtype=np.int32)
    def image_reference(self, image_id: int) -> str:
        info = self.image_info[image_id]
        if info["source"] == self.SOURCE_NAME:
            return info["path"]
        return super().image_reference(image_id)
    def _infer_image_shape(self, image_path: str) -> Tuple[int, int]:
        try:
            with Image.open(image_path) as handle:
                width, height = handle.size
                if width and height:
                    return int(height), int(width)
        except Exception as exc:  
            last_error = exc
        else:
            last_error = None
        from skimage.io import imread
        loaded = imread(image_path)
        if loaded.ndim >= 2:
            height, width = loaded.shape[:2]
            return int(height), int(width)
        message = f"Unable to infer image shape for '{image_path}'."
        if last_error:
            message += f" Pillow error: {last_error}."
        raise ValueError(message)
    def _resolve_annotations_path(
        self,
        dataset_dir: str,
        subset: str,
        annotation_filename: str | None,
    ) -> str:
        candidates: List[str] = []
        if annotation_filename:
            candidates.append(annotation_filename)
        else:
            subset_specific = {
                "train": ["0Train_via_annos.json", "train_via_annos.json"],
                "val": [
                    "0Val_via_annos.json",
                    "val_via_annos.json",
                    "validation_via_annos.json",
                ],
                "test": ["0Test_via_annos.json", "test_via_annos.json"],
            }.get(subset, [])
            candidates.extend(subset_specific)
            candidates.extend([
                f"vehide_{subset}.json",
                f"{subset}.json",
            ])
        search_roots = [dataset_dir, os.path.join(dataset_dir, "annotations")]
        attempted_paths: List[str] = []
        for candidate in candidates:
            if not candidate:
                continue
            if os.path.isabs(candidate) and os.path.exists(candidate):
                return candidate
            for root in search_roots:
                attempt = os.path.normpath(os.path.join(root, candidate))
                if attempt in attempted_paths:
                    continue
                attempted_paths.append(attempt)
                if os.path.exists(attempt):
                    return attempt
        formatted_attempts = ", ".join(attempted_paths) if attempted_paths else ", ".join(candidates)
        raise FileNotFoundError(
            f"Annotation file not found for subset '{subset}'. Tried: {formatted_attempts}."
        )
    def _resolve_image_path(
        self,
        dataset_dir: str,
        subset: str,
        candidate_names: Iterable[str],
    ) -> str | None:
        subset_dirs = {
            "train": [
                "train",
                os.path.join("train", "images"),
                "image",
                os.path.join("image", "image"),
            ],
            "val": [
                "val",
                "validation",
                os.path.join("validation", "validation"),
                "image",
            ],
            "test": [
                "test",
                "testing",
                os.path.join("test", "images"),
            ],
        }
        search_roots: List[str] = [dataset_dir]
        for rel in ["images", "image", "validation", os.path.join("image", "image"), os.path.join("validation", "validation")]:
            search_roots.append(os.path.join(dataset_dir, rel))
        for rel in subset_dirs.get(subset, []):
            search_roots.append(os.path.join(dataset_dir, rel))
        unique_roots: List[str] = []
        for root in search_roots:
            normalised = os.path.normpath(root)
            if normalised not in unique_roots:
                unique_roots.append(normalised)
        for name in candidate_names:
            if not name:
                continue
            if os.path.isabs(name) and os.path.exists(name):
                return name
            normalised_name = name.lstrip("./")
            for root in unique_roots:
                attempt = os.path.normpath(os.path.join(root, normalised_name))
                if os.path.exists(attempt):
                    return attempt
        return None
    def _normalise_regions(self, regions: Iterable[dict]) -> List[dict]:
        normalised: List[dict] = []
        for region in regions:
            if not isinstance(region, dict):
                continue
            if region.get("shape_attributes") and region.get("region_attributes"):
                normalised.append(region)
                continue
            label = region.get("class") or region.get("label") or region.get("damage")
            points_x = (
                region.get("all_points_x")
                or region.get("all_x")
                or region.get("points_x")
            )
            points_y = (
                region.get("all_points_y")
                or region.get("all_y")
                or region.get("points_y")
            )
            if not label or not points_x or not points_y:
                continue
            normalised.append(
                {
                    "shape_attributes": {
                        "name": "polygon",
                        "all_points_x": list(points_x),
                        "all_points_y": list(points_y),
                    },
                    "region_attributes": {
                        "damage": label,
                        "label": label,
                    },
                }
            )
        return normalised