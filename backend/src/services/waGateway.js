const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

let sock = null;
let qrCodeData = null;
let status = 'DISCONNECTED'; // 'DISCONNECTED', 'QR_READY', 'CONNECTED', 'STOPPED', 'STARTING'
let socketIo = null;
const AUTH_DIR = path.join(__dirname, '../../wa_auth_info');

const setSocketIo = (io) => { socketIo = io; };

const initializeGateway = () => { status = 'STOPPED'; };

const startService = async (phoneNumber) => {
  if (status !== 'STOPPED' && status !== 'DISCONNECTED') return;
  status = 'STARTING';
  if (socketIo) socketIo.emit('wa_status', { status, qr: null });

  try {
    const { Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Desktop'),
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    sock.ev.on('creds.update', saveCreds);

    if (phoneNumber && !sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phoneNumber);
          qrCodeData = code;
          status = 'QR_READY';
          if (socketIo) socketIo.emit('wa_status', { status, qr: qrCodeData });
        } catch (e) {
          console.error('Gagal meminta kode tautan:', e);
        }
      }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Only process QR if no phone number was provided (fallback to old behavior)
      if (qr && !phoneNumber) {
        qrcode.toDataURL(qr, (err, url) => {
          if (!err) {
            qrCodeData = url;
            status = 'QR_READY';
            if (socketIo) socketIo.emit('wa_status', { status, qr: qrCodeData });
          }
        });
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`WhatsApp connection closed. Reason: ${lastDisconnect.error?.message || statusCode}`);
        
        // Wajib hapus sesi JIKA logout ATAU jika putus SEBELUM terkoneksi penuh (mencegah sesi nyangkut/corrupt)
        if (!shouldReconnect || status !== 'CONNECTED') {
          console.log('WhatsApp logged out or failed during pairing. Wiping session to prevent corruption.');
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
        }
        
        status = 'STOPPED';
        qrCodeData = null;
        if (socketIo) socketIo.emit('wa_status', { status, qr: null });
        
        // Clean up socket to prevent zombies
        if (sock) {
          try {
            if (sock.ws) sock.ws.close();
            else sock.end(undefined);
          } catch(e) {}
        }

      } else if (connection === 'open') {
        console.log('WhatsApp Gateway is Ready (Baileys Engine)!');
        status = 'CONNECTED';
        qrCodeData = null;
        if (socketIo) socketIo.emit('wa_status', { status, qr: null });
      }
    });

  } catch (err) {
    console.error('Failed to initialize WhatsApp Gateway', err);
    status = 'STOPPED';
    if (socketIo) socketIo.emit('wa_status', { status, qr: null });
  }
};

const stopService = async () => {
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      if (sock.ws) sock.ws.close();
      else sock.end(undefined);
    } catch (e) {}
  }
  sock = null;
  qrCodeData = null;
  status = 'STOPPED';
  console.log('WhatsApp Gateway Stopped to save RAM');
  if (socketIo) socketIo.emit('wa_status', { status, qr: null });
};

const getStatus = () => {
  return { status, qr: qrCodeData };
};

const logout = async () => {
  if (sock) {
    try {
      await sock.logout();
    } catch (err) {
      console.error(err);
    }
  }
  status = 'DISCONNECTED';
  qrCodeData = null;
  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
  stopService();
};

const sendBroadcastMessage = async (targets, messageTemplate) => {
  if (status !== 'CONNECTED' || !sock) {
    throw new Error('WhatsApp Gateway belum terkoneksi');
  }

  let successCount = 0;
  for (const target of targets) {
    try {
      const phone = target.phone;
      const name = target.name || '';
      const message = messageTemplate.replace(/\[Nama\]/gi, name);
      
      // format for Baileys: 628xxx@s.whatsapp.net
      let jid = phone;
      if (jid.includes('@c.us')) {
        jid = jid.replace('@c.us', '@s.whatsapp.net');
      } else if (!jid.includes('@s.whatsapp.net')) {
        jid = `${jid}@s.whatsapp.net`;
      }

      await sock.sendMessage(jid, { text: message });
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
