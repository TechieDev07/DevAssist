"""
evaluate.py — Evaluate the trained model on the official test set.

Usage:
    python -m app.evaluate

Expects:
    data/test.csv
    ml-service/artifacts/model_pipeline_v1.joblib

Produces:
    ml-service/artifacts/evaluation_report.json
    docs/model-evaluation.md
"""

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
DOCS_DIR = ROOT / "docs"

MODEL_VERSION = "v1"
MODEL_PATH = ARTIFACTS_DIR / f"model_pipeline_{MODEL_VERSION}.joblib"
REPORT_PATH = ARTIFACTS_DIR / "evaluation_report.json"
MD_PATH = DOCS_DIR / "model-evaluation.md"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.preprocess import preprocess_dataframe


def find_test_file() -> Path:
    candidates = [
        DATA_DIR / "test.csv",
        DATA_DIR / "raw" / "test.csv",
        DATA_DIR / "nlbse2024" / "test.csv",
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(
        "Test data not found. Please place the official test set at data/test.csv"
    )


def evaluate() -> dict:
    print("=" * 60)
    print("DevAssist ML Evaluation")
    print("=" * 60)

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model artifact not found at {MODEL_PATH}. "
            "Run `python -m app.train` first."
        )

    # Load model
    print(f"\n[evaluate] Loading model from: {MODEL_PATH}")
    pipeline = joblib.load(MODEL_PATH)

    # Load test data
    test_path = find_test_file()
    print(f"[evaluate] Loading test data from: {test_path}")
    raw_df = pd.read_csv(test_path)
    print(f"[evaluate] Raw test rows: {len(raw_df)}")

    df = preprocess_dataframe(raw_df)
    print(f"[evaluate] Preprocessed test rows: {len(df)}")
    print(f"[evaluate] Test class distribution:\n{df['label'].value_counts().to_string()}")

    X_test = df["text"].tolist()
    y_test = df["label"].tolist()

    # Predict
    y_pred = pipeline.predict(X_test)
    classes = sorted(set(y_test + list(y_pred)))

    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    macro_precision = precision_score(y_test, y_pred, average="macro", labels=classes, zero_division=0)
    macro_recall = recall_score(y_test, y_pred, average="macro", labels=classes, zero_division=0)
    macro_f1 = f1_score(y_test, y_pred, average="macro", labels=classes, zero_division=0)

    report = classification_report(y_test, y_pred, labels=classes, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()

    per_class = {
        cls: {
            "precision": round(report[cls]["precision"], 4),
            "recall": round(report[cls]["recall"], 4),
            "f1_score": round(report[cls]["f1-score"], 4),
            "support": int(report[cls]["support"]),
        }
        for cls in classes
    }

    result = {
        "model_version": MODEL_VERSION,
        "test_samples": len(y_test),
        "test_class_distribution": df["label"].value_counts().to_dict(),
        "overall": {
            "accuracy": round(float(accuracy), 4),
            "macro_precision": round(float(macro_precision), 4),
            "macro_recall": round(float(macro_recall), 4),
            "macro_f1": round(float(macro_f1), 4),
        },
        "per_class": per_class,
        "confusion_matrix": {
            "labels": classes,
            "matrix": cm,
        },
    }

    # Save JSON
    with open(REPORT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\n[evaluate] Saved report to: {REPORT_PATH}")

    # Print summary
    print(f"\n{'='*60}")
    print(f"EVALUATION RESULTS (Test Set — {len(y_test)} samples)")
    print(f"{'='*60}")
    print(f"  Accuracy        : {accuracy:.4f}")
    print(f"  Macro Precision : {macro_precision:.4f}")
    print(f"  Macro Recall    : {macro_recall:.4f}")
    print(f"  Macro F1        : {macro_f1:.4f}")
    print(f"\n  Per-class metrics:")
    for cls, m in per_class.items():
        print(f"    {cls:<12} P={m['precision']:.3f}  R={m['recall']:.3f}  F1={m['f1_score']:.3f}  n={m['support']}")

    print(f"\n  Confusion Matrix (rows=actual, cols=predicted):")
    header = "           " + "  ".join(f"{c[:6]:>8}" for c in classes)
    print(header)
    for i, row in enumerate(cm):
        row_str = "  ".join(f"{v:>8}" for v in row)
        print(f"  {classes[i]:<10} {row_str}")

    # Generate Markdown report
    _write_markdown_report(result)
    print(f"\n[evaluate] Markdown report written to: {MD_PATH}")

    return result


def _write_markdown_report(r: dict):
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    classes = r["confusion_matrix"]["labels"]
    cm = r["confusion_matrix"]["matrix"]
    o = r["overall"]

    lines = [
        "# DevAssist — Model Evaluation Report",
        "",
        f"**Model Version:** {r['model_version']}",
        f"**Test Samples:** {r['test_samples']}",
        "",
        "## Dataset Distribution (Test Set)",
        "",
    ]
    for cls, count in r["test_class_distribution"].items():
        lines.append(f"- **{cls}**: {count}")
    lines += [
        "",
        "## Overall Metrics",
        "",
        "| Metric | Value |",
        "|--------|-------|",
        f"| Accuracy | {o['accuracy']:.4f} |",
        f"| Macro Precision | {o['macro_precision']:.4f} |",
        f"| Macro Recall | {o['macro_recall']:.4f} |",
        f"| Macro F1 | {o['macro_f1']:.4f} |",
        "",
        "## Per-Class Metrics",
        "",
        "| Class | Precision | Recall | F1 | Support |",
        "|-------|-----------|--------|----|---------|",
    ]
    for cls, m in r["per_class"].items():
        lines.append(f"| {cls} | {m['precision']:.4f} | {m['recall']:.4f} | {m['f1_score']:.4f} | {m['support']} |")

    lines += [
        "",
        "## Confusion Matrix",
        "",
        "Rows = Actual, Columns = Predicted",
        "",
        "| | " + " | ".join(classes) + " |",
        "|---|" + "---|" * len(classes),
    ]
    for i, row in enumerate(cm):
        lines.append("| **" + classes[i] + "** | " + " | ".join(str(v) for v in row) + " |")

    lines += [
        "",
        "## Notes",
        "",
        "> These metrics are computed on the **official held-out test set** from the NLBSE 2024 dataset.",
        "> The TF-IDF vectorizer was fitted **only on training data**.",
        "> No test data was used during training, preprocessing fit, or hyperparameter selection.",
    ]

    with open(MD_PATH, "w") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    evaluate()
