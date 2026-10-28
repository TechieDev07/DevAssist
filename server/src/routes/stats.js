'use strict';

const { Router } = require('express');
const { getStats, getHealth } = require('../controllers/statsController');

const router = Router();

router.get('/', getStats);

module.exports = router;
