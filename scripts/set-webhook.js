const https = require('https');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.WEBAPP_URL;

if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set in .env");
  process.exit(1);
}

if (!appUrl) {
  console.error("Error: NEXT_PUBLIC_APP_URL is not set in .env");
  process.exit(1);
}

const webhookUrl = `${appUrl}/api/webhook/telegram`;

const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

console.log(`Setting webhook to: ${webhookUrl}`);

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const json = JSON.parse(data);
    if (json.ok) {
      console.log('✅ Webhook successfully set!');
      console.log(json.description);
    } else {
      console.error('❌ Failed to set webhook:');
      console.error(json);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error setting webhook:', err.message);
});
