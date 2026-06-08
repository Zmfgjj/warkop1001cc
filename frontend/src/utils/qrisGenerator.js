// Utility to convert Static QRIS to Dynamic QRIS by adding amount and recalculating CRC

// CRC16 CCITT FALSE calculation (EMVCo standard)
function calculateCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  let hex = (crc & 0xFFFF).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

export function generateDynamicQRIS(staticQRIS, amount) {
  if (!staticQRIS || typeof staticQRIS !== 'string') return '';
  if (!amount || amount <= 0) return staticQRIS;
  
  let baseQris = staticQRIS.trim();
  
  // Basic validation: A valid QRIS string must contain "6304" near the end before the 4-digit CRC.
  // We strip the existing 4-digit CRC.
  const qrisWithoutCRC = baseQris.slice(0, -4);
  if (!qrisWithoutCRC.endsWith('6304')) {
    return staticQRIS; // Invalid format, fallback to original
  }

  // 1. Change Point of Initiation Method from Static (010211) to Dynamic (010212)
  let qris = qrisWithoutCRC.replace('010211', '010212');

  // If the static QRIS already has an amount (Tag 54), we shouldn't just append. 
  // But static QRIS usually doesn't have tag 54.
  // 2. Add Amount (Tag 54)
  const strAmount = amount.toString();
  const lenAmount = strAmount.length.toString().padStart(2, '0');
  const amountTag = `54${lenAmount}${strAmount}`;

  // Insert tag 54 before tag 58 (Country Code 'ID')
  const idx58 = qris.indexOf('5802ID');
  if (idx58 !== -1) {
    qris = qris.slice(0, idx58) + amountTag + qris.slice(idx58);
  } else {
    // If tag 58 is missing for some reason, insert before 6304
    const idx6304 = qris.lastIndexOf('6304');
    qris = qris.slice(0, idx6304) + amountTag + qris.slice(idx6304);
  }

  // 3. Recalculate CRC
  // The string passed to CRC calculation must end with '6304'
  const newCRC = calculateCRC16(qris);
  return qris + newCRC;
}
