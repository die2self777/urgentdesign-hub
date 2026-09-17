import crypto from 'crypto';
import db from '../db.js';

const adminSessions = new Set();

export function createAdminSession() {
  const token = crypto.randomUUID();
  adminSessions.add(token);
  return token;
}

export function destroyAdminSession(token) {
  adminSessions.delete(token);
}

export function isValidAdminSession(token) {
  return !!token && adminSessions.has(token);
}

export function requireSession(req, res, next) {
  const token = req.cookies.session_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const user = db.prepare('SELECT id, class_name, student_name, role FROM users WHERE session_token = ?').get(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (!isValidAdminSession(token)) {
    return res.status(401).json({ error: 'Admin not authenticated' });
  }
  next();
}
