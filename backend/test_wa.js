const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('Starting whatsapp-web.js client...');
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "test-wa" }),
    puppeteer: {
        headless: false, // Set to false to see if chromium opens and what error happens
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    },
    // We try without webVersionCache first, or maybe with a different one
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    process.exit(0);
});

client.on('ready', () => {
    console.log('Client is ready!');
    process.exit(0);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    process.exit(1);
});

client.initialize().catch(err => {
    console.error('Initialization error:', err);
    process.exit(1);
});
