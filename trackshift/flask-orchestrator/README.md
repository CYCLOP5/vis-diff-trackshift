# Visual Difference Engine Orchestrator

This service exposes an HTTP API that stitches together the visual-analysis stages already
implemented in the repo:

1. **Alignment & SSIM** (`alignment-ssim-mvp/alignment_ssim.py`)
2. **Object-first YOLO diff** (`object-diff-yolo/object_diff.py`)
3. **Mask R-CNN damage segmentation** (`damage-segmentation-maskrcnn/scripts/run_inference.py`)
4. **PCB defect change detection** (`flask-orchestrator/stages/pcb_cd_infer.py`, now backed by Roboflow `pcb-defect-detection-9ewqw/1`)

The orchestrator runs each stage as an external CLI program, captures their JSON outputs,
and persists the combined result under `flask-orchestrator/data/jobs/<job-id>` for later
retrieval by the frontend.

## Quick start

```bash
cd trackshift/flask-orchestrator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# copy env template and drop in your keys/settings
cp .env.example .env
# edit .env to set ROBOFLOW_API_KEY, workspace, workflow id, etc.
python -m flask_orchestrator.app
```

Send a multipart POST request containing `before` and `after` image files:

```bash
curl -X POST http://localhost:8000/api/jobs \
  -F before=@/path/before.png \
  -F after=@/path/after.png
```

The response includes the `jobId`. Fetch consolidated results later with:

```bash
curl http://localhost:8000/api/jobs/<jobId>
```

Artifacts such as aligned images, SSIM masks, YOLO overlays, and Mask R-CNN detection
files are stored per job. You can download any of them through:

```text
GET /api/jobs/<jobId>/artifacts/<relative-path-inside-job>
```

Example: `/api/jobs/<jobId>/artifacts/stages/alignment/overlay.png`.

### Time-series uploads

The `/api/jobs` endpoint also accepts ordered frame sequences so you can analyze a full
timeline (e.g., `baseline`, `pit-stop`, `post-race`).

- Upload multiple files using the `frames` field (`-F "frames[]=@frame0.png"`).
- Optional form fields:
  - `comparisonMode`: `baseline` (default, compares every frame to the selected baseline)
    or `consecutive` (diff each frame against the immediately previous frame).
  - `baselineIndex`: zero-based index of the frame that should act as the baseline when
    `comparisonMode=baseline` (defaults to `0`).
- If you omit `frames`, the legacy `before`/`after` fields still work and are interpreted
  as two frames in baseline mode.

Job responses now include metadata for each frame plus a `timeline` array that records the
per-frame comparisons (indices, stage outputs, artifact paths). For backward compatibility,
the top-level `pipeline` field still points at the most recent comparison result.

## Configuration

All paths default to the checked-in scripts, but you can override them with environment
variables:

| Variable | Purpose |
| --- | --- |
| `ORCHESTRATOR_DATA_ROOT` | Where job folders and results are persisted |
| `ALIGNMENT_SCRIPT`, `YOLO_SCRIPT`, `MASK_RCNN_SCRIPT` | Custom paths to the stage CLIs |
| `ALIGNMENT_ENV`, `YOLO_ENV`, `MASK_RCNN_ENV` | Conda environment names for each stage (defaults: `vde-mvp`, `vde-orchestrator`, `vde-pro`) |
| `MASK_RCNN_WEIGHTS`, `MASK_RCNN_CLASS_MAP`, `MASK_RCNN_LOGS` | Overrides for Mask R-CNN assets (weights default to the latest `mask_rcnn_f1_damage_*.h5` found under `damage-segmentation-maskrcnn/outputs/training_logs`, falling back to the bundled COCO weights) |
| `ORCHESTRATOR_PYTHON` | Python executable used to invoke stages (defaults to current) |
| `CONDA_EXE` | Absolute path to `conda` if auto-detection fails |
| `ROBOFLOW_API_URL` | Roboflow inference endpoint (defaults to `https://serverless.roboflow.com`) |
| `ROBOFLOW_API_KEY` | API key Roboflow issues for your workflow |
| `ROBOFLOW_WORKSPACE` | Workspace slug that owns the workflow (e.g. `f1-e7uz5`) |
| `ROBOFLOW_WORKFLOW_ID` | Workflow identifier (`custom-workflow-2`, etc.) |
| `ROBOFLOW_IMAGE_FIELD` | Image slot name expected by the workflow (defaults to `image`) |
| `ROBOFLOW_OUTPUT_KEY` | Optional dot path to the prediction list if auto-detect fails |
| `ROBOFLOW_DISABLE_CACHE` | Set to `true` to pass `use_cache=False` when invoking the workflow |
| `PCB_CD_SCRIPT` | Override path for the PCB change detection stage script (defaults to `stages/pcb_cd_infer.py`) |
| `PCB_CD_ENV` | Conda environment name used for the PCB stage (`manupipe2` by default) |
| `ROBOFLOW_PCB_MODEL_ID` | Roboflow model/version slug for PCB inspection (`pcb-defect-detection-9ewqw/1`) |
| `ROBOFLOW_PCB_API_BASE` | Base URL for PCB inference (defaults to `https://detect.roboflow.com`, falls back to `ROBOFLOW_API_URL`) |
| `ROBOFLOW_PCB_CONFIDENCE` | Confidence threshold passed to Roboflow (0–1 float, default `0.45`) |
| `ROBOFLOW_PCB_OVERLAP` | Overlap/IoU threshold used for NMS (0–1 float, default `0.2`) |
| `ROBOFLOW_PCB_TIMEOUT` | *(deprecated, no longer used; requests handled by Roboflow SDK)* |

Environment specs for every stage live under `trackshift/conda-envs/`. Create them once via
`conda env create -f trackshift/conda-envs/vde-mvp.yaml` (and likewise for `vde-win`, `vde-pro`,
and `vde-orchestrator`). The orchestrator automatically runs each CLI through `conda run -n <env>`
so the GPU/TensorFlow/PyTorch stacks stay isolated.

When an `*_ENV` variable is provided, the orchestrator automatically prefixes commands
with `conda run -n <env>` so every stage can keep its dependencies isolated (SSIM MVP,
YOLO/PyTorch, Mask R-CNN/TensorFlow).

## Output structure

Each job folder contains:

```text
job-root/
  inputs/
    frame_00_baseline.png
    frame_01_step.png
    ...
  timeline/
    frame_01/
      stages/
        alignment/
        object_diff/
        mask_rcnn/
    frame_02/
      stages/
        ...
  result.json
```

`result.json` is what the API returns and already embeds the parsed data from every stage
alongside execution metadata (timestamps, duration, status, error payloads, timeline summaries).
