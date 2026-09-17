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

// Submit writing
router.post('/submit', (req, res) => {
  const { author_id, class_name, student_name, title, content } = req.body;

  if (!content) return res.status(400).json({ error: 'content is required' });

  const result = db.prepare(`
    INSERT INTO pqp_submissions (author_id, class_name, student_name, title, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(author_id || null, class_name || '', student_name || '', title || '', content);

  res.json({ id: result.lastInsertRowid, success: true });
});

// Submit PQP feedback
router.post('/feedback', (req, res) => {
  const { author_id, target_submission_id, praise_text, question_text, polish_text } = req.body;

  if (!target_submission_id) return res.status(400).json({ error: 'target_submission_id is required' });

  const result = db.prepare(`
    INSERT INTO pqp_feedback (author_id, target_submission_id, praise_text, question_text, polish_text)
    VALUES (?, ?, ?, ?, ?)
  `).run(author_id || null, target_submission_id, praise_text || '', question_text || '', polish_text || '');

  res.json({ id: result.lastInsertRowid, success: true });
});

export default router;
