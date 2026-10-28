'use strict';

const mongoose = require('mongoose');

const SUPPORTED_CATEGORIES = ['bug', 'feature', 'question'];

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [500, 'Title must be 500 characters or fewer'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [10000, 'Description must be 10,000 characters or fewer'],
      default: '',
    },
    repositoryName: {
      type: String,
      trim: true,
      maxlength: [200, 'Repository name must be 200 characters or fewer'],
      default: null,
    },
    githubIssueUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'URL must be 500 characters or fewer'],
      default: null,
    },
    predictedCategory: {
      type: String,
      required: true,
      enum: {
        values: SUPPORTED_CATEGORIES,
        message: 'predictedCategory must be bug, feature, or question',
      },
    },
    classScores: {
      type: Map,
      of: Number,
      default: null,
    },
    modelVersion: {
      type: String,
      required: true,
    },
    confirmedCategory: {
      type: String,
      enum: {
        values: [...SUPPORTED_CATEGORIES, null],
        message: 'confirmedCategory must be bug, feature, question, or null',
      },
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        // Convert Map to plain object for JSON serialisation
        if (ret.classScores instanceof Map) {
          ret.classScores = Object.fromEntries(ret.classScores);
        }
        return ret;
      },
    },
  }
);

// Indexes for common query patterns
issueSchema.index({ predictedCategory: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ title: 'text' }); // text search on title

module.exports = mongoose.model('Issue', issueSchema);
