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
    let ip = null;
    let userAgent = null;
    
    if (reqOrUser) {
      if (reqOrUser.user) {
        // reqOrUser is an express request object
        userId = reqOrUser.user.id;
        username = reqOrUser.user.username || reqOrUser.user.nama || 'USER';
        ip = reqOrUser.ip || reqOrUser.connection?.remoteAddress || null;
        userAgent = reqOrUser.headers ? reqOrUser.headers['user-agent'] : null;
      } else if (reqOrUser.id) {
        // reqOrUser is just a user object
        userId = reqOrUser.id;
        username = reqOrUser.username || reqOrUser.nama || 'USER';
      }
    }

    const backupStr = backupData ? JSON.stringify(backupData) : null;

    await db.query(
      `INSERT INTO activity_logs (user_id, username, action_type, table_name, description, backup_data, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, actionType, tableName, description, backupStr, ip, userAgent]
    );
  } catch (err) {
    console.error('❌ Gagal menulis activity log:', err.message);
  }
}

module.exports = { logAction };
