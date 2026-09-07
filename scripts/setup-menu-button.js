const https = require('https');
require('dotenv').config();

const token = (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').replace(/^["']|["']$/g, '').trim();
const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_WEBAPP_URL || process.env.WEBAPP_URL || 'https://techstoreuz.vercel.app').replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();

if (!token) {
  console.error("Missing token");
  process.exit(1);
}

const payload = JSON.stringify({
  menu_button: {
    type: "web_app",
    text: "🛍 Магазин",
    web_app: {
      url: rawAppUrl
    }
  }
});

const req = https.request(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("setChatMenuButton response:", data);
  });
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
