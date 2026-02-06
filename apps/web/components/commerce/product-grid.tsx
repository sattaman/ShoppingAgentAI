import type { ProductCard as ProductCardType } from "@/types/commerce";
import { ProductCard, ProductCardSkeleton } from "./product-card";

export function ProductGrid({ title = "Products", products }: { title?: string; products: ProductCardType[] }) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No products found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-sm font-medium">{title}</div>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-sm font-medium">Loading...</div>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
