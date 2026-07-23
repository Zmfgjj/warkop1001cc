async function testLocal() {
  try {
    console.log('Fetching menus locally...');
    const res = await fetch('http://127.0.0.1:3000/api/menu');
    console.log('Local Response Status:', res.status);
    const data = await res.json();
    console.log('Local data count:', Array.isArray(data) ? data.length : typeof data);
  } catch (err) {
    console.error('Local Fetch error:', err.message);
  }
}

testLocal();
