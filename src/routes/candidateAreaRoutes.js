const express = require('express');
const router = express.Router();
const candidateAreaController = require('../controllers/candidateAreaController');

router.get('/geojson', candidateAreaController.getCandidateAreasGeoJSON);

module.exports = router;
