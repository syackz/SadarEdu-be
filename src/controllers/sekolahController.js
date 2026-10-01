const db = require('../config/db');
const { toGeoJSONFeatureCollection } = require('../utils/geoHelper');

// Get All Sekolah as GeoJSON FeatureCollection
const getAllSekolahGeoJSON = async (req, res, next) => {
  try {
    const { jenjang, status_sekolah, id_wilayah } = req.query;

    let queryText = `
      SELECT 
        s.id_sekolah,
        s.npsn,
        s.id_wilayah,
        w.nama_wilayah,
        s.nama_sekolah,
        s.status_sekolah,
        s.alamat,
        s.jenjang,
        ST_AsGeoJSON(s.geom) AS geojson
      FROM sekolah s
      LEFT JOIN wilayah w ON s.id_wilayah = w.id_wilayah
      WHERE 1=1
    `;
    const queryParams = [];

    if (jenjang) {
      queryParams.push(jenjang);
      queryText += ` AND s.jenjang = $${queryParams.length}`;
    }

    if (status_sekolah) {
      queryParams.push(status_sekolah);
      queryText += ` AND s.status_sekolah = $${queryParams.length}`;
    }

    if (id_wilayah) {
      queryParams.push(id_wilayah);
      queryText += ` AND s.id_wilayah = $${queryParams.length}`;
    }

    queryText += ` ORDER BY s.nama_sekolah ASC`;

    const result = await db.query(queryText, queryParams);
    const geojson = toGeoJSONFeatureCollection(result.rows, 'geojson', 'id_sekolah');

    res.json({
      success: true,
      count: result.rows.length,
      data: geojson,
    });
  } catch (error) {
    next(error);
  }
};

// Create New Sekolah (Point PostGIS)
const createSekolah = async (req, res, next) => {
  try {
    const { npsn, id_wilayah, nama_sekolah, status_sekolah, alamat, jenjang, latitude, longitude } = req.body;

    if (!npsn || !nama_sekolah || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'npsn, nama_sekolah, latitude, dan longitude wajib diisi.' });
    }

    const queryText = `
      INSERT INTO sekolah (npsn, id_wilayah, nama_sekolah, status_sekolah, alamat, jenjang, geom)
      VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))
      RETURNING id_sekolah, npsn, nama_sekolah, status_sekolah, jenjang, ST_AsGeoJSON(geom) AS geojson
    `;

    const result = await db.query(queryText, [
      npsn,
      id_wilayah || null,
      nama_sekolah,
      status_sekolah || 'Negeri',
      alamat || '',
      jenjang || 'SMP',
      longitude, // PostGIS uses (Longitude, Latitude) order for ST_MakePoint
      latitude,
    ]);

    res.status(201).json({
      success: true,
      message: 'Sekolah berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get Sekolah Within Distance (PostGIS Spatial Radius Query)
const getSekolahNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius_km = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude dan longitude wajib diisi.' });
    }

    const radiusMeters = parseFloat(radius_km) * 1000;

    const queryText = `
      SELECT 
        s.id_sekolah,
        s.npsn,
        s.nama_sekolah,
        s.status_sekolah,
        s.jenjang,
        ST_Distance(
          s.geom::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000.0 AS jarak_km,
        ST_AsGeoJSON(s.geom) AS geojson
      FROM sekolah s
      WHERE ST_DWithin(
        s.geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY jarak_km ASC
    `;

    const result = await db.query(queryText, [longitude, latitude, radiusMeters]);
    const geojson = toGeoJSONFeatureCollection(result.rows, 'geojson', 'id_sekolah');

    res.json({
      success: true,
      count: result.rows.length,
      data: geojson,
    });
  } catch (error) {
    next(error);
  }
};

// Get Education Statistics (All or by school/year)
const getStatistikPendidikan = async (req, res, next) => {
  try {
    const { id_sekolah, tahun } = req.query;

    let queryText = `
      SELECT 
        st.id_statistik,
        st.id_sekolah,
        s.npsn,
        s.nama_sekolah,
        st.tahun,
        st.jumlah_siswa,
        st.jumlah_guru,
        st.jumlah_rombel,
        st.jumlah_ruang_kelas
      FROM statistik_pendidikan st
      JOIN sekolah s ON st.id_sekolah = s.id_sekolah
      WHERE 1=1
    `;
    const params = [];

    if (id_sekolah) {
      params.push(id_sekolah);
      queryText += ` AND st.id_sekolah = $${params.length}`;
    }

    if (tahun) {
      params.push(tahun);
      queryText += ` AND st.tahun = $${params.length}`;
    }

    queryText += ` ORDER BY st.tahun DESC, s.nama_sekolah ASC`;

    const result = await db.query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Create / Add Education Statistics for a school
const createStatistikPendidikan = async (req, res, next) => {
  try {
    const { id_sekolah, tahun, jumlah_siswa, jumlah_guru, jumlah_rombel, jumlah_ruang_kelas } = req.body;

    if (!id_sekolah || !tahun) {
      return res.status(400).json({ success: false, message: 'id_sekolah dan tahun wajib diisi.' });
    }

    const queryText = `
      INSERT INTO statistik_pendidikan (id_sekolah, tahun, jumlah_siswa, jumlah_guru, jumlah_rombel, jumlah_ruang_kelas)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(queryText, [
      id_sekolah,
      tahun,
      jumlah_siswa || 0,
      jumlah_guru || 0,
      jumlah_rombel || 0,
      jumlah_ruang_kelas || 0,
    ]);

    res.status(201).json({
      success: true,
      message: 'Statistik pendidikan berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSekolahGeoJSON,
  createSekolah,
  getSekolahNearby,
  getStatistikPendidikan,
  createStatistikPendidikan,
};

