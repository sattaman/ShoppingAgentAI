// Commerce domain types

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
