const db = require('../config/db');
const { toGeoJSONFeatureCollection } = require('../utils/geoHelper');

// Get All Candidate Areas as GeoJSON
const getCandidateAreasGeoJSON = async (req, res, next) => {
  try {
    const { status_kandidat, id_wilayah } = req.query;
    let queryText = `
      SELECT 
        c.id_candidate,
        c.id_wilayah,
        w.nama_wilayah,
        c.tahun,
        c.skor_suitability,
        c.status_kandidat,
        c.luas_ha,
        ST_AsGeoJSON(c.geom) AS geojson
      FROM candidate_area c
      LEFT JOIN wilayah w ON c.id_wilayah = w.id_wilayah
      WHERE 1=1
    `;
    const params = [];
    if (status_kandidat) {
      params.push(status_kandidat);
      queryText += ` AND c.status_kandidat = $${params.length}`;
    }
    if (id_wilayah) {
      params.push(id_wilayah);
      queryText += ` AND c.id_wilayah = $${params.length}`;
    }
    queryText += ` ORDER BY c.skor_suitability DESC`;

    const result = await db.query(queryText, params);
    const geojson = toGeoJSONFeatureCollection(result.rows, 'geojson', 'id_candidate');

    res.json({ success: true, count: result.rows.length, data: geojson });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCandidateAreasGeoJSON,
};
