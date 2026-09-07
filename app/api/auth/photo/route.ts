import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");
    const isRaw = searchParams.get("raw") === "1";

    if (!telegramId) {
      return NextResponse.json(
        { error: "telegramId is required", photoUrl: null },
        { status: 400 }
      );
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
      return isRaw ? new Response(null, { status: 404 }) : NextResponse.json({ photoUrl: null });
    }

    const photosData = await photosRes.json();
    
    if (
      !photosData.ok ||
      !photosData.result?.photos?.length ||
      !photosData.result.photos[0]?.length
    ) {
      return isRaw ? new Response(null, { status: 404 }) : NextResponse.json({ photoUrl: null });
    }

    // Get the largest photo
    const photoSizes = photosData.result.photos[0];
    const bestPhoto = photoSizes[photoSizes.length - 1];

    // 2. Get file path
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${bestPhoto.file_id}`
    );

    if (!fileRes.ok) {
      return isRaw ? new Response(null, { status: 404 }) : NextResponse.json({ photoUrl: null });
    }

    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return isRaw ? new Response(null, { status: 404 }) : NextResponse.json({ photoUrl: null });
    }

    const telegramFileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;

    // If raw image stream requested, proxy the binary data directly
    if (isRaw) {
      const imgRes = await fetch(telegramFileUrl);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        return new Response(buffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
      return new Response(null, { status: 404 });
    }

    // Persist proxy URL in DB
    const internalPhotoUrl = `/api/auth/photo?telegramId=${telegramId}&raw=1`;
    try {
      await prisma.user.updateMany({
        where: { telegramId: String(telegramId) },
        data: { photoUrl: internalPhotoUrl },
      });
    } catch {}

    return NextResponse.json({ photoUrl: internalPhotoUrl, directUrl: telegramFileUrl });
  } catch (error: any) {
    console.error("[AuthPhoto] Error fetching Telegram photo:", error);
    return NextResponse.json({ photoUrl: null });
  }
}
