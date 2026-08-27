const SYSTEM_PROMPT =
  "Ты — парсер электроники. Извлекай ТОЛЬКО данные из текста. НИЧЕГО НЕ ВЫДУМЫВАЙ. Если данных нет, ставь null.\n" +
  "Правила:\n" +
  "1. Память (storage): ищи числа с GB/TB (например 128GB, 256GB, 1TB). Запиши это в корень 'storage', а также в варианты (memory).\n" +
  "2. Цена (price): найди актуальную цену в долларах (например $516, 516$, или просто число 516, если понятно что это цена). 'oldPrice' — найди число с ❌ или зачеркнутое (например '1500❌' -> 1500).\n" +
  "3. UzIMEI (uzImei): ПО УМОЛЧАНИЮ ВСЕГДА true. Обрати внимание на наличие галочек (UzIMEI ✅ -> true). Ставь false ТОЛЬКО если рядом написано 'нет', 'yoq', '❌' или 'НЕТ'. Если просто написано 'Uzimei' без указания, то true.\n" +
  "4. Коробка (box): true, если есть 'Коробка', 'Karobka', 'Full', 'комплект', 'bor'. false, если 'yoq', 'нет', '❌'.\n" +
  "5. SIM (sim): e-sim, 2 sim, 1 sim, nano-sim, 1 sim + e sim. Запиши в корень 'sim'.\n" +
  "6. Состояние батареи (batteryHealth): процент (например 86-89% -> 86).\n" +
  "7. Телефоны: извлекай ВСЕ номера телефонов в виде массива строк.\n" +
  "Верни СТРОГО валидный JSON без Markdown:\n" +
  "{ 'name': '...', 'price': 516, 'oldPrice': null, 'batteryHealth': 86, 'batteryCycles': null, 'uzImei': true, 'box': true, 'sim': 'eSIM', 'storage': '128GB', 'condition': 'used', 'phones': [], 'variants': [{ 'model': '...', 'color': '...', 'memory': '128GB', 'price': 516, 'stock': 1, 'condition': 'USED' }] }";

function inferCategory(text: string): string {
  const firstLine = text.split("\n").map((l) => l.trim()).filter(Boolean)[0] || "";
  if (firstLine.startsWith("📲")) return "phone";
  if (firstLine.startsWith("💻")) return "mac";
  if (firstLine.startsWith("⌚")) return "watch";
  return "phone";
}

async function extractTelegramImages(url: string): Promise<string[]> {
  try {
    const embedUrl = url.includes("?") ? `${url}&embed=1` : `${url}?embed=1`;
    const res = await fetch(embedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const html = await res.text();
    const regex = /background-image:\s*url\(['"]?([^'"\)]+)['"]?\)/g;
    let match;
    const urls: string[] = [];
    while ((match = regex.exec(html)) !== null) {
      if (!match[1].includes("/emoji/")) {
        urls.push(match[1]);
      }
    }
    return urls;
  } catch (error) {
    console.error("Failed to extract telegram images:", error);
    return [];
  }
}

export async function parseFromText(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [{ text }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`AI_SERVER_ERROR`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new SyntaxError("Empty Gemini response");

  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON:", jsonStr);
    throw new SyntaxError("Invalid JSON");
  }

  const title = (parsed.name || "Товар").trim();
  const priceUSD = parsed.price != null ? Number(parsed.price) : 0;
  const oldPriceUSD = parsed.oldPrice != null ? Number(parsed.oldPrice) : null;
  const battery = parsed.batteryHealth != null ? Number(parsed.batteryHealth) : (parsed.battery != null ? Number(parsed.battery) : null);
  const batteryCycles = parsed.batteryCycles != null ? Number(parsed.batteryCycles) : null;
  const uzImei = parsed.uzImei !== false; // default true unless explicitly false
  const box = Boolean(parsed.box);
  const sim = parsed.sim ? String(parsed.sim) : null;
  let storage = parsed.storage ? String(parsed.storage).toUpperCase().replace(/\s/g, '') : null;
  if (storage && /^\d+$/.test(storage)) storage += "GB";
  
  const isUsed = String(parsed.condition || "").toLowerCase() === "used" 
    || text.toLowerCase().includes("sikl") 
    || text.toLowerCase().includes("battery")
    || batteryCycles != null
    || battery != null;
  const category = inferCategory(text);

  let images: string[] = [];
  const tgUrlMatch = text.match(/https:\/\/t\.me\/[^\s]+/i);
  if (tgUrlMatch) {
    images = await extractTelegramImages(tgUrlMatch[0]);
  }

  return {
    title,
    category,
    priceUSD,
    oldPriceUSD,
    battery,
    batteryHealth: battery,
    batteryCycles,
    uzImei,
    box,
    sim,
    storage,
    isUsed,
    stockCount: isUsed ? 1 : 10,
    images,
    variants: parsed.variants || [],
    phones: parsed.phones || [],
    repairs: parsed.repairs || null,
  };
}
