import AdminMainView from "@/components/AdminMainView";
import { prisma } from "@/lib/prisma";
import { AlertCircle, Store } from "lucide-react";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const adminIdParam = resolvedSearchParams?.adminId;
  const adminId =
    typeof adminIdParam === "string"
      ? adminIdParam
      : Array.isArray(adminIdParam)
      ? adminIdParam[0]
      : undefined;

  /* ── 1. Error: Missing adminId ── */
  if (!adminId) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full p-8 rounded-[32px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Доступ запрещен
            </h1>
            <p className="text-sm text-white/50 leading-relaxed">
              Отсутствует идентификатор администратора (<code className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded text-xs font-mono">adminId</code>).
            </p>
          </div>

          <div className="pt-2 text-xs text-white/40 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04] font-mono">
            Пример ссылки: ?adminId=123456789
          </div>
        </div>
      </div>
    );
  }

  /* ── 2. Prisma Query ── */
  const shop = await prisma.shop.findFirst({
    where: {
      owner: {
        telegramId: adminId,
      },
    },
    include: {
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

  /* ── 3. Error: Shop Not Found ── */
  if (!shop) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full p-8 rounded-[32px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400">
            <Store size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Магазин не найден
            </h1>
            <p className="text-sm text-white/50 leading-relaxed">
              Магазин не найден или у вас нет прав доступа для администрирования (ID: <code className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-xs font-mono">{adminId}</code>).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AdminMainView shop={shop} />;
}
