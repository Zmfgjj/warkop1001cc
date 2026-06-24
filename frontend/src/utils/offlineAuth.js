// Simple utility to hash string locally to avoid storing plain text
// Pure JS SHA-256 implementation to work on insecure contexts (HTTP via IP address)
export async function hashPasswordLocal(password) {
  const ascii = password + 'warkop1001cc_salt_offline';
  
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isPrime = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isPrime[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * 0x100000000) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * 0x100000000) | 0;
    }
  }
  
  let tempAscii = ascii + '\x80';
  while (tempAscii[lengthProperty] % 64 - 56) {
    tempAscii += '\x00';
  }
  for (i = 0; i < tempAscii[lengthProperty]; i++) {
    j = tempAscii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength / mathPow(2, 32)) | 0);
  words[words[lengthProperty]] = (asciiLength | 0);
  
  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const temp2 = w[i - 7] + s0 + w[i - 16] + s1;
      
      const wI = w[i] = (i < 16) ? w[i] : (temp2 | 0);
      
      const s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[1] & hash[2]) ^ (hash[2] & hash[0]);
      const temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) + k[i] + wI;
      const t2 = s0_h + maj;
      
      hash = [(temp1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    let word = hash[i];
    if (word < 0) word += 0x100000000;
    result += word.toString(16).padStart(8, '0');
  }
  
  return result;
}

export async function saveOfflineCredentials(user, password) {
  const hash = await hashPasswordLocal(password);
  const data = {
    user,
    hash,
    savedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours valid
  };
  localStorage.setItem('offline_auth', JSON.stringify(data));
}

export async function verifyOfflineCredentials(username, password) {
  try {
    const dataStr = localStorage.getItem('offline_auth');
    if (!dataStr) return null;
    
    const data = JSON.parse(dataStr);
    if (!data || !data.user || !data.hash) return null;
    
    // Check expiration
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem('offline_auth');
      return null;
    }
    
    // Match username
    if (data.user.username !== username) return null;
    
    // Match password
    const hash = await hashPasswordLocal(password);
    if (hash === data.hash) {
      return data.user;
    }
    
    return null; // Incorrect password
  } catch (e) {
    return null;
  }
}

export function getOfflineUser() {
  try {
    const dataStr = localStorage.getItem('offline_auth');
    if (!dataStr) return null;
    const data = JSON.parse(dataStr);
    if (Date.now() > data.expiresAt) return null;
    return data.user;
  } catch (e) {
    return null;
  }
}

export function clearOfflineCredentials() {
  localStorage.removeItem('offline_auth');
}
