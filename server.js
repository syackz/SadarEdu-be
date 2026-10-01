require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');
const seedRoles = require('./src/config/seedRoles');

const PORT = process.env.PORT || 5000;

// Test DB Connection & Auto-seed Master Roles on Startup
db.query('SELECT NOW(), PostGIS_Full_Version()')
  .then(async (res) => {
    console.log('----------------------------------------------------');
    console.log('🐘 PostgreSQL Database Time:', res.rows[0].now);
    console.log('🗺️  PostGIS Version:', res.rows[0].postgis_full_version);
    console.log('----------------------------------------------------');

    // Auto-seed static roles into database
    await seedRoles();

    app.listen(PORT, () => {
      console.log(`🚀 SadarEdu API Server berjalan di http://localhost:${PORT}`);
      console.log(`📌 Health Check: http://localhost:${PORT}/api/v1/health`);
    });
  })
  .catch((err) => {
    console.error('❌ DB Connection failed:', err.message);
    console.log('⚠️  Server memulainya tanpa koneksi database aktif.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT} (periksa koneksi PostgreSQL Anda)`);
    });
  });
