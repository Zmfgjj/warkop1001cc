const db = require('./backend/src/config/database');

async function run() {
  try {
    const updates = [
      { no_hp: '089512411988', point: 2250 },
      { no_hp: '085772227311', point: 1270 },
      { no_hp: '085183100596', point: 900 },
      { no_hp: '089673745628', point: 220 }
    ];

    for (let u of updates) {
      const [res] = await db.query('UPDATE members SET point = ? WHERE no_hp = ?', [u.point, u.no_hp]);
      console.log(`Updated no_hp ${u.no_hp} point to ${u.point}, matched: ${res.affectedRows}`);
    }

    // Isti and Yunus to 0
    const [resIsti] = await db.query('UPDATE members SET point = 0 WHERE nama LIKE ?', ['%isti%']);
    console.log(`Updated Isti point to 0, matched: ${resIsti.affectedRows}`);

    const [resYunus] = await db.query('UPDATE members SET point = 0 WHERE nama LIKE ?', ['%yunus%']);
    console.log(`Updated Yunus point to 0, matched: ${resYunus.affectedRows}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
