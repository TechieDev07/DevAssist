"""
preprocess.py — Text preprocessing for GitHub issue classification.

Combines title + description into a single text field, normalises whitespace,
and handles missing / empty values without removing important bug-report tokens
(e.g. negation words, error codes).
"""

import re
import pandas as pd


# ── Constants ──────────────────────────────────────────────────────────────────
LABEL_MAP = {
    "bug": "bug",
    "Bug": "bug",
    "BUG": "bug",
    "feature": "feature",
    "Feature": "feature",
    "FEATURE": "feature",
    "feature_request": "feature",
    "enhancement": "feature",
    "question": "question",
    "Question": "question",
    "QUESTION": "question",
}

SUPPORTED_CLASSES = ["bug", "feature", "question"]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _clean_text(text: str) -> str:
    """
    Light normalisation:
    - Lowercase
    - Collapse whitespace (tabs, newlines → single space)
    - Strip leading/trailing whitespace
    - Remove URLs (they rarely carry classification signal)
    - Keep punctuation & negation tokens intact
    """
    if not isinstance(text, str) or not text.strip():
        return ""
    text = text.lower()
    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def combine_title_description(title: str, description: str) -> str:
    """
    Merge title and description into a single string for the vectoriser.
    Title is prepended with extra weight by repeating it.
    """
    title_clean = _clean_text(title)
    desc_clean = _clean_text(description)

    if title_clean and desc_clean:
        # Repeat title to give it slightly higher TF weight
        return f"{title_clean} {title_clean} {desc_clean}"
    if title_clean:
        return title_clean
    if desc_clean:
        return desc_clean
    return ""


def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a raw DataFrame with columns that include a title, a body/description,
    and a label column, and returns a cleaned DataFrame with:
      - 'text'  : combined & cleaned input feature
      - 'label' : normalised class string
    """
    df = df.copy()

    # ── Locate title column ─────────────────────────────────────────────────
    title_col = None
    for candidate in ("title", "Title", "issue_title"):
        if candidate in df.columns:
            title_col = candidate
            break
    if title_col is None:
        raise ValueError(f"No title column found. Available: {list(df.columns)}")

    # ── Locate body/description column ─────────────────────────────────────
    body_col = None
    for candidate in ("body", "description", "Body", "Description", "text"):
        if candidate in df.columns:
            body_col = candidate
            break
    # body_col may legitimately be absent

    # ── Locate label column ─────────────────────────────────────────────────
    label_col = None
    for candidate in ("label", "labels", "category", "type", "Label", "class"):
        if candidate in df.columns:
            label_col = candidate
            break
    if label_col is None:
        raise ValueError(f"No label column found. Available: {list(df.columns)}")

    # ── Build feature text ──────────────────────────────────────────────────
    titles = df[title_col].fillna("").astype(str)
    bodies = df[body_col].fillna("").astype(str) if body_col else pd.Series([""] * len(df))

    df["text"] = [
        combine_title_description(t, b)
        for t, b in zip(titles, bodies)
    ]

    # ── Normalise labels ────────────────────────────────────────────────────
    df["label"] = df[label_col].map(lambda x: LABEL_MAP.get(str(x).strip(), str(x).strip().lower()))

    # ── Drop rows with unsupported labels or empty text ─────────────────────
    before = len(df)
    df = df[df["label"].isin(SUPPORTED_CLASSES)]
    df = df[df["text"].str.len() > 0]
    after = len(df)

    if before != after:
        print(f"[preprocess] Dropped {before - after} rows (unsupported label or empty text).")

    return df[["text", "label"]].reset_index(drop=True)


def preprocess_single(title: str, description: str = "") -> str:
    """
    Preprocess a single inference request.
    Returns the cleaned combined text.
    Raises ValueError if the result is empty.
    """
    result = combine_title_description(title, description)
    if not result:
        raise ValueError("Both title and description are empty after preprocessing.")
    return result
