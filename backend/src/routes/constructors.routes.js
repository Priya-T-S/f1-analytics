const { Router } = require('express');
const router = Router();
const {
  getAllConstructors,
  getConstructorById,
  getConstructorStandings
} = require('../controllers/constructors.controller');

router.get('/', getAllConstructors);
router.get('/:id', getConstructorById);
router.get('/:id/standings', getConstructorStandings);

module.exports = router;
