# DevAssist System Architecture

## Overview
DevAssist is an end-to-end intelligent GitHub issue classification system structured into three decoupled layers:
1. **Frontend (Client)**: Modern React SPA built with Vite, React Router, Recharts, and accessible semantic components styled with a custom dark theme.
2. **Backend (Server)**: Node.js Express REST API managing validation, MongoDB persistence, statistics aggregations, and orchestrating requests to the Machine Learning microservice.
3. **Machine Learning Service (ML Service)**: Python FastAPI service serving a trained Natural Language Processing pipeline (TF-IDF vectorizer + Multinomial Naive Bayes).

---

## Architectural Diagram

```mermaid
flowchart TD
    subgraph Client ["Client (React + Vite SPA)"]
        UI["React UI (Dashboard / Classify / History)"]
        APIService["API Client (Axios)"]
        UI --> APIService
    end

    subgraph Server ["Backend (Node.js & Express)"]
        Router["Express Router (/api/issues, /api/stats)"]
        Validator["Input Validation Middleware"]
        Controller["Issue & Stats Controller"]
        DBLayer["Mongoose Models"]
        MLClient["ML Service HTTP Client"]

        APIService -->|HTTP/REST| Router
        Router --> Validator
        Validator --> Controller
        Controller --> MLClient
        Controller --> DBLayer
    end

    subgraph Database ["Persistence Layer"]
        MongoDB[("MongoDB Database")]
        DBLayer -->|Query / Upsert| MongoDB
    end

    subgraph ML ["ML Microservice (FastAPI + scikit-learn)"]
        FastAPI["FastAPI Endpoint (/predict, /health)"]
        Preprocess["Text Preprocessor"]
        Pipeline["TF-IDF + MultinomialNB Pipeline"]

        MLClient -->|HTTP POST :8000/predict| FastAPI
        FastAPI --> Preprocess
        Preprocess --> Pipeline
    end
```

---

## Request Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant React as React Frontend
    participant Node as Express Backend
    participant DB as MongoDB
    participant Python as FastAPI ML Service

    User->>React: Enters issue Title & Description
    React->>Node: POST /api/issues/classify { title, description }
    Node->>Node: Validate request body schema
    Node->>Python: POST /predict { title, description }
    Python->>Python: Clean & combine text tokens
    Python->>Python: Transform with TF-IDF & Predict with Naive Bayes
    Python-->>Node: 200 OK { predictedCategory, classScores, modelVersion }
    Node->>DB: Save classification record with timestamps & scores
    DB-->>Node: Issue document saved with generated _id
    Node-->>React: 201 Created { success: true, data: { id, title, predictedCategory, ... } }
    React-->>User: Renders classification result & confidence breakdown
```

---

## Security & Reliability Design
- **Downstream Resiliency**: Node.js implements timeout protection and handles connection failures gracefully if the ML service is unreachable (returning 503 Service Unavailable).
- **Rate Limiting**: Express middleware applies granular rate limits on classification actions to protect prediction endpoints against burst abuse.
- **Input Sanitization**: Multi-layer validation via Pydantic on the ML service and `express-validator` on the Express API.
- **Data Isolation**: Database credentials, service URLs, and port bindings are completely managed via `.env` files with version-controlled `.env.example` templates.
