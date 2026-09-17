import db from '../db.js';

export function logChange(adminId, actionType, tableAffected) {
  db.prepare('INSERT INTO changelog (admin_id, action_type, table_affected) VALUES (?, ?, ?)')
    .run(adminId ?? null, actionType, tableAffected);
}
