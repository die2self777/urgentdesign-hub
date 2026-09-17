import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const dataDir = './data';
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'hub.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    student_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    session_token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(class_name, student_name)
  );

  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    icon TEXT DEFAULT 'app-window',
    status TEXT DEFAULT 'wip',
    tags TEXT,
    featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS student_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    student_name TEXT NOT NULL,
    source_app_url TEXT,
    activity_details TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pqp_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER,
    class_name TEXT,
    student_name TEXT,
    title TEXT,
    content TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pqp_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER,
    target_submission_id INTEGER NOT NULL,
    praise_text TEXT,
    question_text TEXT,
    polish_text TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS changelog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action_type TEXT NOT NULL,
    table_affected TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed apps from apps.json if table is empty
const count = db.prepare('SELECT COUNT(*) as c FROM apps').get();
if (count.c === 0) {
  const apps = JSON.parse(readFileSync('./apps.json', 'utf-8'));
  const insert = db.prepare(`
    INSERT INTO apps (category, title, description, url, icon, status, tags, featured, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  for (const app of apps) {
    insert.run(
      app.category || 'General',
      app.name,
      app.description || '',
      app.url || '',
      app.icon || 'app-window',
      app.status || 'wip',
      (app.tags || []).join(', '),
      app.featured ? 1 : 0
    );
  }
  console.log(`Seeded ${apps.length} apps from apps.json`);
}

export default db;
