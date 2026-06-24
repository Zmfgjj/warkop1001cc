require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/src/config/database');

const ALL_MODULES = ['dashboard', 'pos', 'manajemen_menu', 'manajemen_promo', 'manajemen_meja', 'kds', 'laporan', 'user_manage', 'bonus_karyawan', 'crm', 'manajemen_stock'];

async function updateRoles() {
  const [roles] = await db.query('SELECT * FROM roles');
  
  for (const role of roles) {
    let perms;
    try {
      perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
    } catch (e) {
      perms = {};
    }
    
    ALL_MODULES.forEach(mod => {
      if (!perms[mod]) {
        if (role.name === 'owner' || role.name === 'admin') {
          perms[mod] = { view: true, edit: true };
        } else if (role.name === 'investor') {
          perms[mod] = { view: true, edit: false };
        } else {
          perms[mod] = { view: false, edit: false };
        }
      }
    });

    await db.query('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(perms), role.id]);
    console.log(`Updated role: ${role.name}`);
  }
  console.log('Done');
  process.exit(0);
}

updateRoles();
