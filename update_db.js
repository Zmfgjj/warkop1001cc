const db = require('./src/config/database');

const newCategories = [
  "Signature",
  "Signature coffe bar",
  "Manual brew",
  "Signature mocktail",
  "Non coffe",
  "Tea series",
  "Yakult squash",
  "Creamy mocktail",
  "Others",
  "Main course",
  "Paket keluarga",
  "Snack",
  "Indomie series",
  "Add on",
  "Paket susu santai",
  "Paket kopi santai",
  "Paket santuy"
];

const manualMapping = {
  "paket": "Paket santuy",
  "lain-lain": "Others",
  "non coffee": "Non coffe",
  "signature coffee bar": "Signature coffe bar"
};

async function updateDB() {
  try {
    // 1. Get old categories
    const [oldCats] = await db.query('SELECT * FROM kategori');
    
    // 2. Insert new categories and get their IDs
    const newCatIds = {};
    for (let i = 0; i < newCategories.length; i++) {
      const name = newCategories[i];
      const res = await db.query('INSERT INTO kategori (nama, urutan) VALUES (?, ?)', [name, i + 1]);
      newCatIds[name.toLowerCase()] = res[0].insertId;
    }
    
    // 3. Update menus to point to new categories based on name matching
    const [menus] = await db.query('SELECT m.id, m.kategori_id, k.nama as old_cat_name FROM menu m LEFT JOIN kategori k ON m.kategori_id = k.id');
    
    let mappedCount = 0;
    let unmappedCount = 0;
    
    for (const menu of menus) {
      if (!menu.old_cat_name) continue;
      
      let oldNameLower = menu.old_cat_name.toLowerCase().trim();
      let newId = null;
      
      if (manualMapping[oldNameLower]) {
        newId = newCatIds[manualMapping[oldNameLower].toLowerCase()];
      } else {
        // direct match
        for (const newName of newCategories) {
          if (oldNameLower === newName.toLowerCase()) {
            newId = newCatIds[newName.toLowerCase()];
            break;
          }
        }
      }
      
      // If we found a match, update the menu's kategori_id
      if (newId) {
        await db.query('UPDATE menu SET kategori_id = ? WHERE id = ?', [newId, menu.id]);
        mappedCount++;
      } else {
        console.log('Unmapped:', menu.old_cat_name);
        unmappedCount++;
      }
    }
    
    console.log(`Mapped menus: ${mappedCount}, Unmapped: ${unmappedCount}`);
    
    // 4. Update HPP
    await db.query('UPDATE menu SET hpp = harga * 0.85');
    console.log('✅ HPP updated for all menus (harga * 0.85)');
    
    // 5. Delete old categories (only those not in the new IDs)
    const newIdsArray = Object.values(newCatIds);
    await db.query(`DELETE FROM kategori WHERE id NOT IN (${newIdsArray.join(',')})`);
    
    console.log('✅ Categories replaced and menus mapped successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDB();
