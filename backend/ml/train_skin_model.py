"""Train a skin type classifier from Oily-Dry-Skin-Types dataset."""

from __future__ import annotations

import argparse
import pickle
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError

from skin_model import MODEL_PATH, extract_features_pil

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def iter_images(folder: Path):
    for ext in IMAGE_EXTS:
        yield from folder.rglob(f"*{ext}")
        yield from folder.rglob(f"*{ext.upper()}")


def load_split(split_root: Path, labels: list[str]) -> tuple[np.ndarray, np.ndarray]:
    features = []
    targets = []

    for label in labels:
        class_dir = split_root / label
        if not class_dir.exists():
            continue

        for img_path in iter_images(class_dir):
            try:
                img = Image.open(img_path).convert("RGB")
                fv = extract_features_pil(img)
                features.append(fv)
                targets.append(label)
            except (UnidentifiedImageError, OSError):
                continue

    if not features:
        raise RuntimeError(f"No images loaded from {split_root}")

    return np.vstack(features), np.array(targets)


def train_knn_classifier(x_train: np.ndarray, y_train: np.ndarray, labels: list[str], k: int) -> dict:
    mean = x_train.mean(axis=0).astype(np.float32)
    std = (x_train.std(axis=0) + 1e-6).astype(np.float32)
    x_train_scaled = ((x_train - mean) / std).astype(np.float32)
    return {
        "model_type": "knn",
        "class_labels": labels,
        "k": int(k),
        "feature_mean": mean,
        "feature_std": std,
        "x_train": x_train_scaled,
        "y_train": y_train,
    }


def train_gaussian_classifier(x_train: np.ndarray, y_train: np.ndarray, labels: list[str]) -> dict:
    means = {}
    variances = {}
    priors = {}

    for label in labels:
        class_data = x_train[y_train == label]
        if len(class_data) == 0:
            continue
        means[label] = class_data.mean(axis=0).astype(np.float32)
        variances[label] = (class_data.var(axis=0) + 1e-4).astype(np.float32)
        priors[label] = float(len(class_data) / len(x_train))

    return {
        "model_type": "gaussian",
        "class_labels": labels,
        "means": means,
        "variances": variances,
        "priors": priors,
    }


def predict_proba_batch(model: dict, x: np.ndarray) -> np.ndarray:
    labels = model["class_labels"]
    model_type = model.get("model_type", "gaussian")

    if model_type == "knn":
        k = model["k"]
        x_train = model["x_train"]
        y_train = model["y_train"]
        mean = model["feature_mean"]
        std = model["feature_std"]

        probs_all = []
        for row in x:
            row_scaled = ((row - mean) / std).astype(np.float32)
            dists = np.sum((x_train - row_scaled) ** 2, axis=1)
            nn_idx = np.argpartition(dists, min(k, len(dists) - 1))[:k]

            vote_weights = np.zeros(len(labels), dtype=np.float64)
            for idx in nn_idx:
                label = y_train[idx]
                label_pos = labels.index(label)
                vote_weights[label_pos] += 1.0 / (float(dists[idx]) + 1e-6)

            vote_weights /= vote_weights.sum() + 1e-12
            probs_all.append(vote_weights)

        return np.vstack(probs_all)

    means = model["means"]
    variances = model["variances"]
    priors = model["priors"]

    probs_all = []
    for row in x:
        log_probs = []
        for label in labels:
            mu = means[label]
            var = variances[label]
            log_prior = np.log(priors[label] + 1e-12)
            ll = -0.5 * np.sum(np.log(2.0 * np.pi * var) + ((row - mu) ** 2) / var)
            log_probs.append(log_prior + ll)

        log_probs = np.array(log_probs, dtype=np.float64)
        log_probs -= np.max(log_probs)
        probs = np.exp(log_probs)
        probs /= probs.sum() + 1e-12
        probs_all.append(probs)

    return np.vstack(probs_all)


def accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float((y_true == y_pred).sum() / len(y_true))


def per_class_accuracy(y_true: np.ndarray, y_pred: np.ndarray, labels: list[str]) -> dict[str, float]:
    metrics = {}
    for label in labels:
        mask = y_true == label
        if mask.any():
            metrics[label] = float((y_pred[mask] == label).sum() / mask.sum())
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train skin type classifier")
    parser.add_argument(
        "--dataset-root",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "Oily-Dry-Skin-Types",
        help="Path to dataset root containing train/valid/test",
    )
    parser.add_argument(
        "--labels",
        nargs="+",
        default=["oily", "dry", "normal"],
        help="Class labels to train",
    )
    parser.add_argument(
        "--model-type",
        choices=["gaussian", "knn"],
        default="gaussian",
        help="Type of pure NumPy model to train",
    )
    parser.add_argument("--k", type=int, default=11, help="Number of nearest neighbors")
    args = parser.parse_args()

    dataset_root: Path = args.dataset_root
    train_root = dataset_root / "train"
    valid_root = dataset_root / "valid"
    test_root = dataset_root / "test"

    if not train_root.exists():
        raise FileNotFoundError(f"Dataset train folder not found: {train_root}")

    labels = args.labels

    print(f"Loading train split from: {train_root}")
    x_train, y_train = load_split(train_root, labels)
    print(f"Train samples: {len(y_train)} | Distribution: {dict(Counter(y_train))}")

    x_valid, y_valid = load_split(valid_root, labels)
    print(f"Valid samples: {len(y_valid)} | Distribution: {dict(Counter(y_valid))}")

    x_test, y_test = load_split(test_root, labels)
    print(f"Test samples: {len(y_test)} | Distribution: {dict(Counter(y_test))}")

    if args.model_type == "knn":
        model = train_knn_classifier(x_train, y_train, labels, k=args.k)
    else:
        model = train_gaussian_classifier(x_train, y_train, labels)

    valid_probs = predict_proba_batch(model, x_valid)
    test_probs = predict_proba_batch(model, x_test)

    valid_preds = np.array([labels[i] for i in np.argmax(valid_probs, axis=1)])
    test_preds = np.array([labels[i] for i in np.argmax(test_probs, axis=1)])

    valid_acc = accuracy(y_valid, valid_preds)
    test_acc = accuracy(y_test, test_preds)

    print(f"Validation accuracy: {valid_acc:.4f}")
    print(f"Test accuracy: {test_acc:.4f}")
    print(f"Validation per-class accuracy: {per_class_accuracy(y_valid, valid_preds, labels)}")
    print(f"Test per-class accuracy: {per_class_accuracy(y_test, test_preds, labels)}")

    artifact = {
        **model,
        "valid_accuracy": float(valid_acc),
        "test_accuracy": float(test_acc),
        "feature_version": "v1",
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MODEL_PATH.open("wb") as fp:
        pickle.dump(artifact, fp)

    print(f"Saved trained model to: {MODEL_PATH}")


if __name__ == "__main__":
    main()