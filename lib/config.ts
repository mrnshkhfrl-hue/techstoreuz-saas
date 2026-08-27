export const globalConfig: Record<string, { models: Record<string, { colors: string[], storage?: string[] }> }> = {
  "phone": {
    models: {
      "iPhone X": { colors: ["Space Gray", "Silver"], storage: ["64GB", "256GB"] },
      "iPhone XS": { colors: ["Space Gray", "Silver", "Gold"], storage: ["64GB", "256GB", "512GB"] },
      "iPhone XS Max": { colors: ["Space Gray", "Silver", "Gold"], storage: ["64GB", "256GB", "512GB"] },
      "iPhone XR": { colors: ["Black", "White", "Blue", "Yellow", "Coral", "Product RED"], storage: ["64GB", "128GB", "256GB"] },
      "iPhone 11": { colors: ["Black", "Green", "Yellow", "Purple", "White", "Product RED"], storage: ["64GB", "128GB", "256GB"] },
      "iPhone 11 Pro": { colors: ["Space Gray", "Silver", "Gold", "Midnight Green"], storage: ["64GB", "256GB", "512GB"] },
      "iPhone 11 Pro Max": { colors: ["Space Gray", "Silver", "Gold", "Midnight Green"], storage: ["64GB", "256GB", "512GB"] },
      "iPhone 12 Mini": { colors: ["Black", "White", "Product RED", "Green", "Blue", "Purple"], storage: ["64GB", "128GB", "256GB"] },
      "iPhone 12": { colors: ["Black", "White", "Product RED", "Green", "Blue", "Purple"], storage: ["64GB", "128GB", "256GB"] },
      "iPhone 12 Pro": { colors: ["Silver", "Graphite", "Gold", "Pacific Blue"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 12 Pro Max": { colors: ["Silver", "Graphite", "Gold", "Pacific Blue"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 13 Mini": { colors: ["Starlight", "Midnight", "Blue", "Pink", "Green", "Product RED"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 13": { colors: ["Starlight", "Midnight", "Blue", "Pink", "Green", "Product RED"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 13 Pro": { colors: ["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"], storage: ["128GB", "256GB", "512GB", "1TB"] },
      "iPhone 13 Pro Max": { colors: ["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"], storage: ["128GB", "256GB", "512GB", "1TB"] },
      "iPhone 14": { colors: ["Midnight", "Purple", "Starlight", "Product RED", "Blue", "Yellow"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 14 Plus": { colors: ["Midnight", "Purple", "Starlight", "Product RED", "Blue", "Yellow"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 14 Pro": { colors: ["Space Black", "Silver", "Gold", "Deep Purple"], storage: ["128GB", "256GB", "512GB", "1TB"] },
      "iPhone 14 Pro Max": { colors: ["Space Black", "Silver", "Gold", "Deep Purple"], storage: ["128GB", "256GB", "512GB", "1TB"] },
      "iPhone 15": { colors: ["Black", "Blue", "Green", "Yellow", "Pink"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 15 Plus": { colors: ["Black", "Blue", "Green", "Yellow", "Pink"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 15 Pro": { colors: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"], storage: ["128GB", "256GB", "512GB", "1TB"] },
      "iPhone 15 Pro Max": { colors: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"], storage: ["256GB", "512GB", "1TB"] },
      "iPhone 16": { colors: ["Black", "White", "Pink", "Teal", "Ultramarine"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 16 Plus": { colors: ["Black", "White", "Pink", "Teal", "Ultramarine"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 16 Pro": { colors: ["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"], storage: ["128GB", "256GB", "512GB", "1TB"] },
      "iPhone 16 Pro Max": { colors: ["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"], storage: ["256GB", "512GB", "1TB"] },
      "iPhone 17": { colors: ["Black", "White", "Mist Blue", "Sage", "Lavender"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 17 Air": { colors: ["Space Black", "Cloud White", "Light Gold", "Sky Blue"], storage: ["128GB", "256GB", "512GB"] },
      "iPhone 17 Pro": { colors: ["Cosmic Orange", "Deep Blue", "Silver"], storage: ["128GB", "256GB", "512GB", "1TB", "2TB"] },
      "iPhone 17 Pro Max": { colors: ["Cosmic Orange", "Deep Blue", "Silver"], storage: ["256GB", "512GB", "1TB", "2TB"] }
    }
  },
  "mac": {
    models: {
      "MacBook Air (Intel/M1)": { colors: ["Space Gray", "Silver", "Gold"], storage: ["256GB", "512GB", "1TB"] },
      "MacBook Air (M2/M3)": { colors: ["Midnight", "Starlight", "Space Gray", "Silver"], storage: ["256GB", "512GB", "1TB"] },
      "MacBook Pro 13": { colors: ["Space Gray", "Silver"], storage: ["256GB", "512GB", "1TB"] },
      "MacBook Pro 14": { colors: ["Space Gray", "Silver", "Space Black"], storage: ["512GB", "1TB", "2TB"] },
      "MacBook Pro 15": { colors: ["Space Gray", "Silver"], storage: ["256GB", "512GB", "1TB"] },
      "MacBook Pro 16": { colors: ["Space Gray", "Silver", "Space Black"], storage: ["512GB", "1TB", "2TB"] }
    }
  },
  "tablet": {
    models: {
      "iPad Pro": { colors: ["Space Gray", "Silver", "Space Black"], storage: ["128GB", "256GB", "512GB", "1TB", "2TB"] },
      "iPad Air": { colors: ["Space Gray", "Silver", "Starlight", "Blue", "Purple", "Pink", "Green", "Sky Blue"], storage: ["64GB", "128GB", "256GB"] },
      "iPad Mini": { colors: ["Space Gray", "Pink", "Purple", "Starlight"], storage: ["64GB", "256GB"] },
      "iPad Base": { colors: ["Silver", "Space Gray", "Yellow", "Pink", "Blue"], storage: ["64GB", "256GB"] }
    }
  },
  "watch": {
    models: {
      "Apple Watch Series 4": { colors: ["Midnight", "Starlight", "Silver", "Graphite", "Space Black", "Gold", "Product RED"] },
      "Apple Watch Series 5": { colors: ["Midnight", "Starlight", "Silver", "Graphite", "Space Black", "Gold", "Product RED"] },
      "Apple Watch Series 6": { colors: ["Midnight", "Starlight", "Silver", "Graphite", "Space Black", "Gold", "Product RED"] },
      "Apple Watch Series 7": { colors: ["Midnight", "Starlight", "Silver", "Graphite", "Space Black", "Gold", "Product RED"] },
      "Apple Watch Series 8": { colors: ["Midnight", "Starlight", "Silver", "Graphite", "Space Black", "Gold", "Product RED"] },
      "Apple Watch Series 9": { colors: ["Midnight", "Starlight", "Silver", "Graphite", "Space Black", "Gold", "Product RED"] },
      "Apple Watch Series 10": { colors: ["Midnight", "Starlight", "Silver", "Graphite", "Space Black", "Gold", "Product RED"] },
      "Apple Watch Series 11": { colors: ["Midnight", "Starlight", "Silver", "Graphite", "Space Black", "Gold", "Product RED"] },
      "Apple Watch SE": { colors: ["Midnight", "Starlight", "Silver"] },
      "Apple Watch Ultra 1": { colors: ["Natural Titanium"] },
      "Apple Watch Ultra 2": { colors: ["Natural Titanium", "Black Titanium"] },
      "Apple Watch Ultra 3": { colors: ["Natural Titanium", "Black Titanium"] }
    }
  },
  "audio": {
    models: {
      "AirPods 2": { colors: ["White"] },
      "AirPods 3": { colors: ["White"] },
      "AirPods 4": { colors: ["White"] },
      "AirPods Pro": { colors: ["White"] },
      "AirPods Pro 2": { colors: ["White"] },
      "AirPods Pro 3": { colors: ["White"] },
      "AirPods Max": { colors: ["Space Gray", "Silver", "Green", "Sky Blue", "Pink", "Midnight", "Starlight", "Blue", "Purple", "Orange"] }
    }
  },
  "dyson": {
    models: {
      "Dyson Airwrap": { colors: ["Iron/Fuchsia", "Nickel/Copper", "Blue/Copper", "Vinca Blue/Rosé", "Ceramic Pop", "Ceramic Pink/Rose Gold", "Strawberry Bronze", "Onyx/Gold"] },
      "Dyson Supersonic": { colors: ["Iron/Fuchsia", "Nickel/Copper", "Blue/Copper", "Vinca Blue/Rosé", "Ceramic Pop", "Ceramic Pink/Rose Gold", "Strawberry Bronze", "Onyx/Gold"] },
      "Dyson Corrale": { colors: ["Iron/Fuchsia", "Nickel/Copper", "Blue/Copper", "Vinca Blue/Rosé", "Ceramic Pop", "Ceramic Pink/Rose Gold", "Strawberry Bronze", "Onyx/Gold"] }
    }
  }
};

/** Map of color names → hex codes for rendering color swatches */
export const colorHexMap: Record<string, string> = {
  // Neutrals
  "Black": "#1D1D1F",
  "White": "#F5F5F7",
  "Silver": "#E3E4E5",
  "Gold": "#F4E3CE",
  "Space Gray": "#86868B",
  "Space Black": "#2E2C2F",
  "Graphite": "#54524F",
  "Midnight": "#2E3642",
  "Starlight": "#F0E4D3",

  // iPhone XR / 11
  "Coral": "#FF6E54",
  "Yellow": "#FFE680",
  "Purple": "#D1CDDA",
  "Green": "#ADE0C6",
  "Blue": "#A7C1D9",
  "(PRODUCT)RED": "#FF3B30",
  "Product RED": "#FF3B30",
  "Midnight Green": "#4E5851",

  // iPhone 12 Pro
  "Pacific Blue": "#2D4E6F",

  // iPhone 13 Pro
  "Sierra Blue": "#9BB5CE",
  "Alpine Green": "#576856",
  "Pink": "#F9E0DC",

  // iPhone 14 Pro
  "Deep Purple": "#5B4A75",

  // iPhone 15 Pro — Titanium
  "Natural Titanium": "#C4BFB6",
  "Blue Titanium": "#3E4950",
  "White Titanium": "#E3DED7",
  "Black Titanium": "#3A3A3C",

  // iPhone 16
  "Teal": "#5BBFBF",
  "Ultramarine": "#3F51B5",
  "Desert Titanium": "#BFB09A",

  // iPhone 17
  "Mist Blue": "#B0C4D8",
  "Sage": "#A8B5A0",
  "Lavender": "#C5B9D4",
  "Cloud White": "#F0EDE8",
  "Light Gold": "#E8DCC8",
  "Sky Blue": "#7EC8E3",
  "Cosmic Orange": "#E86830",
  "Deep Blue": "#1A3A5C",

  // AirPods Max extras
  "Orange": "#F5845C",

  // Dyson
  "Iron/Fuchsia": "#87757B",
  "Nickel/Copper": "#B5A18E",
  "Blue/Copper": "#4A6FA5",
  "Vinca Blue/Rosé": "#7B7EB5",
  "Ceramic Pop": "#E8A0B0",
  "Ceramic Pink/Rose Gold": "#D4A0A0",
  "Strawberry Bronze": "#C47A60",
  "Onyx/Gold": "#3A3A3A",
};

/** Resolve a color name to its hex code */
export function getColorHex(colorName: string): string {
  // Try exact match first
  if (colorHexMap[colorName]) return colorHexMap[colorName];
  // Try case-insensitive match
  const lowerName = colorName.toLowerCase();
  const match = Object.keys(colorHexMap).find(k => k.toLowerCase() === lowerName);
  return match ? colorHexMap[match] : "#86868B";
}

/** Categories that should NOT show UzIMEI, battery, cycles, box fields */
export const HIDE_PHONE_FIELDS_CATEGORIES = ["audio", "watch", "dyson", "smartwatches", "accessory", "accessories"];

/** Helper to check if a category should hide phone-specific fields */
export function shouldHidePhoneFields(category: string): boolean {
  return HIDE_PHONE_FIELDS_CATEGORIES.includes(category.toLowerCase());
}
