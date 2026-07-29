import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BUSINESS } from "@/lib/business";
import { money, formatQty, type Sale } from "@/lib/pos-store";

export function PosReceipt({
  sale,
  open,
  onOpenChange,
}: {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!sale) return null;
  const at = new Date(sale.at);
  const units = sale.items.reduce((n, i) => n + i.qty, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="print:hidden">
          <DialogTitle>Ticket de venta</DialogTitle>
          <DialogDescription>Entrega este comprobante al cliente.</DialogDescription>
        </DialogHeader>

        <div
          id="pos-ticket"
          className="rounded-lg border border-dashed border-border bg-card p-4 font-mono text-xs text-card-foreground"
        >
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wide">{BUSINESS.name}</p>
            <p className="text-muted-foreground">{BUSINESS.legalName}</p>
            <p className="text-muted-foreground">RUT {BUSINESS.taxId}</p>
            <p className="text-muted-foreground">{BUSINESS.address}</p>
            <p className="text-muted-foreground">{BUSINESS.city}</p>
            <p className="text-muted-foreground">
              {BUSINESS.phone} · {BUSINESS.email}
            </p>
            <p className="text-muted-foreground">{BUSINESS.hours}</p>
          </div>

          <Separator className="my-3" />

          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Boleta</span>
              <span className="font-semibold">{sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span>{at.toLocaleDateString("es-CL")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora</span>
              <span>{at.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Atendido por</span>
              <span className="font-semibold">{sale.employeeName ?? "Sin asignar"}</span>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="space-y-1">
            {sale.items.map((i) => (
              <div key={i.productId} className="flex justify-between gap-2">
                <span className="min-w-0 flex-1 truncate">
                  {i.unit === "kg" ? `${formatQty(i.qty, i.unit)} ${i.name}` : `${i.qty}× ${i.name}`}
                </span>
                <span className="tabular-nums">{money(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="flex justify-between text-muted-foreground">
            <span>Ítems</span>
            <span className="tabular-nums">{units}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Forma de pago</span>
            <span className="uppercase">{sale.payment}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between text-base font-bold">
            <span>TOTAL</span>
            <span className="tabular-nums">{money(sale.total)}</span>
          </div>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
            {BUSINESS.footer}
          </p>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
