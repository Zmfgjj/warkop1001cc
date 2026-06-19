const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client;
let qrCodeData = null;
let status = 'DISCONNECTED'; // 'DISCONNECTED', 'QR_READY', 'CONNECTED'
let socketIo = null;

const setSocketIo = (io) => {
  socketIo = io;
};

const initializeGateway = () => {
  try {
    client = new Client({
      authStrategy: new LocalAuth({ clientId: "warkop-crm" }),
      puppeteer: {
        headless: true,
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
      // Generate QR Base64
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

    client.initialize();
  } catch (err) {
    console.error('Failed to initialize WhatsApp Gateway', err);
  }
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
    client.initialize();
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

      // Ensure number ends with @c.us
      const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      await client.sendMessage(formattedPhone, message);
      successCount++;
      // Wait 3 seconds to avoid ban
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      console.error(`Failed to send to ${phone}`, err);
    }
  }
  return successCount;
};

module.exports = {
  initializeGateway,
  setSocketIo,
  getStatus,
  logout,
  sendBroadcastMessage
};
