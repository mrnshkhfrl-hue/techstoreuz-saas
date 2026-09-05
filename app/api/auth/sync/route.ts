import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
      include: {
        bookings: {
          include: {
            usedProduct: true,
            variant: {
              include: {
                template: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        ownedShops: true,
        adminIn: true,
      },
    });

    // If user does not exist or has no phone registered, trigger Onboarding
    if (!user || !user.phone) {
      return NextResponse.json({
        exists: Boolean(user),
        needsPhone: true,
        user: null,
      });
    }

    return NextResponse.json({
      exists: true,
      needsPhone: false,
      user,
    });
  } catch (error: any) {
    console.error("[AuthSync] Error checking Telegram user:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, firstName, lastName, username, photoUrl, phone } = body;

    if (!telegramId) {
      return NextResponse.json(
        { error: "telegramId is required" },
        { status: 400 }
      );
    }

    const tgIdStr = String(telegramId);
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      (username ? `@${username}` : `Telegram User`);

    // Normalize phone number (handle +998, 9 digits, or raw international)
    let formattedPhone = phone ? String(phone).trim() : null;
    if (formattedPhone) {
      const digits = formattedPhone.replace(/\D/g, "");
      if (digits.length === 9) {
        formattedPhone = `+998${digits}`;
      } else if (digits.length === 12 && digits.startsWith("998")) {
        formattedPhone = `+${digits}`;
      } else if (digits.length > 0) {
        formattedPhone = formattedPhone.startsWith("+") ? formattedPhone : `+${digits}`;
      }
    }

    // Upsert user with phone in Prisma / Supabase
    const user = await prisma.user.upsert({
      where: { telegramId: tgIdStr },
      update: {
        name: fullName,
        ...(formattedPhone ? { phone: formattedPhone } : {}),
      },
      create: {
        telegramId: tgIdStr,
        name: fullName,
        phone: formattedPhone,
      },
      include: {
        bookings: {
          include: {
            usedProduct: true,
            variant: {
              include: {
                template: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        ownedShops: true,
        adminIn: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        photoUrl: photoUrl || null,
        username: username || null,
      },
    });
  } catch (error: any) {
    console.error("[AuthSync] Error registering Telegram user:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
