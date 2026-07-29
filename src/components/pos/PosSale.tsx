import { useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePos, money, formatQty, type Sale, type Product } from "@/lib/pos-store";
import { PosReceipt } from "@/components/pos/PosReceipt";



export function PosSale() {
  const {
    products,
    cart,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    cartTotal,
    checkout,
    employees,
    activeEmployeeId,
    setActiveEmployeeId,
  } = usePos();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [weighing, setWeighing] = useState<Product | null>(null);
  const [weightInput, setWeightInput] = useState("");

  const confirmWeight = (kg: number) => {
    if (!weighing) return;
    if (!Number.isFinite(kg) || kg <= 0) return toast.error("Ingresa un peso válido");
    if (kg > weighing.stock)
      return toast.error(`Solo quedan ${formatQty(weighing.stock, "kg")} de ${weighing.name}`);
    addToCart(weighing.id, kg);
    setWeighing(null);
    setWeightInput("");
  };



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
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    if (!activeEmployeeId) {
      toast.error("Selecciona el empleado que realiza la venta");
      return;
    }
    const sale = checkout(method);
    if (!sale) {
      toast.error("No se pudo registrar la venta");
      return;
    }
    setLastSale(sale);
    setReceiptOpen(true);
    toast.success(`Venta ${sale.id} cobrada por ${sale.employeeName}`, {
      description: `${money(sale.total)} en ${method}`,
    });
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
                if (p.stock <= 0) return toast.error(`${p.name} sin stock`);
                if (p.unit === "kg") {
                  setWeighing(p);
                  setWeightInput("");
                  return;
                }
                addToCart(p.id);
              }}
              disabled={p.stock <= 0}
              className="group flex h-full flex-col justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.category}</p>
                <p className="mt-1 font-medium leading-snug text-card-foreground">{p.name}</p>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <span className="text-lg font-semibold text-primary">
                  {money(p.price)}
                  {p.unit === "kg" && (
                    <span className="text-xs font-normal text-muted-foreground"> /kg</span>
                  )}
                </span>
                <Badge
                  variant={p.stock <= (p.unit === "kg" ? 3 : 5) ? "destructive" : "secondary"}
                >
                  {formatQty(p.stock, p.unit)}
                </Badge>
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
          <div className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Empleado en caja</p>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Agrega empleados en la pestaña «Empleados».
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {employees.map((e) => (
                  <Button
                    key={e.id}
                    size="sm"
                    variant={e.id === activeEmployeeId ? "default" : "outline"}
                    onClick={() => setActiveEmployeeId(e.id)}
                  >
                    {e.name}
                  </Button>
                ))}
              </div>
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
                const step = p.unit === "kg" ? 0.1 : 1;
                return (
                  <div key={line.productId} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {money(p.price)}
                        {p.unit === "kg" ? "/kg" : ""} · subtotal {money(p.price * line.qty)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7"
                        onClick={() => setQty(p.id, line.qty - step)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-14 text-center text-xs tabular-nums">
                        {formatQty(line.qty, p.unit)}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7"
                        onClick={() => setQty(p.id, line.qty + step)}
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
            {lastSale && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setReceiptOpen(true)}
              >
                Ver último ticket ({lastSale.id})
              </Button>
            )}
          </div>
        </div>
        <PosReceipt sale={lastSale} open={receiptOpen} onOpenChange={setReceiptOpen} />
      </aside>

      <Dialog open={weighing !== null} onOpenChange={(o) => !o && setWeighing(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{weighing?.name}</DialogTitle>
            <DialogDescription>
              {weighing && `${money(weighing.price)} por kg · disponible ${formatQty(weighing.stock, "kg")}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {[0.25, 0.5, 1, 2].map((kg) => (
              <Button key={kg} variant="outline" size="sm" onClick={() => confirmWeight(kg)}>
                {kg} kg
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              step={0.01}
              autoFocus
              placeholder="Peso en kg"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmWeight(Number(weightInput));
              }}
            />
            <span className="text-sm text-muted-foreground">kg</span>
          </div>
          {weighing && Number(weightInput) > 0 && (
            <p className="text-sm text-muted-foreground">
              Subtotal:{" "}
              <span className="font-semibold text-primary">
                {money(weighing.price * Number(weightInput))}
              </span>
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeighing(null)}>
              Cancelar
            </Button>
            <Button onClick={() => confirmWeight(Number(weightInput))}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
