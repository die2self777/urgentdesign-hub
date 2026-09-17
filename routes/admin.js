import express from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

// All users
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, class_name, student_name, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// All activity records
router.get('/activity', (req, res) => {
  const activity = db.prepare('SELECT * FROM student_activity ORDER BY timestamp DESC LIMIT 500').all();
  res.json(activity);
});

// PQP submissions + feedback
router.get('/pqp', (req, res) => {
  const submissions = db.prepare('SELECT * FROM pqp_submissions ORDER BY timestamp DESC').all();
  const feedback = db.prepare('SELECT * FROM pqp_feedback ORDER BY timestamp DESC').all();
  res.json({ submissions, feedback });
});

// Changelog
router.get('/changelog', (req, res) => {
  const changelog = db.prepare('SELECT * FROM changelog ORDER BY timestamp DESC LIMIT 500').all();
  res.json(changelog);
});

export default router;
