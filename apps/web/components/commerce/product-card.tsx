import type { ProductCard as ProductCardType } from "@/types/commerce";

// RSC-safe components - no forwardRef to avoid serialization issues with createStreamableUI
export function ProductCard({ name, imageUrl, price }: ProductCardType) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="aspect-square bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="p-2 space-y-1">
        <div className="text-xs font-medium line-clamp-1">{name}</div>
        {price && (
          <div className="text-xs font-semibold text-primary">{price}</div>
        )}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="aspect-square animate-pulse bg-primary/10" />
      <div className="p-2 space-y-1">
        <div className="h-3 w-3/4 animate-pulse rounded bg-primary/10" />
        <div className="h-3 w-12 animate-pulse rounded bg-primary/10" />
      </div>
    </div>
  );
}
