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

  return <AdminMainView shop={shop} currentAdminId={adminId} />;
}
