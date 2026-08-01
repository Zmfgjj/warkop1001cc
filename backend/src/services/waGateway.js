const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client;
let qrCodeData = null;
let status = 'DISCONNECTED'; // 'DISCONNECTED', 'QR_READY', 'CONNECTED', 'STOPPED', 'STARTING'
let socketIo = null;

const setSocketIo = (io) => {
  socketIo = io;
};

const initializeGateway = () => {
  // Do nothing on boot, wait for manual start
  status = 'STOPPED';
};

const startService = () => {
  if (status !== 'STOPPED' && status !== 'DISCONNECTED') return;
  status = 'STARTING';
  if (socketIo) socketIo.emit('wa_status', { status, qr: null });

  try {
    // Cari path Chrome: dari env variable, atau dari cache Puppeteer
    const fs = require('fs');
    const path = require('path');
    const chromeCachePath = path.join(process.env.HOME || '/root', '.cache/puppeteer/chrome');
    let executablePath;
    
    if (fs.existsSync(chromeCachePath)) {
      const versions = fs.readdirSync(chromeCachePath).filter(d => d.startsWith('linux-'));
      if (versions.length > 0) {
        const candidate = path.join(chromeCachePath, versions[0], 'chrome-linux64', 'chrome');
        if (fs.existsSync(candidate)) executablePath = candidate;
      }
    }

    client = new Client({
      authStrategy: new LocalAuth({ clientId: "warkop-crm" }),
      puppeteer: {
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    client.on('qr', (qr) => {
      console.log('WhatsApp Gateway QR Code Generated!');
      qrcode.toDataURL(qr, (err, url) => {
        if (!err) {
          qrCodeData = url;
          status = 'QR_READY';
          if (socketIo) socketIo.emit('wa_status', { status, qr: qrCodeData });
        }
      });
    });

    client.on('ready', () => {
      console.log('WhatsApp Gateway is Ready!');
      status = 'CONNECTED';
      qrCodeData = null;
      if (socketIo) socketIo.emit('wa_status', { status, qr: null });
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp Gateway Disconnected', reason);
      status = 'DISCONNECTED';
      if (socketIo) socketIo.emit('wa_status', { status, qr: null });
    });

    // Initialize async - wrap dengan catch agar Puppeteer crash
    // TIDAK membunuh seluruh backend / menyebabkan PM2 restart
    (async () => {
      try {
        await client.initialize();
      } catch (err) {
        console.error('[WA Gateway] Puppeteer initialize error (ditangani, backend tetap jalan):', err.message);
        status = 'STOPPED';
        if (socketIo) socketIo.emit('wa_status', { status, qr: null });
      }
    })();

  } catch (err) {
    console.error('Failed to initialize WhatsApp Gateway', err);
    status = 'STOPPED';
    if (socketIo) socketIo.emit('wa_status', { status, qr: null });
  }
};

const stopService = async () => {
  if (client) {
    await client.destroy().catch(err => {
      console.error('Ignored error during WA client destroy:', err.message);
    });
  }
  client = null;
  qrCodeData = null;
  status = 'STOPPED';
  console.log('WhatsApp Gateway Stopped to save RAM');
  if (socketIo) socketIo.emit('wa_status', { status, qr: null });
};

const getStatus = () => {
  return { status, qr: qrCodeData };
};

const logout = async () => {
  if (client) {
    try {
      await client.logout();
    } catch (err) {
      console.error(err);
    }
    status = 'DISCONNECTED';
    qrCodeData = null;
    stopService();
  }
};

const sendBroadcastMessage = async (targets, messageTemplate) => {
  if (status !== 'CONNECTED') {
    throw new Error('WhatsApp Gateway belum terkoneksi');
  }

  let successCount = 0;
  for (const target of targets) {
    try {
      const phone = target.phone;
      const name = target.name || '';
      const message = messageTemplate.replace(/\[Nama\]/gi, name);
      const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      await client.sendMessage(formattedPhone, message);
      successCount++;
      const delay = Math.floor(Math.random() * (8000 - 4000 + 1)) + 4000;
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (err) {
      console.error(`Failed to send to ${target.phone}`, err);
    }
  }
  return successCount;
};

module.exports = {
  setSocketIo,
  initializeGateway,
  startService,
  stopService,
  getStatus,
  logout,
  sendBroadcastMessage
};
