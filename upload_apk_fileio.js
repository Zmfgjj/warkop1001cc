const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const apkPath = 'warkop-pos.apk';

async function uploadFileIO(filePath) {
    return new Promise((resolve, reject) => {
        const formData = require('form-data');
        const form = new formData();
        form.append('file', fs.createReadStream(filePath));

        const req = https.request({
            hostname: 'file.io',
            path: '/?expires=1d',
            method: 'POST',
            headers: form.getHeaders()
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.link);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        form.pipe(req);
    });
}

async function run() {
    try {
        console.log('Uploading to file.io...');
        const fileIoLink = await uploadFileIO(apkPath);
        console.log('File uploaded to:', fileIoLink);

        console.log('Downloading on VPS...');
        execSync(`ssh -o StrictHostKeyChecking=no root@202.155.157.13 "curl -L ${fileIoLink} -o /tmp/warkop-pos.apk && cp /tmp/warkop-pos.apk /var/www/landing_page/warkop.apk && cp /tmp/warkop-pos.apk /var/www/frontend/warkop.apk && chmod 644 /var/www/landing_page/warkop.apk /var/www/frontend/warkop.apk"`, { stdio: 'inherit' });
        
        console.log('Success!');
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
