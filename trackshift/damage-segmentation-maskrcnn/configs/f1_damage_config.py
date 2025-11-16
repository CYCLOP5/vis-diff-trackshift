from __future__ import annotations
from typing import Sequence
from mrcnn.config import Config
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
class F1DamageBaseConfig(Config):
    NAME = "f1_damage"
    GPU_COUNT = 1
    IMAGES_PER_GPU = 1
    NUM_CLASSES = len(CANONICAL_DAMAGE_CLASSES)
    BACKBONE = "resnet50"
    IMAGE_MIN_DIM = 832
    IMAGE_MAX_DIM = 1024
    IMAGE_RESIZE_MODE = "square"
    RPN_ANCHOR_SCALES = (16, 32, 64, 128, 256)
    RPN_ANCHOR_RATIOS = [0.5, 1.0, 2.0]
    TRAIN_ROIS_PER_IMAGE = 128
    MAX_GT_INSTANCES = 128
    DETECTION_MAX_INSTANCES = 150
    STEPS_PER_EPOCH = 500
    VALIDATION_STEPS = 50
    LEARNING_RATE = 1e-3
    LEARNING_MOMENTUM = 0.9
    WEIGHT_DECAY = 1e-4
    USE_MINI_MASK = True
    MINI_MASK_SHAPE = (112, 112)
class F1DamageInferenceConfig(F1DamageBaseConfig):
    DETECTION_MIN_CONFIDENCE = 0.27
    POST_NMS_ROIS_INFERENCE = 600
class F1DamageTrainingConfig(F1DamageBaseConfig):
    IMAGES_PER_GPU = 2
    GPU_COUNT = 1
    STEPS_PER_EPOCH = 100
    VALIDATION_STEPS = 100
    IMAGE_MIN_DIM = 768
    IMAGE_MAX_DIM = 1024
    POST_NMS_ROIS_TRAINING = 1500
    POST_NMS_ROIS_INFERENCE = 1000
    DETECTION_MIN_CONFIDENCE = 0.8
    TRAIN_ROIS_PER_IMAGE = 256
    MAX_GT_INSTANCES = 200
    DETECTION_MAX_INSTANCES = 200