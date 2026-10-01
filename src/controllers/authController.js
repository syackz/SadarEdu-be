const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
const register = async (req, res, next) => {
  try {
    const { nama, email, password, id_role } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    // Check if email already exists
    const existing = await db.query('SELECT id_user FROM user_account WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const roleId = id_role || null; // Optional role

    const result = await db.query(
      `INSERT INTO user_account (nama, email, password_hash, id_role)
       VALUES ($1, $2, $3, $4)
       RETURNING id_user, nama, email, id_role, status_aktif, created_at`,
      [nama, email, password_hash, roleId]
    );

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Login User
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const userQuery = await db.query(
      `SELECT u.*, r.nama_role 
       FROM user_account u 
       LEFT JOIN role r ON u.id_role = r.id_role 
       WHERE u.email = $1`,
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const user = userQuery.rows[0];

    if (!user.status_aktif) {
      return res.status(403).json({ success: false, message: 'Akun Anda tidak aktif.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { id_user: user.id_user, email: user.email, role: user.nama_role },
      process.env.JWT_SECRET || 'super_secret_sadaredu_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id_user: user.id_user,
        nama: user.nama,
        email: user.email,
        role: user.nama_role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Current Profile
const getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id_user, u.nama, u.email, u.status_aktif, r.nama_role, u.created_at
       FROM user_account u
       LEFT JOIN role r ON u.id_role = r.id_role
       WHERE u.id_user = $1`,
      [req.user.id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
