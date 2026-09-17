import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import './db.js';
import authRoutes from './routes/auth.js';
import appRoutes from './routes/apps.js';
import activityRoutes from './routes/activity.js';
import pqpRoutes from './routes/pqp.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// Static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/log-activity', activityRoutes);
app.use('/api/pqp', pqpRoutes);
app.use('/api/admin', adminRoutes);

// Admin page route
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Urgent Design Hub running on port ${PORT}`);
});
