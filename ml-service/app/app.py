"""
app.py — FastAPI prediction service for DevAssist.

Startup:
    uvicorn app.app:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.predict import predictor
from app.preprocess import preprocess_single

# ── Environment ─────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
PORT = int(os.getenv("PORT", "8000"))

# ── Pydantic Schemas ────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, description="Issue title")
    description: str = Field(default="", max_length=10000, description="Issue body/description")

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must not be blank")
        return v.strip()

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str) -> str:
        return v.strip() if v else ""


class PredictResponse(BaseModel):
    predicted_category: str
    class_scores: dict[str, float]
    model_version: str


class HealthResponse(BaseModel):
    status: str
    model_ready: bool
    model_version: str
    message: str


# ── Lifespan ────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model artifact once at startup."""
    try:
        predictor.load()
        print("[app] ML model loaded successfully.")
    except FileNotFoundError as e:
        print(f"[app] WARNING: {e}")
        print("[app] Service is running but predictions will fail until the model is trained.")
    yield
    print("[app] Shutting down.")


# ── App ─────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DevAssist ML Service",
    description="GitHub issue classification API powered by TF-IDF + MultinomialNB",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# ── Exception Handlers ──────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ── Routes ──────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
def health():
    """Check whether the service is running and the model is ready."""
    if predictor.is_ready:
        return HealthResponse(
            status="ok",
            model_ready=True,
            model_version=predictor.model_version,
            message="Service is running and model is loaded.",
        )
    else:
        return HealthResponse(
            status="degraded",
            model_ready=False,
            model_version="none",
            message=(
                "Service is running but the model artifact is not loaded. "
                "Train the model first: `python -m app.train`"
            ),
        )


@app.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Prediction"],
)
def predict(body: PredictRequest):
    """Classify a GitHub issue into bug, feature, or question."""
    if not predictor.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Model is not loaded. "
                "Train the model first: `python -m app.train`"
            ),
        )

    try:
        text = preprocess_single(body.title, body.description)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    try:
        result = predictor.predict(text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}",
        )

    return PredictResponse(
        predicted_category=result["predicted_category"],
        class_scores=result["class_scores"],
        model_version=result["model_version"],
    )


@app.get("/", tags=["System"])
def root():
    return {
        "service": "DevAssist ML Service",
        "docs": "/docs",
        "health": "/health",
    }
