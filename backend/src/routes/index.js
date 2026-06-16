const { Router } = require('express');
const router = Router();

router.use('/drivers', require('./drivers.routes'));
router.use('/constructors', require('./constructors.routes'));
router.use('/circuits', require('./circuits.routes'));
router.use('/races', require('./races.routes'));
router.use('/standings', require('./standings.routes'));
router.use('/stats', require('./stats.routes'));

module.exports = router;
