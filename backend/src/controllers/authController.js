import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { sendOtpEmail } from '../config/email.js';

const OTP_TTL_MINUTES = 10;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email.toLowerCase(), code, expiresAt]
    );

    await sendOtpEmail(email, code);

    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('requestOtp error', err);
    res.status(500).json({ message: 'Could not send OTP' });
  }
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM otp_codes
       WHERE email = $1 AND code = $2 AND consumed = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await pool.query('UPDATE otp_codes SET consumed = TRUE WHERE id = $1', [rows[0].id]);

    // Find or create user
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    let user;
    if (userResult.rows.length === 0) {
      const insertResult = await pool.query(
        'INSERT INTO users (email) VALUES ($1) RETURNING *',
        [email.toLowerCase()]
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('verifyOtp error', err);
    res.status(500).json({ message: 'Could not verify OTP' });
  }
}

export async function getMe(req, res) {
  try {
    const { rows } = await pool.query('SELECT id, email, name, phone FROM users WHERE id = $1', [
      req.userId,
    ]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('getMe error', err);
    res.status(500).json({ message: 'Server error' });
  }
}
