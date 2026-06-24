// Simple utility to hash string locally to avoid storing plain text
export async function hashPasswordLocal(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'warkop1001cc_salt_offline');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
