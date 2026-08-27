const https = require('https');
require('dotenv').config();

const rawToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_WEBAPP_URL || process.env.WEBAPP_URL;

if (!rawToken) {
  console.error("❌ Error: TELEGRAM_BOT_TOKEN is not set in .env");
  process.exit(1);
}

const token = rawToken.replace(/^["']|["']$/g, '').trim();

if (!rawAppUrl) {
  console.error("❌ Error: NEXT_PUBLIC_APP_URL is not set in .env");
  console.log("ℹ️ Example: NEXT_PUBLIC_APP_URL=\"https://your-vercel-domain.vercel.app\"");
  process.exit(1);
}

const appUrl = rawAppUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();

// Supports /api/webhook/telegram or /api/webhook/${token}
const webhookUrl = `${appUrl}/api/webhook/telegram`;

const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

console.log(`📡 Setting Telegram Webhook to: ${webhookUrl}`);

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.ok) {
        console.log('✅ Webhook successfully registered in Telegram!');
        console.log(`ℹ️ Response: ${json.description || 'OK'}`);
        console.log(`🔗 Webhook URL: ${webhookUrl}`);
      } else {
        console.error('❌ Telegram API error:');
        console.error(json);
      }
    } catch (e) {
      console.error('❌ Could not parse Telegram response:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Network error setting webhook:', err.message);
});
