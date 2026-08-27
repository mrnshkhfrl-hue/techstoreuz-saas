import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  const shop = await prisma.shop.findUnique({
    where: { tgBotToken: token },
  });

  if (!shop) {
    return new NextResponse('Shop not found', { status: 404 });
  }

  const body = await req.json();
  const message = body.message;
  const chatId = message?.chat?.id;
  const text = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  if (text === '/start') {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Добро пожаловать в магазин ${shop.name}!`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Открыть каталог', callback_data: 'open_catalog' }],
          ],
        },
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
