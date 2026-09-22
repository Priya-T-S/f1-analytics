const { Router } = require('express');
const router = Router();
const {
  getDriverStandingsBySeason,
  getConstructorStandingsBySeason,
  getCurrentStandings,
  getPointsProgression
} = require('../controllers/standings.controller');

router.get('/progression/:year', getPointsProgression);

router.get('/drivers/:year', getDriverStandingsBySeason);
router.get('/constructors/:year', getConstructorStandingsBySeason);
router.get('/current', getCurrentStandings);

module.exports = router;
