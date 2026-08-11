const { execSync } = require('child_process');
const fs = require('fs');

console.log('Splitting APK...');
execSync('powershell -Command "Function Split-File { Param([string]$in, [int]$size, [string]$out); $i=0; $reader=[System.IO.File]::OpenRead($in); $buffer=New-Object byte[] $size; while(($read=$reader.Read($buffer,0,$size)) -gt 0){ $o=$out+$i+\'.part\'; $writer=[System.IO.File]::OpenWrite($o); $writer.Write($buffer,0,$read); $writer.Close(); $i++ }; $reader.Close() }; Split-File warkop-pos.apk 5000000 chunk_"', {stdio: 'inherit'});

const parts = fs.readdirSync('.').filter(f => f.startsWith('chunk_') && f.endsWith('.part'));
console.log(`Split into ${parts.length} parts. Uploading...`);

for (const part of parts) {
  console.log(`Uploading ${part}...`);
  execSync(`scp -o StrictHostKeyChecking=no ${part} root@202.155.157.13:/tmp/${part}`, {stdio: 'inherit'});
}

console.log('Combining on VPS...');
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cat /tmp/chunk_*.part > /tmp/warkop-pos.apk && rm /tmp/chunk_*.part"', {stdio: 'inherit'});

console.log('Copying to web directories...');
execSync('ssh -o StrictHostKeyChecking=no root@202.155.157.13 "cp /tmp/warkop-pos.apk /var/www/landing_page/warkop.apk && cp /tmp/warkop-pos.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"', {stdio: 'inherit'});

console.log('Cleanup local...');
parts.forEach(p => fs.unlinkSync(p));

console.log('Done!');
