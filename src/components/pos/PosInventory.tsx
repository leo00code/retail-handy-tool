import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePos, money } from "@/lib/pos-store";

export function PosInventory() {
  const { products, updateProduct, addProduct, removeProduct } = usePos();
  const [form, setForm] = useState({ name: "", category: "", price: "", stock: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Ingresa el nombre del producto");
    addProduct({
      name: form.name.trim(),
      category: form.category.trim() || "General",
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
    });
    setForm({ name: "", category: "", price: "", stock: "" });
    toast.success("Producto agregado al inventario");
  };

  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div className="space-y-6">
      {lowStock.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent bg-accent/15 p-4 text-sm">
          <AlertTriangle className="size-4 text-accent-foreground" />
          <span className="font-medium text-accent-foreground">Stock bajo:</span>
          {lowStock.map((p) => (
            <Badge key={p.id} variant="outline">
              {p.name} ({p.stock})
            </Badge>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <Input
          placeholder="Nombre del producto"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          placeholder="Categoría"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Precio"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <Button type="submit">
          <Plus className="size-4" /> Agregar
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Producto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3 w-32">Precio</th>
              <th className="p-3 w-44">Stock</th>
              <th className="p-3 w-28 text-right">Valor</th>
              <th className="p-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.category}</td>
                <td className="p-3">
                  <Input
                    type="number"
                    min={0}
                    value={p.price}
                    onChange={(e) => updateProduct(p.id, { price: Number(e.target.value) || 0 })}
                    className="h-8"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8"
                      onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })}
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={p.stock}
                      onChange={(e) =>
                        updateProduct(p.id, { stock: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="h-8 w-20"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8"
                      onClick={() => updateProduct(p.id, { stock: p.stock + 1 })}
                    >
                      +
                    </Button>
                  </div>
                </td>
                <td className="p-3 text-right tabular-nums">{money(p.price * p.stock)}</td>
                <td className="p-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar «{p.name}»?</AlertDialogTitle>
                        <AlertDialogDescription>
                          El producto dejará de aparecer en la caja y en el inventario.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            removeProduct(p.id);
                            toast.success("Producto eliminado");
                          }}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
