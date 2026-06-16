const { Router } = require('express');
const router = Router();
const {
  getRacesBySeason,
  getRaceById,
  getRaceResults
} = require('../controllers/races.controller');

router.get('/season/:year', getRacesBySeason);
router.get('/:id', getRaceById);
router.get('/:id/results', getRaceResults);

module.exports = router;
