const express = require('express');
const router = express.Router();
const indikatorController = require('../controllers/indikatorController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', indikatorController.getAllIndikator);
router.post('/', authenticateToken, indikatorController.createIndikator);
router.get('/priority-scores', indikatorController.getPriorityScores);

module.exports = router;
