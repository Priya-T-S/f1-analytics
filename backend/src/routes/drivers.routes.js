const { Router } = require('express');
const router = Router();
const {
  getAllDrivers,
  getDriverById,
  getDriverStandings,
  getDriverRaceHistory,
  getHeadToHead
} = require('../controllers/drivers.controller');

router.get('/', getAllDrivers);
router.get('/:id', getDriverById);
router.get('/:id/standings', getDriverStandings);
router.get('/:id/races', getDriverRaceHistory);
router.get('/head-to-head/:d1/:d2', getHeadToHead);

module.exports = router;
