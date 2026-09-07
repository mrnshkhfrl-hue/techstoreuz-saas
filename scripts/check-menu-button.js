const https = require('https');
require('dotenv').config();

const token = (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '').replace(/^["']|["']$/g, '').trim();

if (!token) {
  console.error("Missing token");
  process.exit(1);
}

https.get(`https://api.telegram.org/bot${token}/getChatMenuButton`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Current Menu Button:", data);
  });
});
