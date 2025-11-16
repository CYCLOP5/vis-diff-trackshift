from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Iterable, Mapping, Optional, Sequence
CANONICAL_DAMAGE_CLASSES: Sequence[str] = (
    "background",
    "dent",
    "scratch",
    "crack",
    "glass_shatter",
    "lamp_broken",
    "tire_flat",
    "missing_part",
    "paint_peel",
    "puncture",
)
CARD_RAW_TO_CANONICAL: Mapping[str, str] = {
    "dent": "dent",
    "scratch": "scratch",
    "crack": "crack",
    "glass shatter": "glass_shatter",
    "lamp broken": "lamp_broken",
    "flat tire": "tire_flat",
    "missing part": "missing_part",
    "paint peel": "paint_peel",
    "puncture": "puncture",
}
VEHIDE_RAW_TO_CANONICAL: Mapping[str, str] = {
    "dent": "dent",
    "scratch": "scratch",
    "crack": "crack",
    "glass_shatter": "glass_shatter",
    "head_lamp_broken": "lamp_broken",
    "flat_tire": "tire_flat",
    "missing_part": "missing_part",
    "paint_peel": "paint_peel",
    "puncture": "puncture",
    "mat_bo_phan": "missing_part",
    "mop_lom": "dent",
    "rach": "scratch",
    "tray_son": "paint_peel",
    "be_den": "lamp_broken",
    "thung": "puncture",
    "vo_kinh": "glass_shatter",
}
CANONICAL_TO_ID: Dict[str, int] = {
    name: idx for idx, name in enumerate(CANONICAL_DAMAGE_CLASSES)
}
@dataclass(frozen=True)
class TaxonomyLookup:
    classes: Sequence[str]
    mapping: Mapping[str, int]
    def to_dict(self) -> Dict[str, int]:
        return {name: self.mapping[name] for name in self.classes}
def canonical_label(raw_label: str, source: str) -> Optional[str]:
    label = raw_label.strip().lower().replace("-", " ")
    mapping: Mapping[str, str]
    if source == "cardd":
        mapping = CARD_RAW_TO_CANONICAL
    elif source == "vehide":
        mapping = VEHIDE_RAW_TO_CANONICAL
    else:
        raise ValueError(f"Unsupported dataset source '{source}'.")
    return mapping.get(label)
def class_ids_for(source: str, raw_labels: Iterable[str]) -> Sequence[int]:
    ids = []
    for raw in raw_labels:
        normalised = canonical_label(raw, source)
        if normalised and normalised in CANONICAL_TO_ID:
            ids.append(CANONICAL_TO_ID[normalised])
    return ids
TAXONOMY_LOOKUP = TaxonomyLookup(
    classes=CANONICAL_DAMAGE_CLASSES,
    mapping=CANONICAL_TO_ID,
)