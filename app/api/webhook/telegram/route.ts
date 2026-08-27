import { handleTelegramWebhook } from '@/lib/webhook-handler';

export async function POST(req: Request) {
  return handleTelegramWebhook(req);
}

export async function GET() {
  return new Response('Telegram Webhook Route Active', { status: 200 });
}
