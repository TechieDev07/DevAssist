"""
predict.py — Inference helper for the trained pipeline.

Loaded once at application startup by app.py and reused for every request.
"""

import json
from pathlib import Path
from typing import Optional

import joblib

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
MODEL_VERSION = "v1"
MODEL_PATH = ARTIFACTS_DIR / f"model_pipeline_{MODEL_VERSION}.joblib"
META_PATH = ARTIFACTS_DIR / "model_meta.json"

SUPPORTED_CLASSES = ["bug", "feature", "question"]


class Predictor:
    """
    Wraps the trained scikit-learn Pipeline.
    Call load() once, then predict() for each request.
    """

    def __init__(self):
        self.pipeline = None
        self.classes: list[str] = []
        self.model_version: str = MODEL_VERSION
        self.is_ready: bool = False
        self._meta: dict = {}

    def load(self):
        """Load model artifact from disk. Raises if artifact is missing."""
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {MODEL_PATH}. "
                "Run `python -m app.train` first."
            )
        self.pipeline = joblib.load(MODEL_PATH)
        self.classes = list(self.pipeline.named_steps["clf"].classes_)
        self.is_ready = True

        if META_PATH.exists():
            with open(META_PATH) as f:
                self._meta = json.load(f)
            self.model_version = self._meta.get("model_version", MODEL_VERSION)

        print(f"[predictor] Model loaded. Version={self.model_version}, Classes={self.classes}")

    def predict(self, text: str) -> dict:
        """
        Run inference on a single pre-processed text string.

        Returns:
            {
              "predicted_category": str,
              "class_scores": {label: float, ...},
              "model_version": str
            }
        """
        if not self.is_ready or self.pipeline is None:
            raise RuntimeError("Predictor is not ready. Call load() first.")

        if not text or not text.strip():
            raise ValueError("Input text is empty after preprocessing.")

        proba = self.pipeline.predict_proba([text])[0]
        predicted_idx = int(proba.argmax())
        predicted_category = str(self.classes[predicted_idx])

        class_scores = {
            str(cls): round(float(p), 6)
            for cls, p in zip(self.classes, proba)
        }

        return {
            "predicted_category": predicted_category,
            "class_scores": class_scores,
            "model_version": self.model_version,
        }


# Singleton used by the FastAPI app
predictor = Predictor()
