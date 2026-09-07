/**
 * Smart Product Photo & Storage Extractor
 * Maps product titles and models to high-resolution device photos with reliable multi-photo galleries.
 */

export function getModelPhoto(title: string, customImage?: string | null): string {
  const photos = getModelPhotos(title, customImage ? [customImage] : undefined);
  return photos[0] || "/products/iphone15pro_1.webp";
}

export function getModelPhotos(title: string, customImages?: string[] | null): string[] {
  if (customImages && Array.isArray(customImages) && customImages.length > 0) {
    const valid = customImages.filter(img => img && img.trim() && !img.includes("placeholder") && !img.startsWith("data:image/svg"));
    if (valid.length > 0) return valid;
  }

  const t = (title || "").toLowerCase();

  // iPhone 16 Pro / Pro Max (Desert Titanium & Natural Titanium multi-angle)
  if (t.includes("16 pro") || t.includes("16promax") || t.includes("16 pro max")) {
    return [
      "/products/iphone15pro_1.webp",
      "/products/iphone15pro_2.jpg",
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&auto=format&fit=crop&q=80",
    ];
  }

  // iPhone 16 / 16 Plus
  if (t.includes("iphone 16")) {
    return [
      "/products/iphone15pro_2.jpg",
      "/products/iphone15pro_1.webp",
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80",
    ];
  }

  // iPhone 15 Pro / 15 Pro Max
  if (t.includes("15 pro")) {
    return [
      "/products/iphone15pro_1.webp",
      "/products/iphone15pro_2.jpg",
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
    ];
  }

  // iPhone 15 / 15 Plus
  if (t.includes("iphone 15")) {
    return [
      "/products/iphone15pro_2.jpg",
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80",
      "/products/iphone15pro_1.webp",
    ];
  }

  // iPhone 14 Pro / 14 Pro Max
  if (t.includes("14 pro")) {
    return [
      "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80",
      "/products/iphone15pro_1.webp",
    ];
  }

  // iPhone 14 / 13
  if (t.includes("iphone 14") || t.includes("iphone 13")) {
    return [
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&auto=format&fit=crop&q=80",
      "/products/iphone15pro_2.jpg",
    ];
  }

  // AirPods
  if (t.includes("airpods")) {
    return [
      "/products/airpods_pro2_1.webp",
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80",
    ];
  }

  // Apple Watch
  if (t.includes("watch") || t.includes("ultra")) {
    return [
      "/products/aw_ultra2_1.jpg",
      "https://images.unsplash.com/photo-1509741102003-ca64bfe5f069?w=800&auto=format&fit=crop&q=80",
    ];
  }

  // Fallback 3 photos
  return [
    "/products/iphone15pro_1.webp",
    "/products/iphone15pro_2.jpg",
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
  ];
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
