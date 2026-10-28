"""
train.py — Train the TF-IDF + MultinomialNB pipeline on the NLBSE 2024 dataset.

Usage:
    python -m app.train

Expects:
    data/train.csv   (or data/raw/train.csv)

Produces:
    ml-service/artifacts/model_pipeline_v1.joblib
    ml-service/artifacts/model_meta.json
"""

import json
import os
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# ── Path setup ─────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_VERSION = "v1"
MODEL_PATH = ARTIFACTS_DIR / f"model_pipeline_{MODEL_VERSION}.joblib"
META_PATH = ARTIFACTS_DIR / "model_meta.json"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.preprocess import preprocess_dataframe, SUPPORTED_CLASSES


def find_train_file() -> Path:
    """Search common locations for the training CSV."""
    candidates = [
        DATA_DIR / "train.csv",
        DATA_DIR / "raw" / "train.csv",
        DATA_DIR / "nlbse2024" / "train.csv",
        DATA_DIR / "train.csv",
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(
        "Training data not found. Please follow data/README.md to download "
        "the NLBSE 2024 dataset and place it at data/train.csv"
    )


def build_pipeline() -> Pipeline:
    """
    TF-IDF (unigrams + bigrams) → Multinomial Naive Bayes pipeline.

    TfidfVectorizer settings:
      - ngram_range=(1,2): captures phrases like "not working", "crashes on"
      - max_features=50_000: vocabulary cap to control memory
      - min_df=2: ignore extremely rare terms
      - sublinear_tf=True: log-scale TF to reduce skew from long descriptions
    """
    return Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=50_000,
            min_df=2,
            sublinear_tf=True,
            strip_accents="unicode",
            analyzer="word",
            token_pattern=r"(?u)\b\w+\b",
        )),
        ("clf", MultinomialNB(alpha=0.5)),
    ])


def train() -> dict:
    print("=" * 60)
    print("DevAssist ML Training Pipeline")
    print("=" * 60)

    # 1. Load data
    train_path = find_train_file()
    print(f"\n[train] Loading training data from: {train_path}")
    raw_df = pd.read_csv(train_path)
    print(f"[train] Raw rows: {len(raw_df)}, columns: {list(raw_df.columns)}")

    # 2. Preprocess
    df = preprocess_dataframe(raw_df)
    print(f"[train] Preprocessed rows: {len(df)}")
    print(f"[train] Class distribution:\n{df['label'].value_counts().to_string()}")

    X_train = df["text"].tolist()
    y_train = df["label"].tolist()

    # 3. Build & fit pipeline
    print("\n[train] Fitting TF-IDF + MultinomialNB pipeline...")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # 4. Quick sanity check on training data
    train_preds = pipeline.predict(X_train)
    train_acc = (train_preds == y_train).mean()
    print(f"[train] Training accuracy (optimistic): {train_acc:.4f}")

    # 5. Save artifact
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\n[train] Saved model to: {MODEL_PATH}")

    # 6. Save metadata
    classes = list(pipeline.classes_) if hasattr(pipeline, "classes_") else SUPPORTED_CLASSES
    # Access classes via the final estimator
    clf_classes = list(pipeline.named_steps["clf"].classes_)
    vocab_size = len(pipeline.named_steps["tfidf"].vocabulary_)
    meta = {
        "model_version": MODEL_VERSION,
        "model_type": "TF-IDF + MultinomialNB",
        "classes": clf_classes,
        "train_samples": len(X_train),
        "class_distribution": df["label"].value_counts().to_dict(),
        "vocab_size": vocab_size,
        "tfidf_params": {
            "ngram_range": [1, 2],
            "max_features": 50_000,
            "min_df": 2,
            "sublinear_tf": True,
        },
        "nb_alpha": 0.5,
        "train_accuracy_optimistic": round(float(train_acc), 4),
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"[train] Saved metadata to: {META_PATH}")

    print("\n[train] Training complete.")
    return meta


if __name__ == "__main__":
    meta = train()
    print(json.dumps(meta, indent=2))
