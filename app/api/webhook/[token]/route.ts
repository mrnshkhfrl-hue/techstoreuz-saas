import { handleTelegramWebhook } from '@/lib/webhook-handler';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  const resolvedParams = await params;
  return handleTelegramWebhook(req, resolvedParams.token);
}

export async function GET() {
  return new Response('Telegram Webhook [token] Endpoint Active', { status: 200 });
}
