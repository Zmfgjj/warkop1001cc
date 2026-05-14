const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/KasirPOS2.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*<\/div>/,
  `</div>
        )}
      </div>`
);

fs.writeFileSync(file, content);
console.log('Fixed syntax error');
