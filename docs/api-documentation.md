# DevAssist REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Classify Issue

Predict the classification category for an issue report and save the result into MongoDB.

- **Method**: `POST`
- **Endpoint**: `/issues/classify`
- **Rate Limit**: 30 requests / minute

### Request Body (JSON)
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | **Yes** | Issue title (1 - 500 characters) |
| `description` | string | No | Issue body/description (up to 10,000 characters) |
| `repositoryName`| string | No | Associated GitHub repository identifier (e.g. `owner/repo`) |
| `githubIssueUrl`| string | No | Valid URL pointing to the GitHub issue |

#### Example Request:
```json
{
  "title": "Database connection pool exhausted during peak traffic",
  "description": "Server responds with error 500 after 100 concurrent requests.",
  "repositoryName": "facebook/react"
}
```

### Response
- **Status Code**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "67201cbb3d84f2249a0e6912",
    "title": "Database connection pool exhausted during peak traffic",
    "description": "Server responds with error 500 after 100 concurrent requests.",
    "repositoryName": "facebook/react",
    "githubIssueUrl": null,
    "predictedCategory": "bug",
    "classScores": {
      "bug": 0.842105,
      "feature": 0.089123,
      "question": 0.068772
    },
    "modelVersion": "v1",
    "confirmedCategory": null,
    "createdAt": "2026-10-28T19:20:00.000Z",
    "updatedAt": "2026-10-28T19:20:00.000Z"
  }
}
```

---

## 2. Get Issues (Paginated History)

Retrieve previously classified issues with optional filtering and pagination.

- **Method**: `GET`
- **Endpoint**: `/issues`

### Query Parameters
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Current page number (>= 1) |
| `limit` | integer | 10 | Results per page (1 - 100) |
| `category` | string | - | Filter by category (`bug`, `feature`, `question`) |
| `search` | string | - | Filter by substring within the issue title |

#### Example Request:
`GET /api/issues?page=1&limit=10&category=bug`

### Response
- **Status Code**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "67201cbb3d84f2249a0e6912",
      "title": "Database connection pool exhausted during peak traffic",
      "predictedCategory": "bug",
      "classScores": { "bug": 0.84, "feature": 0.08, "question": 0.08 },
      "createdAt": "2026-10-28T19:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 3. Get Issue by ID

Retrieve detailed record of a single classified issue.

- **Method**: `GET`
- **Endpoint**: `/issues/:id`

### Response
- **Status Code**: `200 OK`
- **404 Not Found**: If issue does not exist.
- **400 Bad Request**: If ID format is invalid.

---

## 4. Delete Issue

Remove a classification record from the database.

- **Method**: `DELETE`
- **Endpoint**: `/issues/:id`

### Response
- **Status Code**: `200 OK`
```json
{
  "success": true,
  "message": "Issue deleted successfully"
}
```

---

## 5. Get Aggregate Statistics

Get database-derived classification metrics and recent activity for the dashboard.

- **Method**: `GET`
- **Endpoint**: `/stats`

### Response
- **Status Code**: `200 OK`
```json
{
  "success": true,
  "data": {
    "total": 45,
    "byCategory": {
      "bug": 20,
      "feature": 15,
      "question": 10
    },
    "recentActivity": [
      {
        "id": "67201cbb3d84f2249a0e6912",
        "title": "Database connection pool exhausted",
        "predictedCategory": "bug",
        "createdAt": "2026-10-28T19:20:00.000Z"
      }
    ]
  }
}
```

---

## 6. System Health Check

Inspect the operational readiness of the API, MongoDB connection, and the Python ML service.

- **Method**: `GET`
- **Endpoint**: `/health`

### Response
- **Status Code**: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-10-28T19:25:00.000Z",
    "services": {
      "database": { "status": "connected" },
      "mlService": { "reachable": true, "status": "ok", "model_ready": true, "model_version": "v1" }
    }
  }
}
```
