import express from 'express';
import db from '../db.js';

const router = express.Router();

// Permissive CORS for external apps
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Receive activity from external apps
router.post('/', (req, res) => {
  const { class_name, student_name, source_app_url, activity_details } = req.body;

  if (!class_name || !student_name) {
    return res.status(400).json({ error: 'class_name and student_name are required' });
  }

  db.prepare(`
    INSERT INTO student_activity (class_name, student_name, source_app_url, activity_details)
    VALUES (?, ?, ?, ?)
  `).run(
    class_name,
    student_name,
    source_app_url || '',
    typeof activity_details === 'string' ? activity_details : JSON.stringify(activity_details || {})
  );

  res.json({ success: true });
});

export default router;
