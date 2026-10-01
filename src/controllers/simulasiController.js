const db = require('../config/db');

// Get Scenario Intervensi
const getScenarios = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT s.*, w.nama_wilayah 
      FROM scenario_intervensi s
      LEFT JOIN wilayah w ON s.id_wilayah = w.id_wilayah
      ORDER BY s.id_scenario DESC
    `);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// Create Scenario Intervensi & Run Simulation
const createScenario = async (req, res, next) => {
  try {
    const { id_wilayah, nama_scenario, tipe_intervensi, perubahan_kapasitas, parameter_json } = req.body;

    if (!id_wilayah || !nama_scenario) {
      return res.status(400).json({ success: false, message: 'id_wilayah dan nama_scenario wajib diisi.' });
    }

    const scenarioResult = await db.query(
      `INSERT INTO scenario_intervensi (id_wilayah, nama_scenario, tipe_intervensi, perubahan_kapasitas, parameter_json)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_wilayah, nama_scenario, tipe_intervensi || 'Penambahan Sekolah', perubahan_kapasitas || 0, JSON.stringify(parameter_json || {})]
    );

    const scenario = scenarioResult.rows[0];

    // Dummy simulation result calculation
    const skorSebelum = 65.5;
    const skorSesudah = skorSebelum + (perubahan_kapasitas > 0 ? 12.4 : 0);

    const hasilResult = await db.query(
      `INSERT INTO hasil_simulasi (id_scenario, skor_sebelum, skor_sesudah, indikator_sebelum, indikator_sesudah)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        scenario.id_scenario,
        skorSebelum,
        skorSesudah,
        JSON.stringify({ daya_tampung: 500, rasio_guru: 15.2 }),
        JSON.stringify({ daya_tampung: 500 + perubahan_kapasitas, rasio_guru: 18.0 }),
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Skenario simulasi berhasil dibuat dan dihitung.',
      scenario,
      hasil_simulasi: hasilResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getScenarios,
  createScenario,
};
