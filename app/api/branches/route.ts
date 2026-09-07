import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    let branches = [];
    if (shopId) {
      branches = await prisma.branch.findMany({
        where: { shopId },
        orderBy: { name: 'asc' },
      });
    }

    if (branches.length === 0) {
      const defaultShop = await prisma.shop.findFirst({
        select: { id: true },
      });
      if (defaultShop) {
        branches = await prisma.branch.findMany({
          where: { shopId: defaultShop.id },
          orderBy: { name: 'asc' },
        });
      }
    }

    return NextResponse.json({ ok: true, branches });
  } catch (error: any) {
    console.error('[API branches GET error]:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
