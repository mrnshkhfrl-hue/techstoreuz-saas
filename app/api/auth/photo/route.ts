import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json(
        { error: "telegramId is required" },
        { status: 400 }
      );
    }

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 500 }
      );
    }

    // 1. Get user profile photos via Telegram Bot API
    const photosRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${telegramId}&limit=1`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
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
    const bestPhoto = photoSizes[photoSizes.length - 1]; // Largest size

    // 2. Get file path
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${bestPhoto.file_id}`
    );

    if (!fileRes.ok) {
      return NextResponse.json({ photoUrl: null });
    }

    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return NextResponse.json({ photoUrl: null });
    }

    // 3. Construct the download URL
    const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;

    return NextResponse.json({ photoUrl });
  } catch (error: any) {
    console.error("[AuthPhoto] Error fetching Telegram photo:", error);
    return NextResponse.json({ photoUrl: null });
  }
}
