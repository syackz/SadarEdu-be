const express = require('express');
const router = express.Router();
const wilayahController = require('../controllers/wilayahController');
const { authenticateToken } = require('../middleware/auth');

router.get('/geojson', wilayahController.getAllWilayahGeoJSON);
router.get('/:id', wilayahController.getWilayahById);
router.post('/', authenticateToken, wilayahController.createWilayah);

module.exports = router;
