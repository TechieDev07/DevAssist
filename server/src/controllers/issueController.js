'use strict';

const Issue = require('../models/Issue');
const mlService = require('../services/mlService');

// ── POST /api/issues/classify ────────────────────────────────────────────────

const classifyIssue = async (req, res, next) => {
  try {
    const { title, description = '', repositoryName, githubIssueUrl } = req.body;

    // Call Python ML service
    const prediction = await mlService.classify(title, description);

    // Persist to MongoDB
    const issue = await Issue.create({
      title: title.trim(),
      description: description.trim(),
      repositoryName: repositoryName ? repositoryName.trim() : null,
      githubIssueUrl: githubIssueUrl ? githubIssueUrl.trim() : null,
      predictedCategory: prediction.predictedCategory,
      classScores: prediction.classScores,
      modelVersion: prediction.modelVersion,
    });

    return res.status(201).json({
      success: true,
      data: issue.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/issues ──────────────────────────────────────────────────────────

const getIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.category) {
      const validCategories = ['bug', 'feature', 'question'];
      if (validCategories.includes(req.query.category)) {
        filter.predictedCategory = req.query.category;
      }
    }
    if (req.query.search) {
      // Simple substring match on title
      filter.title = { $regex: req.query.search.slice(0, 100), $options: 'i' };
    }

    const [issues, total] = await Promise.all([
      Issue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Issue.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: issues.map((doc) => {
        const obj = { ...doc };
        obj.id = (doc._id || doc.id || '').toString();
        delete obj._id;
        delete obj.__v;
        if (obj.classScores instanceof Map) {
          obj.classScores = Object.fromEntries(obj.classScores);
        }
        return obj;
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/issues/:id ──────────────────────────────────────────────────────

const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }
    return res.json({ success: true, data: issue.toJSON() });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid issue ID format' });
    }
    next(err);
  }
};

// ── DELETE /api/issues/:id ───────────────────────────────────────────────────

const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }
    return res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid issue ID format' });
    }
    next(err);
  }
};

// ── PATCH /api/issues/:id/confirm ────────────────────────────────────────────

const confirmCategory = async (req, res, next) => {
  try {
    const { confirmedCategory } = req.body;
    const validCategories = ['bug', 'feature', 'question'];
    if (!validCategories.includes(confirmedCategory)) {
      return res.status(400).json({
        success: false,
        error: 'confirmedCategory must be bug, feature, or question',
      });
    }
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { confirmedCategory },
      { new: true, runValidators: true }
    );
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }
    return res.json({ success: true, data: issue.toJSON() });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid issue ID format' });
    }
    next(err);
  }
};

module.exports = { classifyIssue, getIssues, getIssueById, deleteIssue, confirmCategory };
