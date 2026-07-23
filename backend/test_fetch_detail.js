async function testFetch() {
  try {
    const url = 'https://16212975a2c08c.lhr.life/api/menu';
    console.log('Fetching', url);
    const res = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true'
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Text (first 200 chars):', text.substring(0, 200));
  } catch (err) {
    console.error('Error detail:', err);
  }
}

testFetch();
