import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, botToken, botUsername } = body;

    const updated = await prisma.shop.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(botToken ? { tgBotToken: botToken.trim() } : {}),
        ...(botUsername !== undefined
          ? { tgLink: botUsername ? `https://t.me/${botUsername.replace(/^@/, "")}` : null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, shop: updated });
  } catch (error: any) {
    console.error("[SuperAdminShop PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.shop.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[SuperAdminShop DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
