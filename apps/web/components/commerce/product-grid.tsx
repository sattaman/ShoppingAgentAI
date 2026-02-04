import { ProductCard } from "@/types/commerce";

export function ProductGrid({
  title = "Products",
  products,
}: {
  title?: string;
  products: ProductCard[];
}) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No products found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {title}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-36 w-full rounded-md object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-36 w-full items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800">
                No image
              </div>
            )}
            <div className="mt-3 flex flex-col gap-1">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {product.name}
              </div>
              {product.description && (
                <div className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {product.description}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{product.sku ? `SKU ${product.sku}` : " "}</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {product.price ?? "Price unavailable"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
