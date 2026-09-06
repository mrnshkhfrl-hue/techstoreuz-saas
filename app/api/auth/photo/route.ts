import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json(
        { error: "telegramId is required", photoUrl: null },
        { status: 400 }
      );
    }

    // First check if user already has a saved photoUrl in DB
    try {
      const dbUser = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
        select: { photoUrl: true },
      });
      if (dbUser?.photoUrl) {
        return NextResponse.json({ photoUrl: dbUser.photoUrl });
      }
    } catch {
      // Ignore DB lookup error and continue to Telegram API
    }

    // Resolve token: env -> shop in DB -> hardcoded fallback
    let token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    if (!token) {
      try {
        const shop = await prisma.shop.findFirst({ select: { tgBotToken: true } });
        token = shop?.tgBotToken || undefined;
      } catch {
        // ignore
      }
    }
    if (!token) {
      token = "8426826305:AAFOLp579bWZpwGZuYJyo1KDy36DM8WD3c8";
    }

    token = token.replace(/^["']|["']$/g, "").trim();

    // 1. Get user profile photos via Telegram Bot API
    const photosRes = await fetch(
      `https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${telegramId}&limit=1`,
      { next: { revalidate: 3600 } }
    );

    if (!photosRes.ok) {
      return NextResponse.json({ photoUrl: null });
    }

    const photosData = await photosRes.json();
    
    if (
      !photosData.ok ||
      !photosData.result?.photos?.length ||
      !photosData.result.photos[0]?.length
    ) {
      return NextResponse.json({ photoUrl: null });
    }

    // Get the largest photo (last in the array)
    const photoSizes = photosData.result.photos[0];
    const bestPhoto = photoSizes[photoSizes.length - 1];

    // 2. Get file path
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${bestPhoto.file_id}`
    );

    if (!fileRes.ok) {
      return NextResponse.json({ photoUrl: null });
    }

    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return NextResponse.json({ photoUrl: null });
    }

    // 3. Construct the download URL
    const photoUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;

    // Optionally persist in DB for fast future loading
    try {
      await prisma.user.updateMany({
        where: { telegramId: String(telegramId) },
        data: { photoUrl },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ photoUrl });
  } catch (error: any) {
    console.error("[AuthPhoto] Error fetching Telegram photo:", error);
    return NextResponse.json({ photoUrl: null });
  }
}
