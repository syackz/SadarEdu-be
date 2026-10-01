const express = require('express');
const router = express.Router();
const simulasiController = require('../controllers/simulasiController');
const { authenticateToken } = require('../middleware/auth');

router.get('/scenarios', simulasiController.getScenarios);
router.post('/scenarios', authenticateToken, simulasiController.createScenario);

module.exports = router;
