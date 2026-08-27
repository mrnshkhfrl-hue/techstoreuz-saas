export function formatPrice(
  priceInUSD: number, 
  currency: "USD" | "UZS", 
  rate?: number
): string {
  if (currency === "USD") {
    // For USD, just format nicely
    return `$${priceInUSD.toLocaleString('en-US')}`;
  }

  // UZS calculation
  const actualRate = rate || Number(process.env.NEXT_PUBLIC_USD_TO_UZS_RATE) || 12600;
  const priceUZS = Math.round(priceInUSD * actualRate);

  // Format as '1 890 000 сум'
  return `${priceUZS.toLocaleString('ru-RU')} сум`;
}
