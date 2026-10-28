'use strict';

/**
 * Backend API tests using supertest + Jest.
 * Run: npm test (from server/ directory)
 *
 * MongoDB and ML service are mocked — no live connections needed.
 */

const request = require('supertest');

// ── Mock mongoose ─────────────────────────────────────────────────────────────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
      host: 'mocked-host',
      on: jest.fn(),
    },
  };
});

// ── Mock Issue model ──────────────────────────────────────────────────────────
jest.mock('../src/models/Issue');
const Issue = require('../src/models/Issue');

// ── Mock ML service ───────────────────────────────────────────────────────────
jest.mock('../src/services/mlService');
const mlService = require('../src/services/mlService');

// ── App setup ─────────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/devassist_test';
process.env.ML_SERVICE_URL = 'http://localhost:8000';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const app = require('../src/app');

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockIssueDoc = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  id: '507f1f77bcf86cd799439011',
  title: 'Login button not working',
  description: 'Nothing happens on click',
  repositoryName: null,
  githubIssueUrl: null,
  predictedCategory: 'bug',
  classScores: { bug: 0.8, feature: 0.1, question: 0.1 },
  modelVersion: 'v1',
  confirmedCategory: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// ── POST /api/issues/classify ─────────────────────────────────────────────────
describe('POST /api/issues/classify', () => {
  beforeEach(() => {
    mlService.classify.mockResolvedValue({
      predictedCategory: 'bug',
      classScores: { bug: 0.8, feature: 0.1, question: 0.1 },
      modelVersion: 'v1',
    });
    Issue.create.mockResolvedValue({
      toJSON: () => mockIssueDoc(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 with prediction for a valid request', async () => {
    const res = await request(app)
      .post('/api/issues/classify')
      .send({ title: 'Login button not working', description: 'Click does nothing' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.predictedCategory).toBe('bug');
    expect(res.body.data.classScores).toBeDefined();
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/issues/classify')
      .send({ description: 'Missing title' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/api/issues/classify')
      .send({ title: '', description: 'Empty title' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when title exceeds 500 characters', async () => {
    const res = await request(app)
      .post('/api/issues/classify')
      .send({ title: 'a'.repeat(501), description: 'desc' });

    expect(res.status).toBe(400);
  });

  it('returns 503 when ML service is unavailable', async () => {
    const err = new Error('ML service is unavailable');
    err.statusCode = 503;
    mlService.classify.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/issues/classify')
      .send({ title: 'Test issue', description: 'Some description' });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });

  it('accepts request without description (optional)', async () => {
    const res = await request(app)
      .post('/api/issues/classify')
      .send({ title: 'Minimal issue' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// ── GET /api/issues ───────────────────────────────────────────────────────────
describe('GET /api/issues', () => {
  beforeEach(() => {
    Issue.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([mockIssueDoc()]),
    });
    Issue.countDocuments.mockResolvedValue(1);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns paginated issue list', async () => {
    const res = await request(app).get('/api/issues');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/issues?category=bug');

    expect(res.status).toBe(200);
  });

  it('ignores invalid category filter', async () => {
    const res = await request(app).get('/api/issues?category=invalid');

    expect(res.status).toBe(200); // still returns results, just without filter
  });

  it('supports search query', async () => {
    const res = await request(app).get('/api/issues?search=login');

    expect(res.status).toBe(200);
  });
});

// ── GET /api/issues/:id ───────────────────────────────────────────────────────
describe('GET /api/issues/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 for a valid existing ID', async () => {
    Issue.findById.mockResolvedValue({ toJSON: () => mockIssueDoc() });

    const res = await request(app).get('/api/issues/507f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for a valid-format but non-existent ID', async () => {
    Issue.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/issues/507f1f77bcf86cd799439011');

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid ID format', async () => {
    const res = await request(app).get('/api/issues/not-an-id');

    expect(res.status).toBe(400);
  });
});

// ── DELETE /api/issues/:id ────────────────────────────────────────────────────
describe('DELETE /api/issues/:id', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 on successful delete', async () => {
    Issue.findByIdAndDelete.mockResolvedValue(mockIssueDoc());

    const res = await request(app).delete('/api/issues/507f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when record does not exist', async () => {
    Issue.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app).delete('/api/issues/507f1f77bcf86cd799439011');

    expect(res.status).toBe(404);
  });
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
describe('GET /api/stats', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns stats with category counts', async () => {
    Issue.countDocuments
      .mockResolvedValueOnce(30) // total
      .mockResolvedValueOnce(15) // bug
      .mockResolvedValueOnce(10) // feature
      .mockResolvedValueOnce(5); // question
    Issue.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(30);
    expect(res.body.data.byCategory.bug).toBe(15);
    expect(res.body.data.byCategory.feature).toBe(10);
    expect(res.body.data.byCategory.question).toBe(5);
  });
});

// ── GET /api/health ───────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns 200 with health status', async () => {
    mlService.checkHealth.mockResolvedValue({ reachable: true, status: 'ok' });

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.services).toBeDefined();
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
describe('Unknown routes', () => {
  it('returns 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
  });
});
