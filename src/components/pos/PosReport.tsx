import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePos, money, isToday } from "@/lib/pos-store";

export function PosReport() {
  const { sales } = usePos();
  const today = sales.filter((s) => isToday(s.at));
  const total = today.reduce((s, v) => s + v.total, 0);
  const units = today.reduce((s, v) => s + v.items.reduce((n, i) => n + i.qty, 0), 0);
  const avg = today.length ? total / today.length : 0;

  const byProduct = new Map<string, { name: string; qty: number; total: number }>();
  today.forEach((s) =>
    s.items.forEach((i) => {
      const cur = byProduct.get(i.productId) ?? { name: i.name, qty: 0, total: 0 };
      byProduct.set(i.productId, {
        name: i.name,
        qty: cur.qty + i.qty,
        total: cur.total + i.qty * i.price,
      });
    }),
  );
  const top = [...byProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const byEmployee = new Map<string, { name: string; sales: number; units: number; total: number }>();
  today.forEach((s) => {
    const cur = byEmployee.get(s.employeeId) ?? { name: s.employeeName, sales: 0, units: 0, total: 0 };
    byEmployee.set(s.employeeId, {
      name: s.employeeName,
      sales: cur.sales + 1,
      units: cur.units + s.items.reduce((n, i) => n + i.qty, 0),
      total: cur.total + s.total,
    });
  });
  const employeeRows = [...byEmployee.values()].sort((a, b) => b.total - a.total);

  const stats = [
    { label: "Total vendido hoy", value: money(total) },
    { label: "Ventas realizadas", value: String(today.length) },
    { label: "Unidades vendidas", value: String(units) },
    { label: "Ticket promedio", value: money(avg) },
  ];

  const exportCsv = () => {
    const rows = [
      ["Venta", "Hora", "Empleado", "Pago", "Total"],
      ...today.map((s) => [
        s.id,
        new Date(s.at).toLocaleTimeString("es-CL"),
        s.employeeName,
        s.payment,
        String(s.total),
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4">
            <h2 className="font-semibold">Ventas de hoy</h2>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={today.length === 0}>
              Exportar CSV
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Venta</th>
                <th className="p-3">Hora</th>
                <th className="p-3">Empleado</th>
                <th className="p-3">Detalle</th>
                <th className="p-3">Pago</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {today.map((s) => (
                <tr key={s.id} className="border-t border-border align-top">
                  <td className="p-3 font-medium">{s.id}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(s.at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-3">{s.employeeName}</td>
                  <td className="p-3 text-muted-foreground">
                    {s.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{s.payment}</Badge>
                  </td>
                  <td className="p-3 text-right font-semibold tabular-nums">{money(s.total)}</td>
                </tr>
              ))}
              {today.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    Aún no hay ventas registradas hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Más vendidos hoy</h2>
          <ul className="mt-4 space-y-3">
            {top.map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{t.name}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {t.qty} u. · {money(t.total)}
                </span>
              </li>
            ))}
            {top.length === 0 && <li className="text-sm text-muted-foreground">Sin datos todavía.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
