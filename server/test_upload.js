const { uploadToGoogleDrive } = require('./src/utils/googleDrive');
require('dotenv').config();

async function test() {
  const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const url = await uploadToGoogleDrive(buf, 'test.png', 'image/png', 'TestFolder');
  console.log("URL:", url);
}
test();
