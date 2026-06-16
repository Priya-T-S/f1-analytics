const { Router } = require('express');
const router = Router();
const {
  getAllCircuits,
  getCircuitById,
  getCircuitWinners
} = require('../controllers/circuits.controller');

router.get('/', getAllCircuits);
router.get('/:id', getCircuitById);
router.get('/:id/winners', getCircuitWinners);

module.exports = router;
