import { prisma } from "@/lib/prisma";
import StorefrontClient from "@/components/StorefrontClient";

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const shopId = Array.isArray(searchParams?.shopId)
    ? searchParams.shopId[0]
    : searchParams?.shopId;

  if (!shopId) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-[#030712] text-white flex items-center justify-center p-6 sm:border-x border-white/5">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 tracking-tight">Ошибка</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Ссылка на магазин недействительна<br />(отсутствует shopId)
          </p>
        </div>
      </div>
    );
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      newProducts: {
        include: { variants: true },
      },
      usedProducts: true,
    },
  });

  if (!shop) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-[#030712] text-white flex items-center justify-center p-6 sm:border-x border-white/5">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 tracking-tight">Магазин не найден</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Магазин с указанным ID больше не существует.
          </p>
        </div>
      </div>
    );
  }

  const serializedShop = JSON.parse(JSON.stringify(shop));

  return <StorefrontClient shop={serializedShop} />;
}
