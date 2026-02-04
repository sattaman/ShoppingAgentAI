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
  return data.results || data.products || data.items || data.productProjections || [];
}

export function normalizeProducts(data: unknown): ProductCard[] {
  const list = findArray(data);
  return list
    .map((item: any) => {
      const masterVariant = item?.masterVariant ?? item?.variant ?? {};
      const images = masterVariant?.images ?? item?.images ?? [];
      const firstImage = images?.[0]?.url ?? images?.[0];
      const priceValue =
        masterVariant?.prices?.[0]?.value ??
        masterVariant?.price?.value ??
        item?.price?.value;
      const name =
        item?.name?.en || item?.name?.["en-US"] || item?.name || "Unnamed product";

      return {
        id: item?.id ?? item?.key ?? "unknown",
        name,
        description: item?.description?.en || item?.description?.["en-US"] || item?.description,
        imageUrl: typeof firstImage === "string" ? firstImage : undefined,
        price: formatMoney(priceValue?.centAmount, priceValue?.currencyCode),
        sku: masterVariant?.sku ?? item?.sku,
      } as ProductCard;
    })
    .filter((p) => Boolean(p.id));
}
