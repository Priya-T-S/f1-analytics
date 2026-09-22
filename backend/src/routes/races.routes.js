const { Router } = require('express');
const router = Router();
const {
  getRacesBySeason,
  getRaceById,
  getRaceResults,
  getRaceTyres,
  getRaceSectors
} = require('../controllers/races.controller');

router.get('/season/:year', getRacesBySeason);
router.get('/:id', getRaceById);
router.get('/:id/results', getRaceResults);
router.get('/:id/tyres', getRaceTyres);
router.get('/:id/sectors', getRaceSectors);

module.exports = router;
