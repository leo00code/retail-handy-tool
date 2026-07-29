import { useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePos, money, type Sale } from "@/lib/pos-store";

export function PosSale() {
  const { products, cart, addToCart, setQty, removeFromCart, clearCart, cartTotal, checkout } = usePos();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const visible = products.filter(
    (p) =>
      (category === "Todas" || p.category === category) &&
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const pay = (method: Sale["payment"]) => {
    const sale = checkout(method);
    if (!sale) {
      toast.error("El carrito está vacío");
      return;
    }
    toast.success(`Venta ${sale.id} cobrada`, { description: `${money(sale.total)} en ${method}` });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={c === category ? "default" : "outline"}
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (p.stock < 1) return toast.error(`${p.name} sin stock`);
                addToCart(p.id);
              }}
              disabled={p.stock < 1}
              className="group flex h-full flex-col justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.category}</p>
                <p className="mt-1 font-medium leading-snug text-card-foreground">{p.name}</p>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-lg font-semibold text-primary">{money(p.price)}</span>
                <Badge variant={p.stock <= 5 ? "destructive" : "secondary"}>{p.stock} u.</Badge>
              </div>
            </button>
          ))}
          {visible.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No se encontraron productos.
            </p>
          )}
        </div>
      </section>

      <aside className="lg:sticky lg:top-6 lg:h-fit">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShoppingCart className="size-4" /> Carrito
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Vaciar
              </Button>
            )}
          </div>
          <Separator />
          <ScrollArea className="max-h-[46vh]">
            <div className="space-y-3 p-4">
              {cart.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Toca un producto para agregarlo.
                </p>
              )}
              {cart.map((line) => {
                const p = products.find((x) => x.id === line.productId);
                if (!p) return null;
                return (
                  <div key={line.productId} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {money(p.price)} · subtotal {money(p.price * line.qty)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7"
                        onClick={() => setQty(p.id, line.qty - 1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-sm tabular-nums">{line.qty}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7"
                        onClick={() => setQty(p.id, line.qty + 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => removeFromCart(p.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <Separator />
          <div className="space-y-3 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-bold tabular-nums text-primary">{money(cartTotal)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => pay("efectivo")} disabled={cart.length === 0}>
                Efectivo
              </Button>
              <Button variant="secondary" onClick={() => pay("tarjeta")} disabled={cart.length === 0}>
                Tarjeta
              </Button>
              <Button
                variant="outline"
                onClick={() => pay("transferencia")}
                disabled={cart.length === 0}
              >
                Transf.
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
