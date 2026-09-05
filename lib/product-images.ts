/**
 * Smart Product Photo & Storage Extractor
 * Maps product titles and models to high-resolution device photos with reliable fallbacks.
 */

export function getModelPhoto(title: string, customImage?: string | null): string {
  if (customImage && customImage.trim() && !customImage.includes("placeholder") && !customImage.startsWith("data:image/svg")) {
    return customImage;
  }

  const t = (title || "").toLowerCase();

  // iPhone 16 Pro / Pro Max
  if (t.includes("16 pro") || t.includes("16promax") || t.includes("16 pro max")) {
    return "/products/iphone15pro_1.webp";
  }
  // iPhone 16 / 16 Plus
  if (t.includes("iphone 16")) {
    return "/products/iphone15pro_2.jpg";
  }
  // iPhone 15 Pro / 15 Pro Max
  if (t.includes("15 pro")) {
    return "/products/iphone15pro_1.webp";
  }
  // iPhone 15
  if (t.includes("iphone 15")) {
    return "/products/iphone15pro_2.jpg";
  }
  // iPhone 14 Pro / 14 Pro Max
  if (t.includes("14 pro")) {
    return "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=600&auto=format&fit=crop&q=80";
  }
  // iPhone 14
  if (t.includes("iphone 14")) {
    return "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&auto=format&fit=crop&q=80";
  }
  // iPhone 13 Pro / 13 Pro Max
  if (t.includes("13 pro")) {
    return "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&auto=format&fit=crop&q=80";
  }
  // iPhone 13
  if (t.includes("iphone 13")) {
    return "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&auto=format&fit=crop&q=80";
  }
  // iPhone 12 Pro / 12
  if (t.includes("iphone 12")) {
    return "https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=600&auto=format&fit=crop&q=80";
  }
  // iPhone 11
  if (t.includes("iphone 11")) {
    return "https://images.unsplash.com/photo-1574755393849-623942496936?w=600&auto=format&fit=crop&q=80";
  }
  // AirPods
  if (t.includes("airpods")) {
    return "/products/airpods_pro2_1.webp";
  }
  // Apple Watch
  if (t.includes("watch") || t.includes("ultra")) {
    return "/products/aw_ultra2_1.jpg";
  }
  // JBL / Audio
  if (t.includes("jbl") || t.includes("charge") || t.includes("колонка")) {
    return "/products/jbl_charge5_1.jpg";
  }

  // Default fallback
  return "/products/iphone15pro_1.webp";
}

/**
 * Extract storage (e.g. 128 GB, 256 GB, 512 GB, 1 TB) from title if not explicitly provided
 */
export function extractStorage(title: string): string {
  if (!title) return "128 GB";
  const match = title.match(/\b(64|128|256|512|1024|1\s?TB)\s*(?:GB|TB)?\b/i);
  if (match) {
    const val = match[1].toUpperCase().replace(/\s+/g, "");
    if (val === "1TB" || val === "1 TB") return "1 TB";
    return `${val} GB`;
  }
  return "128 GB";
}
