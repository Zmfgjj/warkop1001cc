const fs = require('fs');
const path = require('path');
const sharp = require('./backend/node_modules/sharp');

const dir = path.join(__dirname, 'backend/public/uploads');

async function processImages() {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
      const filePath = path.join(dir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 200 * 1024) {
          const buffer = await sharp(filePath)
            .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 75 })
            .toBuffer();
          fs.writeFileSync(filePath, buffer);
          console.log(`Resized ${file}: ${stats.size} -> ${buffer.length} bytes`);
        }
      } catch (err) {
        console.error(`Error resizing ${file}:`, err.message);
      }
    }
  }
}

processImages();
