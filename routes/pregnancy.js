const express = require('express');
const { getWeekInfo } = require('../controllers/pregnancyController');

const router = express.Router();

// Get AI-generated pregnancy week information
router.get('/week-info', getWeekInfo);

// Alias for backward compatibility (frontend uses /api/pregnancy-info)
router.get('/info', getWeekInfo);

module.exports = router;
