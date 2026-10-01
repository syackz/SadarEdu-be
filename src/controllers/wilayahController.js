const db = require('../config/db');
const { toGeoJSONFeatureCollection } = require('../utils/geoHelper');

// Get All Wilayah as GeoJSON FeatureCollection
const getAllWilayahGeoJSON = async (req, res, next) => {
  try {
    const { level, parent_id } = req.query;
    let queryText = `
      SELECT 
        w.id_wilayah,
        w.kode_bps,
        w.parent_id,
        w.nama_wilayah,
        w.level_wilayah,
        w.luas_km2,
        ST_AsGeoJSON(w.geom) AS geojson
      FROM wilayah w
      WHERE 1=1
    `;
    const queryParams = [];

    if (level) {
      queryParams.push(level);
      queryText += ` AND w.level_wilayah = $${queryParams.length}`;
    }

    if (parent_id) {
      queryParams.push(parent_id);
      queryText += ` AND w.parent_id = $${queryParams.length}`;
    }

    queryText += ` ORDER BY w.nama_wilayah ASC`;

    const result = await db.query(queryText, queryParams);
    const geojson = toGeoJSONFeatureCollection(result.rows, 'geojson', 'id_wilayah');

    res.json({
      success: true,
      count: result.rows.length,
      data: geojson,
    });
  } catch (error) {
    next(error);
  }
};

// Get Wilayah By ID
const getWilayahById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryText = `
      SELECT 
        w.id_wilayah,
        w.kode_bps,
        w.parent_id,
        w.nama_wilayah,
        w.level_wilayah,
        w.luas_km2,
        ST_AsGeoJSON(w.geom) AS geojson
      FROM wilayah w
      WHERE w.id_wilayah = $1
    `;

    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Wilayah tidak ditemukan.' });
    }

    const feature = toGeoJSONFeatureCollection(result.rows, 'geojson', 'id_wilayah').features[0];

    res.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    next(error);
  }
};

// Create New Wilayah (MultiPolygon PostGIS)
const createWilayah = async (req, res, next) => {
  try {
    const { kode_bps, parent_id, nama_wilayah, level_wilayah, luas_km2, geojson } = req.body;

    if (!kode_bps || !nama_wilayah || !geojson) {
      return res.status(400).json({ success: false, message: 'kode_bps, nama_wilayah, dan geojson wajib diisi.' });
    }

    const queryText = `
      INSERT INTO wilayah (kode_bps, parent_id, nama_wilayah, level_wilayah, luas_km2, geom)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326))
      RETURNING id_wilayah, kode_bps, nama_wilayah, level_wilayah, luas_km2, ST_AsGeoJSON(geom) AS geojson
    `;

    const result = await db.query(queryText, [
      kode_bps,
      parent_id || null,
      nama_wilayah,
      level_wilayah || 'Kecamatan',
      luas_km2 || null,
      JSON.stringify(geojson),
    ]);

    res.status(201).json({
      success: true,
      message: 'Wilayah berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllWilayahGeoJSON,
  getWilayahById,
  createWilayah,
};
