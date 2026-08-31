const puppeteer = require('puppeteer-core');

async function run() {
  const browser = await puppeteer.connect({ browserWSEndpoint: 'wss://chrome.browserless.io?token=YOUR_TOKEN_HERE' }); // Wait, I don't have browserless. 
  // I will just use standard puppeteer if it's installed, or fetch the URL HTML to see if there is a server error.
}
run();
