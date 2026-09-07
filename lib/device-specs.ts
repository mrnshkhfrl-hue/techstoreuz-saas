/**
 * Auto-generated device specifications and installment plans
 * for Apple & flagship devices in Uzbekistan market format.
 */

export interface DeviceSpecs {
  camera: string;
  processor: string;
  display: string;
  battery: string;
  boxContents: string;
  uzimei: string;
  warranty: string;
  installment: {
    initialPaymentUsd: number;
    months6Usd: number;
    months9Usd: number;
    months12Usd: number;
    requiredDocs: string;
  };
}

export const STORE_MANAGERS = [
  { name: "Yusuf", phone: "+998955241111", displayPhone: "(95) 524-11-11" },
  { name: "Izzat", phone: "+998958091111", displayPhone: "(95) 809-11-11" },
  { name: "Samandar", phone: "+998994561111", displayPhone: "(99) 456-11-11" },
  { name: "Abdulloh", phone: "+998958031111", displayPhone: "(95) 803-11-11" },
];

export const STORE_TELEGRAM = "https://t.me/Prostoreuzb";

export function getDeviceSpecs(title: string, priceUsd: number = 999): DeviceSpecs {
  const t = (title || "").toLowerCase();

  // Installment calculations: 30% down payment, 15% markup for 6m, 20% for 9m, 25% for 12m
  const price = priceUsd > 0 ? priceUsd : 999;
  const initial = Math.round(price * 0.3);
  const remaining = price - initial;
  const m6 = Math.round((remaining * 1.15) / 6);
  const m9 = Math.round((remaining * 1.20) / 9);
  const m12 = Math.round((remaining * 1.25) / 12);

  const defaultInstallment = {
    initialPaymentUsd: initial,
    months6Usd: m6,
    months9Usd: m9,
    months12Usd: m12,
    requiredDocs: "Паспорт (оригинал или копия)",
  };

  if (t.includes("16 pro max")) {
    return {
      camera: "48 МП Fusion (f/1.78) + 48 МП Ultra Wide + 12 МП 5x Telephoto • 4K 120 fps Dolby Vision • ProRAW",
      processor: "Apple A18 Pro (3 нм) • 6 ядер CPU + 6 ядер GPU • 16-ядерный Neural Engine нового поколения",
      display: "6.9″ Super Retina XDR OLED • ProMotion 120 Гц • Always-On • Dynamic Island • Яркость до 2000 нит",
      battery: "До 33 часов воспроизведения видео • MagSafe быстрая зарядка 25W • USB-C 3.0 (до 10 Гбит/с)",
      boxContents: "iPhone 16 Pro Max, кабель USB-C с плетеной оплеткой (1 м), скрепка SIM, документация",
      uzimei: "Официально зарегистрирован ✅ (2 SIM / eSIM)",
      warranty: "1 год официальной гарантии Apple + 30 дней на обмен от магазина",
      installment: defaultInstallment,
    };
  }

  if (t.includes("16 pro")) {
    return {
      camera: "48 МП Fusion + 48 МП Ultra Wide + 12 МП 5x Telephoto • 4K 120 fps Dolby Vision • Камера-контроль",
      processor: "Apple A18 Pro (3 нм) • Высокая производительность для AAA-игр и ИИ",
      display: "6.3″ Super Retina XDR OLED • ProMotion 120 Гц • Always-On • Ceramic Shield 2-го поколения",
      battery: "До 27 часов воспроизведения видео • Быстрая зарядка 50% за 30 мин",
      boxContents: "iPhone 16 Pro, кабель USB-C с плетеной оплеткой, документация",
      uzimei: "Официально зарегистрирован ✅ (2 SIM / eSIM)",
      warranty: "1 год официальной гарантии Apple + 30 дней на обмен",
      installment: defaultInstallment,
    };
  }

  if (t.includes("16")) {
    return {
      camera: "48 МП Fusion 2-в-1 + 12 МП Ultra Wide с макросъемкой • Пространственные фото и видео",
      processor: "Apple A18 (3 нм) • Оптимизирован под Apple Intelligence",
      display: "6.1″ Super Retina XDR OLED • Dynamic Island • Яркость до 2000 нит",
      battery: "До 22 часов воспроизведения видео • Быстрая зарядка MagSafe",
      boxContents: "iPhone 16, кабель USB-C, документация",
      uzimei: "Официально зарегистрирован ✅ (2 SIM / eSIM)",
      warranty: "1 год официальной гарантии Apple",
      installment: defaultInstallment,
    };
  }

  if (t.includes("15 pro max") || t.includes("15 pro")) {
    return {
      camera: "48 МП Pro камера + 12 МП Ultra Wide + 12 МП Telephoto (5x/3x) • 4K 60 fps ProRes • Photonic Engine",
      processor: "Apple A17 Pro (3 нм) • Аппаратная трассировка лучей",
      display: "Super Retina XDR OLED • ProMotion 120 Гц • Always-On • Титановый корпус Grade 5",
      battery: "До 29 часов видео • USB-C 3.0 • Быстрая зарядка",
      boxContents: "iPhone 15 Pro, кабель USB-C, документация",
      uzimei: "Официально зарегистрирован ✅ (2 SIM / eSIM)",
      warranty: "1 год сервисной гарантии Apple",
      installment: defaultInstallment,
    };
  }

  if (t.includes("15")) {
    return {
      camera: "48 МП основная камера + 12 МП Ultra Wide • 2x оптический зум без потери качества",
      processor: "Apple A16 Bionic • 6 ядер CPU + 5 ядер GPU",
      display: "Super Retina XDR OLED • Dynamic Island • Яркость до 2000 нит",
      battery: "До 20 часов воспроизведения видео • USB-C разъем",
      boxContents: "iPhone 15, кабель USB-C, документация",
      uzimei: "Официально зарегистрирован ✅",
      warranty: "1 год сервисной гарантии",
      installment: defaultInstallment,
    };
  }

  if (t.includes("14 pro")) {
    return {
      camera: "48 МП основная + 12 МП Ultra Wide + 12 МП Telephoto • Режим «Киноэффект» 4K HDR",
      processor: "Apple A16 Bionic (4 нм)",
      display: "Super Retina XDR OLED • ProMotion 120 Гц • Dynamic Island",
      battery: "До 23 часов видео • Lightning",
      boxContents: "iPhone 14 Pro, кабель Lightning to USB-C",
      uzimei: "Официально зарегистрирован ✅",
      warranty: "Гарантия магазина 6 месяцев",
      installment: defaultInstallment,
    };
  }

  // Generic Apple Smartphone specs
  return {
    camera: "Передовая система камер Apple с ночным режимом, Smart HDR и съемкой 4K Dolby Vision",
    processor: "Фирменный энергоэффективный процессор Apple Bionic",
    display: "Дисплей Super Retina XDR с высокой плотностью пикселей и технологией True Tone",
    battery: "Целый день автономной работы с поддержкой быстрой беспроводной зарядки",
    boxContents: "Устройство Apple, зарядный кабель, документация",
    uzimei: "Официально зарегистрирован ✅ (2 SIM / eSIM)",
    warranty: "Гарантия магазина с бесплатной заменой при заводском дефекте",
    installment: defaultInstallment,
  };
}
