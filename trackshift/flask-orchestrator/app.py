"""Flask application that orchestrates SSIM, YOLO, and Mask R-CNN stages."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional
import sys
from flask_cors import CORS

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import BadRequest, NotFound

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config import load_settings
from pipeline.jobs import JobManager

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = load_settings()
job_manager = JobManager(settings)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  

def _extract_metadata(form_data, exclude: Optional[set[str]] = None) -> Optional[Dict[str, Any]]:
    exclude = exclude or set()
    exclude.update({"before", "after", "frames", "baselineIndex", "comparisonMode"})
    metadata = {k: v for k, v in form_data.items() if k not in exclude}
    return metadata or None


@app.post("/api/jobs")
def create_job():
    frame_files = [file for file in request.files.getlist("frames") if file and file.filename]
    if not frame_files:
        before_file = request.files.get("before")
        after_file = request.files.get("after")
        if not before_file or not after_file:
            raise BadRequest("Provide either multiple 'frames' files or both 'before' and 'after'.")
        frame_files = [before_file, after_file]
    if len(frame_files) < 2:
        raise BadRequest("At least two frames are required to compute a visual difference.")

    comparison_mode = request.form.get("comparisonMode", "baseline").strip().lower()
    if comparison_mode not in {"baseline", "consecutive"}:
        raise BadRequest("comparisonMode must be either 'baseline' or 'consecutive'.")
    try:
        baseline_index = int(request.form.get("baselineIndex", 0))
    except ValueError:
        raise BadRequest("baselineIndex must be an integer.")

    metadata = _extract_metadata(request.form)
    result = job_manager.run_job(frame_files, comparison_mode, baseline_index, metadata=metadata)
    return jsonify(result), 201


@app.get("/api/jobs/<job_id>")
def get_job(job_id: str):
    result = job_manager.get_job(job_id)
    if not result:
        raise NotFound(f"Job {job_id} not found")
    return jsonify(result)


@app.get("/api/jobs/<job_id>/artifacts/<path:artifact>")
def get_artifact(job_id: str, artifact: str):
    job_dir = settings.data_root / job_id
    target = job_dir / artifact
    if not target.is_file():
        raise NotFound(f"Artifact not found: {artifact}")
    return send_from_directory(target.parent, target.name, max_age=0)


@app.get("/health")
def health_check():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
