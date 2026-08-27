import { z } from "zod";

export const variantSchema = z.object({
  model: z.string().optional(),
  color: z.string().optional(),
  memory: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().default(1),
  condition: z.enum(["USED", "NEW"]).optional(),
});

export const parserSchema = z.object({
  name: z.string().describe("Название товара"),
  priceUSD: z.number().describe("Цена в долларах"),
  oldPriceUSD: z.number().nullable().describe("Старая зачеркнутая цена, если есть"),
  batteryHealth: z.number().nullable().describe("Процент состояния батареи"),
  batteryCycles: z.number().nullable().describe("Количество циклов заряда"),
  uzImei: z.boolean().describe("Наличие UzIMEI. По умолчанию true, если не сказано обратного"),
  box: z.boolean().describe("Наличие коробки/комплекта"),
  sim: z.string().nullable().describe("Тип SIM карты (e.g., e-sim, 2 sim)"),
  storage: z.string().nullable().describe("Объем памяти (e.g., 128GB, 1TB)"),
  isUsed: z.boolean().describe("Б/У ли это устройство? (true если used/б.у.)"),
  category: z.string().describe("Категория (phone, mac, watch)"),
  images: z.array(z.string()).describe("Массив URL картинок (если были переданы)"),
  phones: z.array(z.string()).describe("Найденные номера телефонов продавца"),
  repairs: z.string().nullable().describe("Информация о ремонтах, если есть"),
  variants: z.array(variantSchema).describe("Варианты товара, если их несколько"),
});
