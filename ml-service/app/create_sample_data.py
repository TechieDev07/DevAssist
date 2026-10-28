"""
create_sample_data.py — Generate a synthetic development dataset.

USE ONLY FOR DEVELOPMENT / TESTING.
For actual benchmarking, download the official NLBSE 2024 dataset.

Usage:
    python -m app.create_sample_data
"""

import csv
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

random.seed(42)

BUG_TITLES = [
    "Application crashes on startup",
    "Login button does not respond",
    "Null pointer exception in UserService",
    "Memory leak when processing large files",
    "Cannot connect to database after timeout",
    "UI freezes when loading dashboard",
    "Error 500 on POST /api/users",
    "Not working after latest update",
    "File upload fails with large files",
    "Authentication token expires prematurely",
    "Race condition in queue processing",
    "CSS layout broken on mobile",
    "Incorrect date formatting in reports",
    "Search returns empty results unexpectedly",
    "Export to CSV produces malformed output",
    "Image resize produces artifacts",
    "Pagination skips records",
    "Sort order reversed unexpectedly",
    "Drag and drop not working in Firefox",
    "Dark mode toggle breaks layout",
]
BUG_BODIES = [
    "Steps to reproduce: 1. Open app 2. Click login 3. App closes",
    "After the latest release, clicking the button does nothing.",
    "Stack trace: NullPointerException at line 42 of UserService.java",
    "Memory usage grows linearly and never drops. Must restart.",
    "Getting connection refused errors intermittently.",
    "The entire interface becomes unresponsive for 10+ seconds.",
    "Server returns 500. Logs show database connection pool exhausted.",
    "Worked fine on v1.2, broken since v1.3 upgrade.",
    "Files over 10MB cause the upload to hang indefinitely.",
    "Users are logged out after 5 minutes despite 'remember me'.",
    "Two concurrent requests sometimes both succeed incorrectly.",
    "On iPhone 12, sidebar overlaps main content.",
    "Dates show as MM/DD instead of DD/MM in the EU locale.",
    "Search for exact terms returns zero results.",
    "CSV export contains extra quotes and broken line endings.",
    "Resized images show pixelation and colour banding.",
    "Page 2 shows the same items as page 1.",
    "Ascending sort shows Z before A.",
    "Cannot drag items in Firefox 120.",
    "Enabling dark mode resets font size to default.",
]

FEATURE_TITLES = [
    "Add dark mode support",
    "Allow bulk deletion of records",
    "Implement CSV export",
    "Add two-factor authentication",
    "Support GitHub OAuth login",
    "Add keyboard shortcuts",
    "Implement real-time notifications",
    "Allow customising the dashboard layout",
    "Add API rate limiting controls",
    "Support multiple languages",
    "Add advanced search filters",
    "Allow scheduling recurring tasks",
    "Implement undo/redo functionality",
    "Add data visualisation charts",
    "Support webhook integrations",
    "Add team collaboration features",
    "Implement drag and drop reordering",
    "Add mobile app support",
    "Allow exporting to PDF",
    "Integrate with Slack",
]
FEATURE_BODIES = [
    "It would be great to have a dark theme for late-night coding.",
    "Please add the ability to select and delete multiple rows at once.",
    "We need to export issue data to CSV for reporting.",
    "For security, please add 2FA via authenticator apps.",
    "Allow signing in with GitHub credentials.",
    "Common shortcuts like Ctrl+S to save would improve workflow.",
    "Push notifications for new assignments would be helpful.",
    "Users should be able to rearrange dashboard widgets.",
    "We need per-user API key rate limits.",
    "Support at minimum English, Spanish, and French.",
    "Allow filtering by date range, assignee, and priority.",
    "Recurring tasks that repeat daily, weekly, or monthly.",
    "Undo accidental deletions with Ctrl+Z.",
    "Bar charts and pie charts for issue statistics.",
    "Trigger external services via HTTP webhooks.",
    "Shared workspaces and permission roles for teams.",
    "Drag items in kanban boards to reorder priority.",
    "iOS and Android apps for mobile access.",
    "Export reports as PDF with company branding.",
    "Get notified in Slack when issues are assigned.",
]

QUESTION_TITLES = [
    "How do I reset my password?",
    "What is the maximum file upload size?",
    "How to configure SMTP for email notifications?",
    "Can I use this with MongoDB Atlas?",
    "How to migrate data from v1 to v2?",
    "What are the system requirements?",
    "How do I enable debug logging?",
    "Is there a public API?",
    "How to integrate with CI/CD pipelines?",
    "Can I self-host this application?",
    "What is the licence for commercial use?",
    "How do I back up my data?",
    "Does this support Windows Server?",
    "How to configure environment variables?",
    "How do I invite team members?",
    "What browsers are supported?",
    "How to set up SSL/HTTPS?",
    "Is there a trial period?",
    "How do I contact support?",
    "Where are logs stored?",
]
QUESTION_BODIES = [
    "I forgot my password and the reset email isn't arriving.",
    "I need to upload files but unsure of the size limit.",
    "I want to receive email alerts but don't know the SMTP settings.",
    "Our database is on Atlas; is that supported?",
    "We're upgrading from version 1 and need a migration guide.",
    "What are the minimum hardware requirements for production?",
    "How do I turn on verbose logging for troubleshooting?",
    "Is there REST API documentation I can use to build integrations?",
    "We use GitHub Actions; can this trigger builds automatically?",
    "We prefer to host everything on our own servers.",
    "We're a company; do we need a commercial licence?",
    "What is the recommended backup strategy?",
    "Our servers run Windows Server 2022.",
    "Where do I put the DATABASE_URL and other variables?",
    "How do I add colleagues to my project?",
    "Is IE11 supported? What about Edge?",
    "How do I configure an SSL certificate?",
    "Is there a free trial before purchasing?",
    "Who do I contact for paid support?",
    "Where can I find application log files?",
]


def make_dataset(n_per_class: int, seed_offset: int = 0):
    rows = []
    for i in range(n_per_class):
        idx = (i + seed_offset) % 20
        rows.append({
            "title": BUG_TITLES[idx],
            "body": BUG_BODIES[idx],
            "label": "bug",
        })
    for i in range(n_per_class):
        idx = (i + seed_offset) % 20
        rows.append({
            "title": FEATURE_TITLES[idx],
            "body": FEATURE_BODIES[idx],
            "label": "feature",
        })
    for i in range(n_per_class):
        idx = (i + seed_offset) % 20
        rows.append({
            "title": QUESTION_TITLES[idx],
            "body": QUESTION_BODIES[idx],
            "label": "question",
        })
    random.shuffle(rows)
    return rows


def write_csv(path: Path, rows: list[dict]):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["title", "body", "label"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"[create_sample_data] Wrote {len(rows)} rows to {path}")


if __name__ == "__main__":
    print("[WARNING] Generating SYNTHETIC development dataset - NOT the official NLBSE 2024 data.")
    print("          Metrics from this data should NOT be used for benchmarking.\n")

    train_rows = make_dataset(n_per_class=167, seed_offset=0)   # ~500 train rows
    test_rows = make_dataset(n_per_class=50, seed_offset=7)     # ~150 test rows

    train_path = DATA_DIR / "train.csv"
    test_path = DATA_DIR / "test.csv"

    write_csv(train_path, train_rows)
    write_csv(test_path, test_rows)

    print("\n[OK] Synthetic data created at:")
    print(f"   {train_path}")
    print(f"   {test_path}")
    print("\nReplace with the official NLBSE 2024 dataset for real benchmarking.")
