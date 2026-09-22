const { Router } = require('express');
const router = Router();
const { getSeasons, getSyncStatus, runCronSync } = require('../controllers/meta.controller');

router.get('/seasons', getSeasons);
router.get('/sync/status', getSyncStatus);
router.get('/cron/sync', runCronSync);

module.exports = router;
