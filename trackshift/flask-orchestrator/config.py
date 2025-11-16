"""Configuration helpers for the Flask orchestration service."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os
import sys
from typing import Optional

PROJECT_ROOT = Path(__file__).resolve().parents[1]
FLASK_ROOT = Path(__file__).resolve().parent


@dataclass(frozen=True, kw_only=True)
class StageConfig:
    """Generic configuration for a CLI-driven stage."""

    script: Path
    env_name: Optional[str] = None

    def ensure_exists(self) -> None:
        if not self.script.is_file():
            raise FileNotFoundError(f"Stage script not found: {self.script}")


@dataclass(frozen=True, kw_only=True)
class MaskRCNNConfig(StageConfig):
    """Extended configuration for the Mask R-CNN stage."""

    weights: Path
    logs_dir: Path
    class_map: Optional[Path] = None

    def ensure_exists(self) -> None:  # type: ignore[override]
        super().ensure_exists()
        if not self.weights.is_file():
            raise FileNotFoundError(f"Mask R-CNN weights missing: {self.weights}")
        if self.class_map and not self.class_map.is_file():
            raise FileNotFoundError(f"Mask R-CNN class map missing: {self.class_map}")
        self.logs_dir.mkdir(parents=True, exist_ok=True)


@dataclass(frozen=True)
class Settings:
    """Container for orchestrator settings derived from environment variables."""

    data_root: Path
    python_bin: str
    conda_exe: Optional[str]
    alignment: StageConfig
    yolo: StageConfig
    pcb_cd: StageConfig
    changeformer: StageConfig
    mask_rcnn: MaskRCNNConfig

    def ensure_valid(self) -> None:
        self.data_root.mkdir(parents=True, exist_ok=True)
        self.alignment.ensure_exists()
        self.yolo.ensure_exists()
        self.pcb_cd.ensure_exists()
        self.changeformer.ensure_exists()
        self.mask_rcnn.ensure_exists()


def _optional_path(value: Optional[str]) -> Optional[Path]:
    return Path(value).expanduser() if value else None


def _discover_training_weight() -> Optional[Path]:
    training_root = PROJECT_ROOT / "damage-segmentation-maskrcnn" / "outputs" / "training_logs"
    if not training_root.is_dir():
        return None
    candidates = sorted(training_root.glob("**/mask_rcnn_f1_damage_*.h5"))
    if candidates:
        return candidates[-1]
    return None


def _detect_conda_exe() -> Optional[str]:
    explicit = os.getenv("CONDA_EXE")
    if explicit:
        return explicit
    candidates = [
        Path.home() / "miniconda3" / "bin" / "conda",
        Path.home() / "anaconda3" / "bin" / "conda",
        Path("/opt/conda/bin/conda"),
        Path("/usr/bin/conda"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    return None


def load_settings() -> Settings:
    """Load settings using environment variables with sensible defaults."""

    default_data_root = FLASK_ROOT / "data" / "jobs"
    data_root = _optional_path(os.getenv("ORCHESTRATOR_DATA_ROOT")) or default_data_root

    python_bin = os.getenv("ORCHESTRATOR_PYTHON", sys.executable)
    conda_exe = _detect_conda_exe()

    alignment_script = _optional_path(os.getenv("ALIGNMENT_SCRIPT")) or (
        PROJECT_ROOT / "alignment-ssim-mvp" / "alignment_ssim.py"
    )
    yolo_script = _optional_path(os.getenv("YOLO_SCRIPT")) or (
        PROJECT_ROOT / "object-diff-yolo" / "object_diff.py"
    )
    pcb_cd_script = _optional_path(os.getenv("PCB_CD_SCRIPT")) or (
        PROJECT_ROOT / "flask-orchestrator" / "stages" / "pcb_cd_infer.py"
    )
    mask_script = _optional_path(os.getenv("MASK_RCNN_SCRIPT")) or (
        PROJECT_ROOT / "damage-segmentation-maskrcnn" / "scripts" / "run_inference.py"
    )
    changeformer_script = _optional_path(os.getenv("CHANGEFORMER_SCRIPT")) or (
        PROJECT_ROOT / "flask-orchestrator" / "stages" / "changeformer_cd.py"
    )

    default_mask_weights = _discover_training_weight() or (
        PROJECT_ROOT
        / "damage-segmentation-maskrcnn"
        / "assets"
        / "weights"
        / "mask_rcnn_coco.h5"
    )
    mask_weights = _optional_path(os.getenv("MASK_RCNN_WEIGHTS")) or default_mask_weights
    mask_class_map = _optional_path(os.getenv("MASK_RCNN_CLASS_MAP")) or (
        PROJECT_ROOT / "damage-segmentation-maskrcnn" / "assets" / "class_maps" / "f1_damage_taxonomy.json"
    )
    mask_logs = _optional_path(os.getenv("MASK_RCNN_LOGS")) or (
        PROJECT_ROOT / "damage-segmentation-maskrcnn" / "outputs" / "logs"
    )

    settings = Settings(
        data_root=data_root,
        python_bin=python_bin,
        conda_exe=conda_exe,
        alignment=StageConfig(
            script=alignment_script,
            env_name=os.getenv("ALIGNMENT_ENV") or "vde-mvp",
        ),
        yolo=StageConfig(
            script=yolo_script,
            env_name=os.getenv("YOLO_ENV") or "vde-orchestrator",
        ),
        pcb_cd=StageConfig(
            script=pcb_cd_script,
            env_name=os.getenv("PCB_CD_ENV") or "manupipe2",
        ),
        changeformer=StageConfig(
            script=changeformer_script,
            env_name=os.getenv("CHANGEFORMER_ENV") or "changeformer",
        ),
        mask_rcnn=MaskRCNNConfig(
            script=mask_script,
            env_name=os.getenv("MASK_RCNN_ENV") or "vde-pro",
            weights=mask_weights,
            class_map=mask_class_map,
            logs_dir=mask_logs,
        ),
    )

    settings.ensure_valid()
    return settings
