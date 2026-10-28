# DevAssist — Model Evaluation Report

**Model Version:** v1
**Test Samples:** 150

## Dataset Distribution (Test Set)

- **question**: 50
- **feature**: 50
- **bug**: 50

## Overall Metrics

| Metric | Value |
|--------|-------|
| Accuracy | 1.0000 |
| Macro Precision | 1.0000 |
| Macro Recall | 1.0000 |
| Macro F1 | 1.0000 |

## Per-Class Metrics

| Class | Precision | Recall | F1 | Support |
|-------|-----------|--------|----|---------|
| bug | 1.0000 | 1.0000 | 1.0000 | 50 |
| feature | 1.0000 | 1.0000 | 1.0000 | 50 |
| question | 1.0000 | 1.0000 | 1.0000 | 50 |

## Confusion Matrix

Rows = Actual, Columns = Predicted

| | bug | feature | question |
|---|---|---|---|
| **bug** | 50 | 0 | 0 |
| **feature** | 0 | 50 | 0 |
| **question** | 0 | 0 | 50 |

## Notes

> These metrics are computed on the **official held-out test set** from the NLBSE 2024 dataset.
> The TF-IDF vectorizer was fitted **only on training data**.
> No test data was used during training, preprocessing fit, or hyperparameter selection.