import { useState } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePos, money, isToday } from "@/lib/pos-store";

export function PosEmployees() {
  const { employees, sales, activeEmployeeId, setActiveEmployeeId, addEmployee, removeEmployee } =
    usePos();
  const [name, setName] = useState("");

  const today = sales.filter((s) => isToday(s.at));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Ingresa el nombre del empleado");
    addEmployee(name.trim());
    setName("");
    toast.success("Empleado agregado");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <Input
          className="min-w-48 flex-1"
          placeholder="Nombre del empleado"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit">
          <Plus className="size-4" /> Agregar empleado
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((emp) => {
          const mine = today.filter((s) => s.employeeId === emp.id);
          const total = mine.reduce((s, v) => s + v.total, 0);
          const units = mine.reduce((s, v) => s + v.items.reduce((n, i) => n + i.qty, 0), 0);
          const active = emp.id === activeEmployeeId;
          return (
            <div
              key={emp.id}
              className={`rounded-xl border bg-card p-4 ${active ? "border-primary ring-1 ring-primary" : "border-border"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                    <UserRound className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium leading-tight">{emp.name}</p>
                    {active && (
                      <Badge variant="secondary" className="mt-1">
                        En caja
                      </Badge>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="size-8">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar a {emp.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sus ventas ya registradas se mantienen en el reporte del día.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          removeEmployee(emp.id);
                          toast.success("Empleado eliminado");
                        }}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Vendido hoy</dt>
                  <dd className="font-semibold tabular-nums text-primary">{money(total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ventas</dt>
                  <dd className="tabular-nums">{mine.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Unidades</dt>
                  <dd className="tabular-nums">{units}</dd>
                </div>
              </dl>

              <Button
                className="mt-4 w-full"
                variant={active ? "secondary" : "outline"}
                disabled={active}
                onClick={() => setActiveEmployeeId(emp.id)}
              >
                {active ? "Atendiendo la caja" : "Poner en caja"}
              </Button>
            </div>
          );
        })}
        {employees.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No hay empleados registrados.
          </p>
        )}
      </div>
    </div>
  );
}
