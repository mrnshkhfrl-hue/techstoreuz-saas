import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    const targetShop = shopId
      ? await prisma.shop.findUnique({ where: { id: shopId } })
      : await prisma.shop.findFirst();

    if (!targetShop) {
      return NextResponse.json({ error: 'Магазин не найден' }, { status: 404 });
    }

    const branches = await prisma.branch.findMany({
      where: { shopId: targetShop.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ ok: true, branches });
  } catch (error: any) {
    console.error('[AdminBranches GET error]:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, address, phone, shopId } = body;

    if (!name || !address) {
      return NextResponse.json({ error: 'Название и адрес обязательны' }, { status: 400 });
    }

    const targetShop = shopId
      ? await prisma.shop.findUnique({ where: { id: shopId } })
      : await prisma.shop.findFirst();

    if (!targetShop) {
      return NextResponse.json({ error: 'Магазин не найден' }, { status: 404 });
    }

    const newBranch = await prisma.branch.create({
      data: {
        shopId: targetShop.id,
        name: name.trim(),
        address: address.trim(),
        phone: phone ? phone.trim() : '+998 77 285-99-99',
      },
    });

    return NextResponse.json({ ok: true, branch: newBranch });
  } catch (error: any) {
    console.error('[AdminBranches POST error]:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID филиала обязателен' }, { status: 400 });
    }

    await prisma.branch.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[AdminBranches DELETE error]:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
