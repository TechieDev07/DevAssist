'use strict';

const Issue = require('../models/Issue');
const mlService = require('../services/mlService');

// ── GET /api/stats ───────────────────────────────────────────────────────────

const getStats = async (req, res, next) => {
  try {
    const [total, bugCount, featureCount, questionCount, recentIssues] =
      await Promise.all([
        Issue.countDocuments(),
        Issue.countDocuments({ predictedCategory: 'bug' }),
        Issue.countDocuments({ predictedCategory: 'feature' }),
        Issue.countDocuments({ predictedCategory: 'question' }),
        Issue.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title predictedCategory createdAt')
          .lean(),
      ]);

    return res.json({
      success: true,
      data: {
        total,
        byCategory: {
          bug: bugCount,
          feature: featureCount,
          question: questionCount,
        },
        recentActivity: recentIssues.map((doc) => ({
          id: doc._id.toString(),
          title: doc.title,
          predictedCategory: doc.predictedCategory,
          createdAt: doc.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/health ──────────────────────────────────────────────────────────

const getHealth = async (req, res, next) => {
  try {
    const mlHealth = await mlService.checkHealth();
    const dbState = require('mongoose').connection.readyState;
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    return res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: { status: dbStates[dbState] || 'unknown' },
          mlService: mlHealth,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getHealth };
