export type ProductCard = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  sku?: string;
};

export type CartLineItem = {
  id: string;
  name: string;
  quantity: number;
  price?: string;
  total?: string;
  imageUrl?: string;
};

export type CartSummary = {
  id: string;
  total?: string;
  lineItems: CartLineItem[];
};

const moneyFormatterCache = new Map<string, Intl.NumberFormat>();

function formatMoney(centAmount?: number, currencyCode?: string) {
  if (centAmount === undefined || !currencyCode) return undefined;
  const key = currencyCode;
  const formatter =
    moneyFormatterCache.get(key) ??
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    });
  moneyFormatterCache.set(key, formatter);
  return formatter.format(centAmount / 100);
}

function parseJsonCandidate(value: unknown): unknown | null {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function extractJsonFromToolContent(content: Array<any>): unknown | null {
  if (!Array.isArray(content)) return null;
  for (const entry of content) {
    if (entry?.type === "text" && typeof entry.text === "string") {
      const parsed = parseJsonCandidate(entry.text);
      if (parsed) return parsed;
    }
    if (typeof entry?.text === "string") {
      const parsed = parseJsonCandidate(entry.text);
      if (parsed) return parsed;
    }
  }
  return null;
}

function findArray(data: any): any[] {
  if (!data || typeof data !== "object") return [];
  return (
    data.results ||
    data.products ||
    data.items ||
    data.productProjections ||
    data.data?.results ||
    data.data?.products ||
    []
  );
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
        item?.price?.value ??
        item?.prices?.[0]?.value;
      const name =
        item?.name?.en ||
        item?.name?.["en-US"] ||
        item?.name ||
        item?.title ||
        "Unnamed product";
      return {
        id: item?.id ?? item?.key ?? item?.sku ?? "unknown",
        name,
        description:
          item?.description?.en ||
          item?.description?.["en-US"] ||
          item?.description,
        imageUrl: typeof firstImage === "string" ? firstImage : undefined,
        price: formatMoney(priceValue?.centAmount, priceValue?.currencyCode),
        sku: masterVariant?.sku ?? item?.sku,
      } as ProductCard;
    })
    .filter((item: ProductCard) => Boolean(item.id));
}

function findCart(data: any): any | null {
  if (!data || typeof data !== "object") return null;
  if (data.lineItems) return data;
  if (data.cart?.lineItems) return data.cart;
  if (data.result?.lineItems) return data.result;
  if (data.data?.lineItems) return data.data;
  return null;
}

export function normalizeCart(data: unknown): CartSummary | null {
  const cart = findCart(data);
  if (!cart) return null;

  const lineItems = Array.isArray(cart.lineItems) ? cart.lineItems : [];
  const normalizedItems = lineItems.map((item: any) => {
    const imageUrl =
      item?.variant?.images?.[0]?.url ??
      item?.variant?.images?.[0] ??
      undefined;
    const unitPrice =
      item?.price?.value ?? item?.variant?.price?.value ?? item?.price?.value;
    return {
      id: item?.id ?? item?.productId ?? "unknown",
      name:
        item?.name?.en ||
        item?.name?.["en-US"] ||
        item?.name ||
        "Line item",
      quantity: item?.quantity ?? 1,
      price: formatMoney(unitPrice?.centAmount, unitPrice?.currencyCode),
      total: formatMoney(
        item?.totalPrice?.centAmount,
        item?.totalPrice?.currencyCode,
      ),
      imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
    } as CartLineItem;
  });

  const total = formatMoney(
    cart?.totalPrice?.centAmount,
    cart?.totalPrice?.currencyCode,
  );

  return {
    id: cart?.id ?? "unknown",
    total,
    lineItems: normalizedItems,
  };
}
