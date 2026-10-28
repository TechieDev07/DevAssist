'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const {
  classifyIssue,
  getIssues,
  getIssueById,
  deleteIssue,
  confirmCategory,
} = require('../controllers/issueController');
const validate = require('../middleware/validate');

const router = Router();

// POST /api/issues/classify
router.post(
  '/classify',
  [
    body('title')
      .trim()
      .notEmpty().withMessage('title is required')
      .isLength({ max: 500 }).withMessage('title must be 500 characters or fewer'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 10000 }).withMessage('description must be 10,000 characters or fewer'),
    body('repositoryName')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 200 }),
    body('githubIssueUrl')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isURL({ require_protocol: true }).withMessage('githubIssueUrl must be a valid URL')
      .isLength({ max: 500 }),
  ],
  validate,
  classifyIssue
);

// GET /api/issues
router.get('/', getIssues);

// GET /api/issues/:id
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid issue ID')],
  validate,
  getIssueById
);

// DELETE /api/issues/:id
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid issue ID')],
  validate,
  deleteIssue
);

// PATCH /api/issues/:id/confirm
router.patch(
  '/:id/confirm',
  [
    param('id').isMongoId().withMessage('Invalid issue ID'),
    body('confirmedCategory')
      .isIn(['bug', 'feature', 'question'])
      .withMessage('confirmedCategory must be bug, feature, or question'),
  ],
  validate,
  confirmCategory
);

module.exports = router;
