# Damage Segmentation (Mask R-CNN)

This module hosts everything related to the Mask R-CNN stage of the Visual Difference Engine. The goal is to run an instance-segmentation pipeline that can classify and localise damage on F1 car components. The repo layout is optimised for the hackathon path: clone the TensorFlow 2 fork, drop in the pre-trained weights, and immediately run inference or fine-tuning jobs as time allows.

## 1. Environment

```bash
# from the project root
conda env create -f conda-envs/vde-pro.yml
conda activate vde-pro
```

The `vde-pro` environment pins the TensorFlow 2.10.1 stack plus the legacy Keras/h5py combo required by the TF2-compatible Mask R-CNN fork. CUDA 11.2 and cuDNN 8.1 get installed through the Conda channels.

## 2. Bring in the TF2 Mask R-CNN fork

Inside `damage-segmentation-maskrcnn/` run:

```bash
git clone https://github.com/ahmedfgad/Mask-RCNN-TF2.git vendor/Mask-RCNN-TF2
cd vendor/Mask-RCNN-TF2
python setup.py install  # installs the mrcnn package into vde-pro
```

The `vendor/` directory keeps third-party code separate from our scripts. `python setup.py install` makes the `mrcnn` package available to the whole environment.

## 3. Download base weights

Still inside `damage-segmentation-maskrcnn/`:

```bash
mkdir -p assets/weights
cd assets/weights
wget https://github.com/matterport/Mask_RCNN/releases/download/v2.0/mask_rcnn_coco.h5
```

For a hackathon-ready run without fine-tuning, use `mask_rcnn_coco.h5`. When a damage-specific checkpoint is trained, drop it into the same folder (e.g. `mask_rcnn_f1_damage.h5`).

## 4. Dataset layout

Datasets you downloaded earlier (`datasets/cardd`, `datasets/vehide`, etc.) stay at the repo root. When you build a custom dataset class, point the loader at those folders. Nothing needs to be moved.

## 5. Damage taxonomy & dataset loaders

- Canonical damage classes live in `scripts/datasets/damage_taxonomy.py` and are exported as `assets/class_maps/f1_damage_taxonomy.json` for inference runs.
- `scripts/datasets/cardd.py` and `scripts/datasets/vehide.py` already adapt the published annotations into the Mask R-CNN dataset API, normalising labels into the shared taxonomy so we can mix both datasets.

## 6. Run quick inference

The `scripts/run_inference.py` helper loads a Mask R-CNN model and saves visualisations and raw JSON outputs. Example:

```bash
conda activate vde-pro
python scripts/run_inference.py \
  --weights assets/weights/mask_rcnn_coco.h5 \
  --image /path/to/sample.jpg \
  --output-dir outputs/coco-demo \
  --class-map assets/class_maps/f1_damage_taxonomy.json
```

Outputs:

- `outputs/coco-demo/overlay.png` – input image with masks and boxes.
- `outputs/coco-demo/detections.json` – structured metadata (boxes, masks, scores).

The `--class-map` argument ensures detections are reported with the F1 damage names once you start using fine-tuned weights.

## 7. Fine-tune on CarDD and VehiDE

The helper `scripts/train_damage.py` wraps the Mask R-CNN training loop with sane defaults for the damage taxonomy.

```bash
conda activate vde-pro
python scripts/train_damage.py \
  --dataset-root ../datasets \
  --include cardd vehide \
  --weights coco \
  --logs outputs/training_logs
```

What it does:

- Builds unified train/val splits by merging CardD and VehiDE annotations into the canonical label set.
- Starts from the COCO checkpoint (unless you pass `--weights /path/to/your.h5` or `--weights last`).
- Runs a two-stage schedule by default: 12 epochs on detection heads followed by 24 epochs fine-tuning all layers (learning rate drops by 10x for the second stage). Use `--head-epochs`, `--full-epochs`, or `--learning-rate` to tweak.

Checkpoints land under `outputs/training_logs` and are ready to be used with `scripts/run_inference.py --weights <checkpoint>.h5 --class-map assets/class_maps/f1_damage_taxonomy.json`.

## 7. Repo structure overview

```
damage-segmentation-maskrcnn/
├── README.md
├── assets/           # weights, label maps, etc. (create as needed)
├── configs/
│   └── f1_damage_config.py
├── scripts/
│   ├── __init__.py
│   ├── run_inference.py
│   ├── train_damage.py
│   └── datasets/
│       ├── __init__.py
│       ├── cardd.py
│       ├── damage_taxonomy.py
│       └── vehide.py
└── vendor/
    └── Mask-RCNN-TF2/
```

`configs/f1_damage_config.py` ships with an inference-friendly config stub ready to be extended for training.

## 8. Next steps

- Swap in damage-specific weights when ready.
- Build dataset loaders for CardD or VehiDE.
- Expose this script to the Flask orchestrator once the CLI surface is finalised.
