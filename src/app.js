const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large GeoJSON payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/v1', apiRoutes);

// Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Selamat datang di SadarEdu RESTful API (PostgreSQL + PostGIS)',
    docs: '/api/v1/health',
  });
});

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} tidak ditemukan.`,
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
