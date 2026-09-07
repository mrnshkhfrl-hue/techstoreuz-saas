import AdminMainView from "@/components/AdminMainView";
import AdminAutoLogin from "@/components/AdminAutoLogin";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, Store } from "lucide-react";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const adminIdParam = resolvedSearchParams?.adminId;
  const adminId =
    typeof adminIdParam === "string"
      ? adminIdParam.trim()
      : Array.isArray(adminIdParam)
      ? adminIdParam[0]?.trim()
      : undefined;

  /* ── 1. If adminId is missing, resolve automatically via Telegram WebApp ── */
  if (!adminId) {
    return <AdminAutoLogin />;
  }

  /* ── 2. Security Check: Authorized Telegram IDs ── */
  const envAdminIds = [
    process.env.ADMIN_CHAT_IDS,
    process.env.NEXT_PUBLIC_ADMIN_IDS,
    process.env.SUPERADMIN_IDS,
    process.env.NEXT_PUBLIC_SUPERADMIN_IDS,
    "8603067434",
    "7949519588",
  ]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isConfiguredAdmin = envAdminIds.includes(adminId);

  /* ── 3. Query Shop: allow if user is in envAdminIds OR is shop owner OR is in shop admins ── */
  const shop = await prisma.shop.findFirst({
    where: isConfiguredAdmin
      ? {} // Configured store admins (7949519588, 8603067434) manage the shop
      : {
          OR: [
            { owner: { telegramId: adminId } },
            { admins: { some: { user: { telegramId: adminId } } } },
          ],
        },
    include: {
      owner: true,
      admins: { include: { user: true } },
      usedProducts: {
        orderBy: {
          id: "desc",
        },
      },
      newProducts: {
        include: {
          variants: true,
        },
      },
      bookings: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          usedProduct: true,
          variant: {
            include: {
              template: true,
            },
          },
        },
      },
    },
  });

  /* ── 4. If not authorized or no shop exists ── */
  if (!shop) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-sm w-full p-8 rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert size={28} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Доступ запрещен
            </h1>
            <p className="text-xs text-white/50 leading-relaxed">
              У вас нет прав для управления магазином. Доступ открыт исключительно для подтвержденных администраторов.
            </p>
          </div>

          <a
            href="/"
            className="block w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all"
          >
            ← В каталог магазина
          </a>
        </div>
      </div>
    );
  }

  /* ── 5. Fetch all customers for CRM database (от А до Я) ── */
  const allUsers = await prisma.user.findMany({
    include: {
      bookings: {
        where: { shopId: shop.id },
        include: {
          usedProduct: true,
          variant: {
            include: {
              template: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const customers = allUsers.map((u) => {
    const userBookings = u.bookings || [];
    const completed = userBookings.filter((b) => b.status === "COMPLETED");
    const active = userBookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING");
    const cancelled = userBookings.filter((b) => b.status === "CANCELLED");

    const totalSpent = completed.reduce((sum, b) => {
      const p = b.usedProduct?.price || b.variant?.price || 0;
      return sum + p;
    }, 0);

    let tier: "VIP" | "REGULAR" | "NEW" = "NEW";
    if (completed.length >= 2 || totalSpent >= 1500) {
      tier = "VIP";
    } else if (completed.length >= 1 || userBookings.length >= 2) {
      tier = "REGULAR";
    }

    return {
      id: u.id,
      telegramId: u.telegramId,
      name: u.name || "Без имени",
      phone: u.phone,
      photoUrl: u.photoUrl,
      isPremium: u.isPremium,
      tier,
      totalBookings: userBookings.length,
      completedPurchases: completed.length,
      activeBookings: active.length,
      cancelledBookings: cancelled.length,
      totalSpent,
      lastActivity: userBookings[0]?.createdAt ? userBookings[0].createdAt.toISOString() : null,
      history: userBookings.map((b) => ({
        id: b.id,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
        productTitle: b.usedProduct?.title || b.variant?.template?.title || "Товар",
        price: b.usedProduct?.price || b.variant?.price || 0,
        isUsed: Boolean(b.usedProductId || b.usedProduct),
        details: b.usedProduct
          ? `${b.usedProduct.batteryHealth}% АКБ • ${b.usedProduct.region}`
          : b.variant
          ? `${b.variant.storage} • ${b.variant.color}`
          : "",
      })),
    };
  });

  customers.sort((a, b) => b.totalSpent - a.totalSpent || b.totalBookings - a.totalBookings);

  return <AdminMainView shop={shop} currentAdminId={adminId} initialCustomers={customers} />;
}
