const db = require('../config/db');

// Get All Indikator
const getAllIndikator = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM indikator ORDER BY id_indikator ASC');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Create Indikator
const createIndikator = async (req, res, next) => {
  try {
    const { kode_indikator, nama_indikator, satuan, arah_pengaruh, bobot } = req.body;
    const result = await db.query(
      `INSERT INTO indikator (kode_indikator, nama_indikator, satuan, arah_pengaruh, bobot)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [kode_indikator, nama_indikator, satuan, arah_pengaruh || 'Positif', bobot || 1.0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Get Priority Scores by Wilayah & Tahun
const getPriorityScores = async (req, res, next) => {
  try {
    const { tahun, id_wilayah } = req.query;
    let queryText = `
      SELECT p.*, w.nama_wilayah, w.kode_bps
      FROM priority_score p
      JOIN wilayah w ON p.id_wilayah = w.id_wilayah
      WHERE 1=1
    `;
    const params = [];
    if (tahun) {
      params.push(tahun);
      queryText += ` AND p.tahun = $${params.length}`;
    }
    if (id_wilayah) {
      params.push(id_wilayah);
      queryText += ` AND p.id_wilayah = $${params.length}`;
    }
    queryText += ` ORDER BY p.ranking ASC`;

    const result = await db.query(queryText, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllIndikator,
  createIndikator,
  getPriorityScores,
};
