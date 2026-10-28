# Dataset Source & Attribution

## NLBSE 2024 Issue Report Classification Dataset

**Official Repository:** https://github.com/nlbse2024/issue-report-classification

**Citation:** NLBSE 2024 Tool Competition

### About the Dataset

The NLBSE 2024 dataset contains GitHub issue reports labelled into three categories:
- **bug** — Issue reports describing defects or unexpected behaviour
- **feature** — Enhancement or feature requests
- **question** — General questions or support requests

The dataset contains approximately 3,000 labelled issue reports sourced from real-world GitHub repositories, split into an official training set (~1,500 records) and test set (~1,500 records).

### How to Obtain the Dataset

1. Visit the official repository: https://github.com/nlbse2024/issue-report-classification
2. Check the repository's `data/` directory or the associated Zenodo deposit for CSV files.
3. Download `train.csv` and `test.csv` (or equivalent files).
4. Place them in this project's `data/` directory:
   ```
   DevAssist/
   └── data/
       ├── train.csv
       ├── test.csv
       └── README.md   ← this file
   ```

### Expected CSV Schema

The CSV files are expected to contain at minimum:
- A **title** column (the GitHub issue title)
- A **body** or **description** column (the issue body text)
- A **label** column with values: `bug`, `feature`, or `question`

Inspect the actual files for exact column names — the preprocessing pipeline handles common variants.

### License / Usage Conditions

Refer to the official NLBSE 2024 repository for the dataset license and any usage restrictions. Typical research datasets may be licensed for academic and research use only. Do not redistribute the dataset without checking the applicable terms.

### Alternative: Using a Synthetic Dataset for Development

If the official dataset is temporarily unavailable, you can generate a small synthetic dataset for development purposes using:

```bash
python ml-service/app/create_sample_data.py
```

This creates a minimal `data/train.csv` and `data/test.csv` with synthetic examples. **Do not report metrics from synthetic data as if they were from the official benchmark.**
