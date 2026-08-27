const axios = require('axios');

async function test() {
  try {
    const url = 'https://ashirwad-ims-api.vercel.app/api/auth/login';
    console.log('Testing login against production:', url);
    const res = await axios.post(url, {
      email: 'admin@ashirwad.com',
      password: 'admin123'
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('FAILED:', err.response ? err.response.status : err.message);
    if (err.response) {
      console.log('Error Data:', err.response.data);
    }
  }
}

test();
