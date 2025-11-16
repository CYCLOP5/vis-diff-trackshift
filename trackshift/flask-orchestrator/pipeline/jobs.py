"""Job orchestration and persistence helpers."""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple
from uuid import uuid4

from werkzeug.datastructures import FileStorage

from config import Settings
from .runner import StageExecutionError
from . import stages

logger = logging.getLogger(__name__)


@dataclass
class JobPaths:
    job_id: str
    root: Path

    @property
    def input_dir(self) -> Path:
        return self.root / "inputs"

    @property
    def stage_dir(self) -> Path:
        return self.root / "stages"

    @property
    def result_path(self) -> Path:
        return self.root / "result.json"

    def ensure_dirs(self) -> None:
        self.input_dir.mkdir(parents=True, exist_ok=True)
        self.stage_dir.mkdir(parents=True, exist_ok=True)


class JobManager:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.settings.data_root.mkdir(parents=True, exist_ok=True)

    def _create_job_paths(self) -> JobPaths:
        job_id = uuid4().hex
        root = self.settings.data_root / job_id
        root.mkdir(parents=True, exist_ok=True)
        job_paths = JobPaths(job_id=job_id, root=root)
        job_paths.ensure_dirs()
        return job_paths

    def _persist_upload(self, file: FileStorage, destination: Path) -> Path:
        suffix = Path(file.filename or "").suffix or ".png"
        destination.parent.mkdir(parents=True, exist_ok=True)
        final_path = destination.with_suffix(suffix)
        try:
            file.stream.seek(0)
        except AttributeError:
            pass
        file.save(final_path)
        return final_path

    def _save_result(self, job_paths: JobPaths, payload: Dict[str, Any]) -> Dict[str, Any]:
        with job_paths.result_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
        return payload

    def _persist_frames(self, frames: Sequence[FileStorage], job_paths: JobPaths) -> List[Dict[str, Any]]:
        stored: List[Dict[str, Any]] = []
        for idx, file in enumerate(frames):
            target = job_paths.input_dir / f"frame_{idx:02d}"
            stored_path = self._persist_upload(file, target)
            stored.append(
                {
                    "index": idx,
                    "path": stored_path,
                    "originalName": file.filename or f"frame_{idx:02d}"
                }
            )
        return stored

    @staticmethod
    def _comparison_pairs(frame_count: int, baseline_index: int, mode: str) -> List[Tuple[int, int]]:
        indices = list(range(frame_count))
        if frame_count < 2:
            return []
        if mode == "consecutive":
            return list(zip(indices[:-1], indices[1:]))
        # default baseline fan-out
        return [(baseline_index, idx) for idx in indices if idx != baseline_index]

    def _run_pipeline_for_pair(
        self,
        comparison_root: Path,
        before_path: Path,
        after_path: Path,
        domain: Optional[str] = None,
    ) -> Dict[str, Any]:
        comparison_root.mkdir(parents=True, exist_ok=True)
        results: Dict[str, Any] = {}
        domain_label = (domain or "").strip().lower()
        alignment_skip_reasons = {
            "manufacturing": "Alignment disabled for manufacturing domain.",
            "infrastructure": "Alignment disabled for infrastructure domain.",
        }
        skip_reason = alignment_skip_reasons.get(domain_label)
        if skip_reason:
            alignment_result = stages._alignment_skip_payload(skip_reason)
        else:
            alignment_result = stages.run_alignment_stage(comparison_root, before_path, after_path, self.settings)
        results["alignment"] = alignment_result

        aligned_after_path = after_path
        artifacts = alignment_result.get("artifacts") if isinstance(alignment_result, dict) else None
        if isinstance(artifacts, dict):
            aligned_candidate = artifacts.get("aligned")
            if aligned_candidate:
                candidate_path = Path(aligned_candidate)
                if candidate_path.is_file():
                    aligned_after_path = candidate_path

        if domain_label == "manufacturing":
            results["pcb_cd"] = stages.run_pcb_cd_stage(comparison_root, before_path, after_path, self.settings)
        elif domain_label == "infrastructure":
            results["changeformer_cd"] = stages.run_changeformer_stage(
                comparison_root,
                before_path,
                aligned_after_path,
                self.settings,
            )
        else:
            results["object_diff"] = stages.run_yolo_stage(comparison_root, before_path, after_path, self.settings)
            results["mask_rcnn"] = stages.run_mask_rcnn_stage(comparison_root, after_path, self.settings)
        return results

    def run_job(
        self,
        frames: Sequence[FileStorage],
        comparison_mode: str,
        baseline_index: int,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        job_paths = self._create_job_paths()
        logger.info("Starting job %s", job_paths.job_id)
        stored_frames = self._persist_frames(frames, job_paths)
        frame_count = len(stored_frames)
        if frame_count < 2:
            raise ValueError("At least two frames are required to compute differences.")
        if baseline_index < 0 or baseline_index >= frame_count:
            baseline_index = 0

        comparisons = self._comparison_pairs(frame_count, baseline_index, comparison_mode)
        domain_label = (metadata or {}).get("domain") if metadata else None
        if not comparisons:
            raise ValueError("No comparisons could be derived from provided frames.")

        timeline_entries: List[Dict[str, Any]] = []
        started = datetime.now(timezone.utc)
        status = "completed"
        error_payload: Optional[Dict[str, Any]] = None
        
        try:
            for before_idx, after_idx in comparisons:
                before_frame = stored_frames[before_idx]
                after_frame = stored_frames[after_idx]
                comparison_root = job_paths.root / "timeline" / f"frame_{after_idx:02d}"
                comparison_results = self._run_pipeline_for_pair(
                    comparison_root,
                    before_frame["path"],
                    after_frame["path"],
                    domain=domain_label,
                )
                timeline_entries.append(
                    {
                        "beforeIndex": before_idx,
                        "afterIndex": after_idx,
                        "beforePath": str(before_frame["path"].resolve()),
                        "afterPath": str(after_frame["path"].resolve()),
                        "comparisonRoot": str(comparison_root.resolve()),
                        "pipeline": comparison_results,
                    }
                )
        except (StageExecutionError, FileNotFoundError) as exc:
            status = "failed"
            error_payload = {
                "message": str(exc),
                "stage": getattr(exc.result, "stage", None) if isinstance(exc, StageExecutionError) else None,
                "stdout": getattr(exc.result, "stdout", None) if isinstance(exc, StageExecutionError) else None,
                "stderr": getattr(exc.result, "stderr", None) if isinstance(exc, StageExecutionError) else None,
            }
            logger.exception("Job %s failed", job_paths.job_id)

        finished = datetime.now(timezone.utc)
        duration_ms = int((finished - started).total_seconds() * 1000)
        payload: Dict[str, Any] = {
            "jobId": job_paths.job_id,
            "status": status,
            "startedAt": started.isoformat(),
            "completedAt": finished.isoformat(),
            "durationMs": duration_ms,
            "comparisonMode": comparison_mode,
            "baselineIndex": baseline_index,
            "frames": [
                {
                    "index": info["index"],
                    "path": str(info["path"].resolve()),
                    "originalName": info["originalName"],
                }
                for info in stored_frames
            ],
            "timeline": timeline_entries,
        }
        if timeline_entries:
            payload["pipeline"] = timeline_entries[-1]["pipeline"]
        if metadata:
            payload["metadata"] = metadata
        if error_payload:
            payload["error"] = error_payload

        logger.info("Job %s finished with status=%s", job_paths.job_id, status)
        return self._save_result(job_paths, payload)

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        result_path = self.settings.data_root / job_id / "result.json"
        if not result_path.is_file():
            return None
        with result_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
