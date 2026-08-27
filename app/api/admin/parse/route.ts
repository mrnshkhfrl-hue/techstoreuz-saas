import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const usedProductParseSchema = z.object({
  title: z.string().describe("Бренд и модель устройства"),
  batteryHealth: z.number().min(1).max(100).describe("Процент состояния аккумулятора (от 1 до 100)"),
  region: z.string().describe("Регион устройства (например, LL/A, CH/A, ZP/A, RU/A)"),
  hasBox: z.boolean().describe("Наличие коробки или комплекта (true/false)"),
  defects: z.string().describe("Описание дефектов или состояния (если нет — пустая строка)"),
  price: z.number().describe("Цена устройства в долларах США ($)"),
});

// Heuristic fallback parser when AI key is absent or fails
function fallbackParser(text: string) {
  const cleanText = text.trim();
  
  // Extract Title (first line or matching iPhone/Samsung/MacBook)
  const lines = cleanText.split("\n").filter((l) => l.trim().length > 0);
  let title = lines[0] || "iPhone 15 Pro Max 256GB";
  title = title.replace(/^(продам|продается|срочно|sell|sale)[:\s]*/i, "").trim();
  if (title.length > 50) title = title.substring(0, 50);

  // Extract battery health (e.g. 89%, АКБ 92, battery 85)
  let batteryHealth = 88;
  const batteryMatch = cleanText.match(/(?:акб|батарея|battery|емкость)?\s*(\d{2,3})\s*%/i) || cleanText.match(/(?:акб|батарея|battery)\s*(\d{2,3})/i);
  if (batteryMatch && batteryMatch[1]) {
    const val = parseInt(batteryMatch[1], 10);
    if (val >= 1 && val <= 100) batteryHealth = val;
  }

  // Extract Region (LL/A, CH/A, ZP/A, etc.)
  let region = "LL/A";
  const regionMatch = cleanText.match(/\b(LL\/A|CH\/A|ZP\/A|RU\/A|AH\/A|EU\/A|KH\/A|J\/A|ZA\/A)\b/i);
  if (regionMatch && regionMatch[1]) {
    region = regionMatch[1].toUpperCase();
  }

  // Extract Has Box
  const boxKeywords = ["коробка", "коробкой", "box", "фулл комплект", "полный комплект", "родная коробка"];
  const hasBox = boxKeywords.some((kw) => cleanText.toLowerCase().includes(kw));

  // Extract Price ($750, 750$, 750 usd, 750 долл)
  let price = 750;
  const priceMatch = cleanText.match(/\$\s*(\d+)/) || cleanText.match(/(\d+)\s*\$/) || cleanText.match(/(\d+)\s*(?:usd|долл|у\.е|баксов)/i);
  if (priceMatch && priceMatch[1]) {
    price = parseInt(priceMatch[1], 10);
  }

  // Extract Defects
  let defects = "";
  const defectKeywords = ["царапин", "дефект", "замена", "менялся", "трещин", "скол", "не работает", "была замена"];
  const defectLines = lines.filter((l) => defectKeywords.some((kw) => l.toLowerCase().includes(kw)));
  if (defectLines.length > 0) {
    defects = defectLines.join("; ");
  } else {
    defects = "Отличное состояние";
  }

  return {
    title,
    batteryHealth,
    region,
    hasBox,
    defects,
    price,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Передайте текст для анализа (поле text)" },
        { status: 400 }
      );
    }

    // Try Vercel AI SDK generateObject with Gemini if apiKey exists
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey) {
      try {
        const result = await generateObject({
          model: google("gemini-2.5-flash"),
          system:
            "Ты ассистент магазина техники. Извлеки из текста параметры Б/У устройства. Верни строго JSON. Поля: title (строка, бренд и модель), batteryHealth (число, от 1 до 100), region (строка), hasBox (boolean), defects (строка, если нет — пусто), price (число, в долларах).",
          prompt: text,
          schema: usedProductParseSchema,
        });

        return NextResponse.json(result.object);
      } catch (aiErr: any) {
        console.warn("AI generation error, falling back to smart heuristic parser:", aiErr?.message);
        const fallbackObj = fallbackParser(text);
        return NextResponse.json(fallbackObj);
      }
    }

    // Fallback if no API key is provided
    const fallbackObj = fallbackParser(text);
    return NextResponse.json(fallbackObj);
  } catch (error: any) {
    console.error("Error in AI parse route:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка сервера при распознавании текста" },
      { status: 500 }
    );
  }
}
