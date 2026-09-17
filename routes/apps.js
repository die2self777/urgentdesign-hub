import express from 'express';
import db from '../db.js';
import { requireSession, requireAdmin } from '../middleware/auth.js';
import { logChange } from '../middleware/changelog.js';

const router = express.Router();

// Get all active apps (requires student session)
router.get('/', requireSession, (req, res) => {
  const apps = db.prepare('SELECT * FROM apps WHERE is_active = 1 ORDER BY category, title').all();
  res.json(apps);
});

// Get all apps including inactive (admin only)
router.get('/all', requireAdmin, (req, res) => {
  const apps = db.prepare('SELECT * FROM apps ORDER BY category, title').all();
  res.json(apps);
});

// Create app (admin)
router.post('/', requireAdmin, (req, res) => {
  const { category, title, description, url, icon, status, tags, featured } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });

  const result = db.prepare(`
    INSERT INTO apps (category, title, description, url, icon, status, tags, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category || 'General', title, description || '', url, icon || 'app-window', status || 'wip', tags || '', featured ? 1 : 0);

  logChange(null, 'create', 'apps');
  res.json({ id: result.lastInsertRowid, success: true });
});

// Update app (admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { category, title, description, url, icon, status, tags, featured, is_active } = req.body;
  db.prepare(`
    UPDATE apps SET category=?, title=?, description=?, url=?, icon=?, status=?, tags=?, featured=?, is_active=?
    WHERE id=?
  `).run(category, title, description, url, icon, status, tags, featured ? 1 : 0, is_active ? 1 : 0, req.params.id);

  logChange(null, 'update', 'apps');
  res.json({ success: true });
});

// Toggle active (admin)
router.patch('/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE apps SET is_active = NOT is_active WHERE id = ?').run(req.params.id);
  logChange(null, 'toggle', 'apps');
  res.json({ success: true });
});

// Delete app (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM apps WHERE id = ?').run(req.params.id);
  logChange(null, 'delete', 'apps');
  res.json({ success: true });
});

export default router;
