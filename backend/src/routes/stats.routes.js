const { Router } = require('express');
const router = Router();
const {
  getCareerStats,
  getSeasonSummary,
  getRecords,
  getDriverComparison
} = require('../controllers/stats.controller');

router.get('/career', getCareerStats);
router.get('/season/:year', getSeasonSummary);
router.get('/records', getRecords);
router.get('/compare', getDriverComparison);

module.exports = router;
