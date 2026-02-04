import { CartSummary } from "@/lib/commerce";

export function CartView({ cart }: { cart: CartSummary }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Cart
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {cart.id}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {cart.lineItems.length === 0 ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Your cart is empty.
          </div>
        ) : (
          cart.lineItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-zinc-100 p-2 dark:border-zinc-800"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-12 w-12 rounded-md object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 text-[10px] text-zinc-400 dark:bg-zinc-800">
                  No image
                </div>
              )}
              <div className="flex flex-1 flex-col">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Qty {item.quantity}
                </div>
              </div>
              <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                <div>{item.price ?? " "}</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.total ?? " "}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
        <span className="text-zinc-500 dark:text-zinc-400">Total</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {cart.total ?? "Pending"}
        </span>
      </div>
    </div>
  );
}
