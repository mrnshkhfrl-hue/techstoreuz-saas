import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInitData } from "@/lib/auth";

const SUPERADMIN_IDS = (
  process.env.SUPERADMIN_IDS ||
  process.env.NEXT_PUBLIC_SUPERADMIN_IDS ||
  "7949519588"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAuthorized(req: Request): boolean {
  const initData = req.headers.get("x-init-data");
  if (initData) {
    const user = validateInitData(initData);
    if (user && user.id && SUPERADMIN_IDS.includes(String(user.id))) {
      return true;
    }
  }

  const adminId = req.headers.get("x-admin-id") || req.headers.get("x-telegram-user-id");
  if (adminId && SUPERADMIN_IDS.includes(adminId.trim())) {
    return true;
  }

  const host = req.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return true;
  }

  return false;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Доступ запрещен. Требуются права супер-администратора." },
      { status: 403 }
    );
  }

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
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Доступ запрещен. Требуются права супер-администратора." },
      { status: 403 }
    );
  }

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
