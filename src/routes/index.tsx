import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PosProvider, usePos, money, isToday } from "@/lib/pos-store";
import { PosSale } from "@/components/pos/PosSale";
import { PosInventory } from "@/components/pos/PosInventory";
import { PosReport } from "@/components/pos/PosReport";
import { PosEmployees } from "@/components/pos/PosEmployees";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minimarket POS — Caja, inventario y reportes" },
      {
        name: "description",
        content:
          "Sistema interno para empleados del minimarket: cobra ventas con carrito, controla el stock y revisa el reporte diario.",
      },
      { property: "og:title", content: "Minimarket POS — Caja, inventario y reportes" },
      {
        property: "og:description",
        content: "Punto de venta interno: carrito, total de ventas del día y edición de inventario.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PosProvider>
      <PosPage />
    </PosProvider>
  ),
});

function PosPage() {
  const { sales, cartCount, cartTotal, activeEmployee } = usePos();
  const todayTotal = sales.filter((s) => isToday(s.at)).reduce((s, v) => s + v.total, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Minimarket El Rincón</h1>
              <p className="text-xs text-muted-foreground">Panel interno · uso exclusivo del personal</p>
            </div>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">En caja</p>
              <p className="font-semibold">{activeEmployee?.name ?? "Sin asignar"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Venta actual</p>
              <p className="font-semibold tabular-nums">
                {money(cartTotal)} <span className="text-xs text-muted-foreground">({cartCount})</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total del día</p>
              <p className="font-semibold tabular-nums text-primary">{money(todayTotal)}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="venta">
          <TabsList className="mb-6">
            <TabsTrigger value="venta">Caja</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="empleados">Empleados</TabsTrigger>
            <TabsTrigger value="reporte">Reporte del día</TabsTrigger>
          </TabsList>
          <TabsContent value="venta">
            <PosSale />
          </TabsContent>
          <TabsContent value="inventario">
            <PosInventory />
          </TabsContent>
          <TabsContent value="empleados">
            <PosEmployees />
          </TabsContent>
          <TabsContent value="reporte">
            <PosReport />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
