"""SKINSIGHT v2 — Skin predictor using a trainable sklearn classifier."""

from __future__ import annotations

import io
import logging
import pickle
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)
CLASSES = ["acne", "oily", "dry", "normal"]
MODEL_PATH = Path(__file__).parent / "skin_type_classifier.pkl"


def _mock(image_bytes: bytes) -> dict:
    import random

    random.seed(len(image_bytes) % 97)
    raw = [random.uniform(0.05, 0.9) for _ in CLASSES]
    raw[len(image_bytes) % len(CLASSES)] *= 2.8
    total = sum(raw)
    scores = {c: round(r / total, 4) for c, r in zip(CLASSES, raw)}
    condition = max(scores, key=scores.get)
    return {
        "condition": condition,
        "confidence": scores[condition],
        "all_scores": scores,
        "using_mock": True,
        "error": None,
    }


def extract_features_pil(image: Image.Image) -> np.ndarray:
    """Extract compact color and texture features from an RGB image."""
    rgb = image.convert("RGB").resize((64, 64), Image.Resampling.BILINEAR)
    arr = np.asarray(rgb, dtype=np.float32) / 255.0

    channel_means = arr.mean(axis=(0, 1))
    channel_stds = arr.std(axis=(0, 1))

    luminance = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    lum_percentiles = np.percentile(luminance, [10, 25, 50, 75, 90])

    hist_features = []
    for channel in range(3):
        hist, _ = np.histogram(arr[:, :, channel], bins=16, range=(0.0, 1.0), density=True)
        hist_features.append(hist)

    grad_x = np.abs(np.diff(luminance, axis=1)).mean()
    grad_y = np.abs(np.diff(luminance, axis=0)).mean()

    small_gray = np.asarray(
        rgb.convert("L").resize((16, 16), Image.Resampling.BILINEAR),
        dtype=np.float32,
    ) / 255.0

    feature_vector = np.concatenate(
        [
            channel_means,
            channel_stds,
            lum_percentiles,
            np.concatenate(hist_features),
            np.array([grad_x, grad_y], dtype=np.float32),
            small_gray.ravel(),
        ]
    )
    return feature_vector.astype(np.float32)


class SkinPredictor:
    def __init__(self):
        self.model_artifact = None
        self.class_labels = []
        try:
            if MODEL_PATH.exists():
                with MODEL_PATH.open("rb") as fp:
                    artifact = pickle.load(fp)
                self.model_artifact = artifact
                self.class_labels = list(artifact.get("class_labels", []))
                logger.info("Loaded trained skin type classifier from %s", MODEL_PATH)
        except Exception as exc:
            logger.warning("Model load failed: %s", exc)

    def _predict_proba(self, features: np.ndarray) -> np.ndarray:
        if self.model_artifact.get("model_type") == "knn":
            k = int(self.model_artifact["k"])
            x_train = self.model_artifact["x_train"]
            y_train = self.model_artifact["y_train"]
            mean = self.model_artifact["feature_mean"]
            std = self.model_artifact["feature_std"]

            row_scaled = ((features - mean) / std).astype(np.float32)
            dists = np.sum((x_train - row_scaled) ** 2, axis=1)
            nn_idx = np.argpartition(dists, min(k, len(dists) - 1))[:k]

            vote_weights = np.zeros(len(self.class_labels), dtype=np.float64)
            label_to_idx = {label: i for i, label in enumerate(self.class_labels)}
            for idx in nn_idx:
                label = y_train[idx]
                vote_weights[label_to_idx[label]] += 1.0 / (float(dists[idx]) + 1e-6)

            vote_weights /= vote_weights.sum() + 1e-12
            return vote_weights.astype(np.float32)

        if self.model_artifact.get("model_type") == "gaussian":
            means = self.model_artifact["means"]
            variances = self.model_artifact["variances"]
            priors = self.model_artifact["priors"]

            log_probs = []
            for label in self.class_labels:
                mu = means[label]
                var = variances[label]
                log_prior = np.log(priors[label] + 1e-12)
                ll = -0.5 * np.sum(np.log(2.0 * np.pi * var) + ((features - mu) ** 2) / var)
                log_probs.append(log_prior + ll)

            log_probs = np.array(log_probs, dtype=np.float64)
            log_probs -= np.max(log_probs)
            probs = np.exp(log_probs)
            probs /= probs.sum() + 1e-12
            return probs.astype(np.float32)

        raise RuntimeError("Unsupported model artifact type.")

    def predict(self, image_bytes: bytes) -> dict:
        if self.model_artifact is None:
            return _mock(image_bytes)

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            features = extract_features_pil(image)
            probs = self._predict_proba(features)

            scores = {label: float(prob) for label, prob in zip(self.class_labels, probs)}

            # Dataset currently trains oily/dry/normal, so keep acne as a small prior.
            all_scores = {c: 0.01 for c in CLASSES}
            for label, score in scores.items():
                if label in all_scores:
                    all_scores[label] = score

            total = sum(all_scores.values())
            all_scores = {k: round(v / total, 4) for k, v in all_scores.items()}

            condition = max(all_scores, key=all_scores.get)
            return {
                "condition": condition,
                "confidence": all_scores[condition],
                "all_scores": all_scores,
                "using_mock": False,
                "error": None,
            }
        except UnidentifiedImageError:
            return {
                "condition": "normal",
                "confidence": 0.0,
                "all_scores": {c: 0.0 for c in CLASSES},
                "using_mock": False,
                "error": "Invalid image format.",
            }
        except Exception as exc:
            logger.error("Inference error: %s", exc)
            return _mock(image_bytes)
