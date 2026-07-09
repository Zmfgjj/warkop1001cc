const db = require('../config/database');

/**
 * Log an action to the database activity_logs table
 * @param {object|null} reqOrUser - Express req object or user object from token
 * @param {string} actionType - 'INSERT', 'UPDATE', 'DELETE', 'SYSTEM', 'RESTORE'
 * @param {string} tableName - Target table name
 * @param {string} description - Human-readable description
 * @param {object|null} backupData - Optional JSON data for rollback/recovery
 */
async function logAction(reqOrUser, actionType, tableName, description, backupData = null) {
  try {
    let userId = null;
    let username = 'SYSTEM';
    
    if (reqOrUser) {
      if (reqOrUser.user) {
        userId = reqOrUser.user.id;
        username = reqOrUser.user.username || reqOrUser.user.nama || 'USER';
      } else if (reqOrUser.id) {
        userId = reqOrUser.id;
        username = reqOrUser.username || reqOrUser.nama || 'USER';
      }
    }

    const backupStr = backupData ? JSON.stringify(backupData) : null;

    await db.query(
      `INSERT INTO activity_logs (user_id, username, action_type, table_name, description, backup_data) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, actionType, tableName, description, backupStr]
    );
  } catch (err) {
    console.error('❌ Gagal menulis activity log:', err.message);
  }
}

module.exports = { logAction };
