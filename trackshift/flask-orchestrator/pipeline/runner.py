"""Utilities to execute CLI-driven stages for the orchestrator."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import logging
import os
import shlex
import subprocess
from typing import Iterable, List, Optional

from config import Settings, StageConfig

logger = logging.getLogger(__name__)


@dataclass
class StageResult:
    """Container for low-level process execution output."""

    stage: str
    command: List[str]
    stdout: str
    stderr: str
    returncode: int
    work_dir: Path


class StageExecutionError(RuntimeError):
    """Raised when an external CLI stage fails."""

    def __init__(self, result: StageResult, message: Optional[str] = None) -> None:
        self.result = result
        base = message or f"Stage '{result.stage}' failed with exit code {result.returncode}."
        super().__init__(base)


def _resolve_conda_command(settings: Settings, env_name: Optional[str]) -> Optional[List[str]]:
    if not env_name:
        return None
    conda_exe = settings.conda_exe or os.getenv("CONDA_EXE")
    base_cmd = conda_exe or "conda"
    return [base_cmd, "run", "-n", env_name]


def _build_command(settings: Settings, stage_cfg: StageConfig, args: Iterable[str]) -> List[str]:
    conda_prefix = _resolve_conda_command(settings, stage_cfg.env_name)
    if conda_prefix:
        cmd = [*conda_prefix, "python", str(stage_cfg.script)]
    else:
        cmd = [settings.python_bin, str(stage_cfg.script)]
    cmd.extend(args)
    return cmd


def run_cli_stage(
    stage_name: str,
    stage_cfg: StageConfig,
    settings: Settings,
    args: Iterable[str],
    work_dir: Path,
    timeout: Optional[int] = None,
) -> StageResult:
    """Execute a CLI stage and capture stdout/stderr."""

    work_dir.mkdir(parents=True, exist_ok=True)
    command = _build_command(settings, stage_cfg, args)
    logger.info("Running %s: %s", stage_name, " ".join(shlex.quote(part) for part in command))

    completed = subprocess.run(
        command,
        cwd=work_dir,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )

    result = StageResult(
        stage=stage_name,
        command=command,
        stdout=completed.stdout.strip(),
        stderr=completed.stderr.strip(),
        returncode=completed.returncode,
        work_dir=work_dir,
    )

    if completed.returncode != 0:
        logger.error(
            "Stage %s failed (code %s). Stdout: %s\nStderr: %s",
            stage_name,
            completed.returncode,
            completed.stdout,
            completed.stderr,
        )
        raise StageExecutionError(result)

    logger.info("Stage %s completed successfully.", stage_name)
    return result
