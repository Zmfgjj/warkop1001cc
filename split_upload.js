const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const filePath = 'warkop-pos.apk';
const chunkSize = 5 * 1024 * 1024; // 5MB chunks
const buffer = fs.readFileSync(filePath);
const totalChunks = Math.ceil(buffer.length / chunkSize);

for (let i = 0; i < totalChunks; i++) {
    const chunkPath = `chunk_${i}.part`;
    const chunk = buffer.slice(i * chunkSize, (i + 1) * chunkSize);
    fs.writeFileSync(chunkPath, chunk);
    console.log(`Uploading ${chunkPath} (${i+1}/${totalChunks})...`);
    execSync(`scp -o StrictHostKeyChecking=no ${chunkPath} root@202.155.157.13:/root/${chunkPath}`, {stdio: 'inherit'});
    fs.unlinkSync(chunkPath);
}

console.log('Reassembling on server...');
let concatCommand = `ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cat `;
for (let i = 0; i < totalChunks; i++) {
    concatCommand += `/root/chunk_${i}.part `;
}
concatCommand += `> /root/warkop.apk && rm /root/chunk_*.part && cp /root/warkop.apk /var/www/landing_page/warkop.apk && cp /root/warkop.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"`;

execSync(concatCommand, {stdio: 'inherit'});
console.log('✅ Done!');
