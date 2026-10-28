"""
ML service tests.
Run from ml-service/ directory:
    pytest tests/ -v
"""

import json
import sys
from pathlib import Path

import pytest

# Ensure the ml-service root is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.preprocess import (
    SUPPORTED_CLASSES,
    combine_title_description,
    preprocess_single,
)


# ── Preprocessing tests ─────────────────────────────────────────────────────────

class TestPreprocess:
    def test_combine_title_and_description(self):
        result = combine_title_description("Login fails", "The login button does nothing")
        assert "login fails" in result
        assert "login button" in result

    def test_combine_empty_description(self):
        result = combine_title_description("Bug in app", "")
        assert "bug in app" in result

    def test_combine_empty_title(self):
        result = combine_title_description("", "Some description")
        assert "some description" in result

    def test_both_empty_returns_empty(self):
        result = combine_title_description("", "")
        assert result == ""

    def test_url_removed(self):
        result = combine_title_description("Bug", "See https://github.com/org/repo/issues/1 for details")
        assert "https" not in result

    def test_negation_preserved(self):
        result = combine_title_description("Not working", "Feature is not responding")
        assert "not" in result

    def test_preprocess_single_valid(self):
        text = preprocess_single("Login button not working", "Nothing happens on click")
        assert len(text) > 0
        assert isinstance(text, str)

    def test_preprocess_single_empty_raises(self):
        with pytest.raises(ValueError):
            preprocess_single("", "")

    def test_preprocess_single_whitespace_only_raises(self):
        with pytest.raises(ValueError):
            preprocess_single("   ", "   ")


# ── Predictor tests (requires trained model) ────────────────────────────────────

class TestPredictor:
    @pytest.fixture(scope="class")
    def loaded_predictor(self):
        """Load predictor once for all tests in this class."""
        from app.predict import Predictor
        p = Predictor()
        artifacts_dir = Path(__file__).resolve().parent.parent / "artifacts"
        model_path = artifacts_dir / "model_pipeline_v1.joblib"
        if not model_path.exists():
            pytest.skip(
                "Model artifact not found. Run `python -m app.train` first."
            )
        p.load()
        return p

    def test_model_loads(self, loaded_predictor):
        assert loaded_predictor.is_ready is True
        assert loaded_predictor.pipeline is not None

    def test_classes_are_supported(self, loaded_predictor):
        for cls in loaded_predictor.classes:
            assert cls in SUPPORTED_CLASSES

    def test_predict_returns_valid_category(self, loaded_predictor):
        result = loaded_predictor.predict("login button not working after clicking")
        assert result["predicted_category"] in SUPPORTED_CLASSES

    def test_predict_class_scores_sum_to_one(self, loaded_predictor):
        result = loaded_predictor.predict("application crashes on startup")
        total = sum(result["class_scores"].values())
        assert abs(total - 1.0) < 1e-5

    def test_predict_scores_for_all_classes(self, loaded_predictor):
        result = loaded_predictor.predict("how do I reset my password")
        for cls in SUPPORTED_CLASSES:
            assert cls in result["class_scores"]

    def test_predict_bug_issue(self, loaded_predictor):
        result = loaded_predictor.predict(
            "null pointer exception crashes server null pointer error"
        )
        assert result["predicted_category"] in SUPPORTED_CLASSES  # Not asserting exact label

    def test_predict_feature_issue(self, loaded_predictor):
        result = loaded_predictor.predict(
            "add dark mode support please implement dark theme"
        )
        assert result["predicted_category"] in SUPPORTED_CLASSES

    def test_predict_question_issue(self, loaded_predictor):
        result = loaded_predictor.predict(
            "how do I configure smtp email notifications settings"
        )
        assert result["predicted_category"] in SUPPORTED_CLASSES

    def test_predict_model_version_present(self, loaded_predictor):
        result = loaded_predictor.predict("some issue text")
        assert "model_version" in result
        assert result["model_version"]

    def test_predict_empty_text_raises(self, loaded_predictor):
        with pytest.raises((ValueError, Exception)):
            loaded_predictor.predict("")


# ── FastAPI integration tests ───────────────────────────────────────────────────

class TestFastAPIRoutes:
    @pytest.fixture(scope="class")
    def setup_app(self):
        from app.predict import predictor
        predictor.load()
        return predictor

    def test_root_handler(self):
        from app.app import root
        resp = root()
        assert "service" in resp
        assert "health" in resp

    def test_health_handler(self, setup_app):
        from app.app import health
        resp = health()
        assert resp.status == "ok"
        assert resp.model_ready is True
        assert resp.model_version == "v1"

    def test_predict_handler_valid(self, setup_app):
        from app.app import predict, PredictRequest
        resp = predict(PredictRequest(title="Crash on boot", description="Null pointer exception"))
        assert resp.predicted_category in SUPPORTED_CLASSES
        assert len(resp.class_scores) == 3
        assert resp.model_version == "v1"

    def test_predict_handler_whitespace_title_raises(self):
        from app.app import PredictRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            PredictRequest(title="   ", description="Some description")
