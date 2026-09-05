import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramProvider from "@/components/TelegramProvider";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Store";

export const metadata: Metadata = {
  title: `${storeName} — Магазин электроники`,
  description:
    "Премиум электроника в Telegram. Смартфоны, наушники, ноутбуки и аксессуары.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { CartProvider } from "@/providers/CartProvider";
import AnimatedBackground from "@/components/AnimatedBackground";
import { getCurrentExchangeRate } from "@/lib/currency";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialExchangeRate = await getCurrentExchangeRate();
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className="font-sans antialiased bg-surface-primary text-foreground min-h-screen relative selection:bg-[#007AFF]/30 transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AnimatedBackground />
          <CurrencyProvider initialExchangeRate={initialExchangeRate}>
            <TelegramProvider>
              <CartProvider>
                <div className="relative z-10 min-h-screen">
                  {children}
                </div>
              </CartProvider>
            </TelegramProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
