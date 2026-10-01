const express = require('express');
const router = express.Router();
const sekolahController = require('../controllers/sekolahController');
const { authenticateToken } = require('../middleware/auth');

router.get('/geojson', sekolahController.getAllSekolahGeoJSON);
router.get('/nearby', sekolahController.getSekolahNearby);
router.get('/statistik', sekolahController.getStatistikPendidikan);
router.post('/statistik', authenticateToken, sekolahController.createStatistikPendidikan);
router.post('/', authenticateToken, sekolahController.createSekolah);

module.exports = router;
