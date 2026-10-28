'use strict';

const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = parseInt(process.env.ML_SERVICE_TIMEOUT_MS || '10000', 10);

/**
 * Send a classification request to the Python ML service.
 * @param {string} title
 * @param {string} description
 * @returns {Promise<{predictedCategory: string, classScores: object, modelVersion: string}>}
 */
async function classify(title, description = '') {
  let response;
  try {
    response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      { title, description },
      {
        timeout: TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      const error = new Error('ML service is unavailable. Please try again later.');
      error.statusCode = 503;
      throw error;
    }
    if (err.code === 'ECONNABORTED') {
      const error = new Error('ML service request timed out.');
      error.statusCode = 504;
      throw error;
    }
    if (err.response) {
      const status = err.response.status;
      const detail = err.response.data?.detail || 'Prediction failed';
      const error = new Error(detail);
      error.statusCode = status >= 500 ? 502 : 422;
      throw error;
    }
    throw err;
  }

  const data = response.data;

  // Validate the response shape
  if (!data.predicted_category || typeof data.predicted_category !== 'string') {
    const error = new Error('ML service returned an unexpected response format.');
    error.statusCode = 502;
    throw error;
  }

  const VALID_CATEGORIES = ['bug', 'feature', 'question'];
  if (!VALID_CATEGORIES.includes(data.predicted_category)) {
    const error = new Error(
      `ML service returned an unsupported category: ${data.predicted_category}`
    );
    error.statusCode = 502;
    throw error;
  }

  return {
    predictedCategory: data.predicted_category,
    classScores: data.class_scores || null,
    modelVersion: data.model_version || 'unknown',
  };
}

/**
 * Check ML service health.
 * @returns {Promise<object>}
 */
async function checkHealth() {
  try {
    const resp = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    return { reachable: true, ...resp.data };
  } catch {
    return { reachable: false, status: 'unreachable' };
  }
}

module.exports = { classify, checkHealth };
