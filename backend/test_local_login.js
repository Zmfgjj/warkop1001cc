async function testLogin() {
  try {
    console.log('Sending login request to http://localhost:3000/api/auth/login...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'owner',
        password: 'password'
      })
    });
    
    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('✅ Response Data:', data);
  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

testLogin();
