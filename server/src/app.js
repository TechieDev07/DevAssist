'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const issueRoutes = require('./routes/issues');
const statsRoutes = require('./routes/stats');
const { getHealth } = require('./controllers/statsController');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security / utility middleware ────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman) in dev
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request body limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

// Stricter limit for the classification endpoint
const classifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Classification rate limit exceeded. Please slow down.' },
});
app.use('/api/issues/classify', classifyLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', getHealth);
app.use('/api/issues', issueRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
