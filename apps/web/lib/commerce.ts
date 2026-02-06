import { ProductCard } from "@/types/commerce";

export type { ProductCard };

const moneyFormatterCache = new Map<string, Intl.NumberFormat>();

function formatMoney(centAmount?: number, currencyCode?: string) {
  if (centAmount === undefined || !currencyCode) return undefined;
  const formatter =
    moneyFormatterCache.get(currencyCode) ??
    new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode });
  moneyFormatterCache.set(currencyCode, formatter);
  return formatter.format(centAmount / 100);
}

export function extractJsonFromToolContent(content: Array<any>): unknown | null {
  if (!Array.isArray(content)) return null;
  for (const entry of content) {
    if (entry?.type === "text" && typeof entry.text === "string") {
      try {
        return JSON.parse(entry.text);
      } catch {
        continue;
      }
    }
  }
  return null;
}

function findArray(data: any): any[] {
  if (!data || typeof data !== "object") return [];
  
  // Unwrap MCP response wrappers like "LIST PRODUCTS RESULT" or "SEARCH PRODUCTS RESULT"
  const keys = Object.keys(data);
  if (keys.length === 1 && keys[0].includes("RESULT")) {
    data = data[keys[0]];
  }
  
  const arr = data.results || data.products || data.items || data.productProjections || [];
  
  // Search results have productProjection nested inside each result
  if (arr.length > 0 && arr[0].productProjection) {
    return arr.map((item: any) => item.productProjection);
  }
  
  return arr;
}

export function normalizeProducts(data: unknown): ProductCard[] {
  const list = findArray(data);
  return list
    .map((item: any) => {
      // Handle commercetools Product structure: masterData.current contains the actual data
      const current = item?.masterData?.current ?? item;
      const masterVariant = current?.masterVariant ?? item?.masterVariant ?? item?.variant ?? {};
      const images = masterVariant?.images ?? current?.images ?? item?.images ?? [];
      const firstImage = images?.[0]?.url ?? images?.[0];
      const priceValue =
        masterVariant?.prices?.[0]?.value ??
        masterVariant?.price?.value ??
        item?.price?.value;
      const name =
        current?.name?.["en-GB"] || current?.name?.en || current?.name?.["en-US"] || 
        item?.name?.["en-GB"] || item?.name?.en || item?.name?.["en-US"] || item?.name || "Unnamed product";
      const description = 
        current?.description?.["en-GB"] || current?.description?.en || 
        item?.description?.["en-GB"] || item?.description?.en || item?.description;

      return {
        id: item?.id ?? item?.key ?? "unknown",
        name,
        description,
        imageUrl: typeof firstImage === "string" ? firstImage : undefined,
        price: formatMoney(priceValue?.centAmount, priceValue?.currencyCode),
        sku: masterVariant?.sku ?? item?.sku,
      } as ProductCard;
    })
    .filter((p) => Boolean(p.id));
}
