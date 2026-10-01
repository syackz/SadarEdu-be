const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const wilayahRoutes = require('./wilayahRoutes');
const sekolahRoutes = require('./sekolahRoutes');
const indikatorRoutes = require('./indikatorRoutes');
const candidateAreaRoutes = require('./candidateAreaRoutes');
const simulasiRoutes = require('./simulasiRoutes');

router.use('/auth', authRoutes);
router.use('/wilayah', wilayahRoutes);
router.use('/sekolah', sekolahRoutes);
router.use('/indikator', indikatorRoutes);
router.use('/candidate-areas', candidateAreaRoutes);
router.use('/simulasi', simulasiRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SadarEdu API (PostgreSQL + PostGIS)',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
