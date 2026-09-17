import express from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { createAdminSession, destroyAdminSession, isValidAdminSession } from '../middleware/auth.js';

const router = express.Router();

// Student login — verify or auto-create, set session cookie
router.post('/login', (req, res) => {
  const { class_name, student_name } = req.body;
  if (!class_name || !student_name) {
    return res.status(400).json({ error: 'Class and name are required' });
  }

  let user = db.prepare('SELECT * FROM users WHERE class_name = ? AND student_name = ?').get(class_name, student_name);
  const token = crypto.randomUUID();

  if (!user) {
    db.prepare('INSERT INTO users (class_name, student_name, role, session_token) VALUES (?, ?, ?, ?)')
      .run(class_name, student_name, 'student', token);
    user = db.prepare('SELECT * FROM users WHERE class_name = ? AND student_name = ?').get(class_name, student_name);
  } else {
    db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(token, user.id);
    user.session_token = token;
  }

  res.cookie('session_token', user.session_token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ id: user.id, class_name: user.class_name, student_name: user.student_name, role: user.role });
});

// Check student session
router.get('/session', (req, res) => {
  const token = req.cookies.session_token;
  if (!token) return res.json({ authenticated: false });

  const user = db.prepare('SELECT id, class_name, student_name, role FROM users WHERE session_token = ?').get(token);
  if (!user) return res.json({ authenticated: false });

  res.json({ authenticated: true, user });
});

// Student logout
router.post('/logout', (req, res) => {
  res.clearCookie('session_token');
  res.json({ success: true });
});

// Admin login — password gate
router.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = createAdminSession();
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({ success: true });
});

// Check admin session
router.get('/admin-session', (req, res) => {
  const token = req.cookies.admin_token;
  res.json({ authenticated: isValidAdminSession(token) });
});

// Admin logout
router.post('/admin-logout', (req, res) => {
  const token = req.cookies.admin_token;
  if (token) destroyAdminSession(token);
  res.clearCookie('admin_token');
  res.json({ success: true });
});

export default router;
