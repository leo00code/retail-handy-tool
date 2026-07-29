import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Unit = "unidad" | "kg";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number; // por unidad o por kg según `unit`
  stock: number; // unidades o kilos
  unit: Unit;
};

export type CartLine = { productId: string; qty: number };

export type Employee = { id: string; name: string };

export type Sale = {
  id: string;
  at: string; // ISO
  total: number;
  items: { productId: string; name: string; qty: number; price: number; unit: Unit }[];
  payment: "efectivo" | "tarjeta" | "transferencia";
  employeeId: string;
  employeeName: string;
};

export const roundQty = (n: number, unit: Unit) =>
  unit === "kg" ? Math.round(n * 1000) / 1000 : Math.round(n);

export const formatQty = (n: number, unit: Unit) =>
  unit === "kg" ? `${n.toLocaleString("es-CL", { maximumFractionDigits: 3 })} kg` : `${n} u.`;

const SEED: Product[] = [
  { id: "p1", name: "Leche entera 1L", category: "Lácteos", price: 1290, stock: 24, unit: "unidad" },
  { id: "p2", name: "Pan de molde", category: "Panadería", price: 2190, stock: 12, unit: "unidad" },
  { id: "p3", name: "Huevos x12", category: "Abarrotes", price: 3490, stock: 18, unit: "unidad" },
  { id: "p4", name: "Arroz 1kg", category: "Abarrotes", price: 1590, stock: 30, unit: "unidad" },
  { id: "p5", name: "Fideos 400g", category: "Abarrotes", price: 990, stock: 27, unit: "unidad" },
  { id: "p6", name: "Aceite 900ml", category: "Abarrotes", price: 2890, stock: 9, unit: "unidad" },
  { id: "p7", name: "Bebida cola 1.5L", category: "Bebidas", price: 1990, stock: 21, unit: "unidad" },
  { id: "p8", name: "Agua mineral 1.5L", category: "Bebidas", price: 1190, stock: 33, unit: "unidad" },
  { id: "p9", name: "Café instantáneo", category: "Abarrotes", price: 4590, stock: 6, unit: "unidad" },
  { id: "p10", name: "Queso laminado 250g", category: "Lácteos", price: 3990, stock: 8, unit: "unidad" },
  { id: "p11", name: "Yogurt pack x4", category: "Lácteos", price: 2790, stock: 14, unit: "unidad" },
  { id: "p12", name: "Papas fritas 200g", category: "Snacks", price: 2290, stock: 16, unit: "unidad" },
  { id: "p13", name: "Chocolate barra", category: "Snacks", price: 1090, stock: 40, unit: "unidad" },
  { id: "p14", name: "Detergente 1L", category: "Limpieza", price: 3290, stock: 7, unit: "unidad" },
  { id: "p15", name: "Papel higiénico x4", category: "Limpieza", price: 2690, stock: 11, unit: "unidad" },
  { id: "p16", name: "Jabón de manos", category: "Limpieza", price: 1890, stock: 13, unit: "unidad" },
  { id: "p17", name: "Plátano", category: "Frutas y verduras", price: 1490, stock: 18.5, unit: "kg" },
  { id: "p18", name: "Manzana roja", category: "Frutas y verduras", price: 1890, stock: 12.4, unit: "kg" },
  { id: "p19", name: "Tomate", category: "Frutas y verduras", price: 1290, stock: 9.8, unit: "kg" },
  { id: "p20", name: "Papa", category: "Frutas y verduras", price: 990, stock: 40, unit: "kg" },
  { id: "p21", name: "Cebolla", category: "Frutas y verduras", price: 890, stock: 22.3, unit: "kg" },
  { id: "p22", name: "Palta Hass", category: "Frutas y verduras", price: 4990, stock: 6.2, unit: "kg" },
  { id: "p23", name: "Zanahoria", category: "Frutas y verduras", price: 790, stock: 15, unit: "kg" },
  { id: "p24", name: "Naranja", category: "Frutas y verduras", price: 1190, stock: 11.6, unit: "kg" },
];


const EMPLOYEE_SEED: Employee[] = [
  { id: "e1", name: "Camila" },
  { id: "e2", name: "Matías" },
];

type Ctx = {
  products: Product[];
  cart: CartLine[];
  sales: Sale[];
  employees: Employee[];
  activeEmployeeId: string | null;
  activeEmployee: Employee | null;
  setActiveEmployeeId: (id: string | null) => void;
  addEmployee: (name: string) => void;
  removeEmployee: (id: string) => void;
  addToCart: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  checkout: (payment: Sale["payment"]) => Sale | null;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id">>) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  removeProduct: (id: string) => void;
};

const PosContext = createContext<Ctx | null>(null);

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function PosProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(SEED);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEE_SEED);
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = load("pos.products", SEED);
    setProducts(stored.map((p) => ({ ...p, unit: p.unit === "kg" ? "kg" : "unidad" })));
    setSales(load("pos.sales", [] as Sale[]));
    const emp = load("pos.employees", EMPLOYEE_SEED);
    setEmployees(emp);
    const active = load<string | null>("pos.activeEmployee", null);
    setActiveEmployeeId(emp.some((e) => e.id === active) ? active : (emp[0]?.id ?? null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("pos.products", JSON.stringify(products));
  }, [products, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("pos.sales", JSON.stringify(sales));
  }, [sales, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("pos.employees", JSON.stringify(employees));
  }, [employees, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("pos.activeEmployee", JSON.stringify(activeEmployeeId));
  }, [activeEmployeeId, hydrated]);

  const value = useMemo<Ctx>(() => {
    const cartTotal = cart.reduce((sum, line) => {
      const p = products.find((x) => x.id === line.productId);
      return sum + (p ? p.price * line.qty : 0);
    }, 0);

    const activeEmployee = employees.find((e) => e.id === activeEmployeeId) ?? null;

    return {
      products,
      cart,
      sales,
      employees,
      activeEmployeeId,
      activeEmployee,
      setActiveEmployeeId,
      addEmployee: (name) =>
        setEmployees((prev) => {
          const emp = { id: `e-${Date.now()}`, name };
          setActiveEmployeeId((cur) => cur ?? emp.id);
          return [...prev, emp];
        }),
      removeEmployee: (id) => {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        setActiveEmployeeId((cur) => (cur === id ? null : cur));
      },
      cartTotal,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      addToCart: (id, qty) =>
        setCart((prev) => {
          const p = products.find((x) => x.id === id);
          if (!p) return prev;
          const step = qty ?? (p.unit === "kg" ? 0.5 : 1);
          const found = prev.find((l) => l.productId === id);
          if (found) {
            const next = roundQty(Math.min(found.qty + step, p.stock), p.unit);
            if (next <= found.qty) return prev;
            return prev.map((l) => (l.productId === id ? { ...l, qty: next } : l));
          }
          const next = roundQty(Math.min(step, p.stock), p.unit);
          if (next <= 0) return prev;
          return [...prev, { productId: id, qty: next }];
        }),
      setQty: (id, qty) =>
        setCart((prev) => {
          const p = products.find((x) => x.id === id);
          const max = p ? p.stock : 0;
          const next = roundQty(Math.max(0, Math.min(qty, max)), p?.unit ?? "unidad");
          if (next <= 0) return prev.filter((l) => l.productId !== id);
          return prev.map((l) => (l.productId === id ? { ...l, qty: next } : l));
        }),
      removeFromCart: (id) => setCart((prev) => prev.filter((l) => l.productId !== id)),
      clearCart: () => setCart([]),
      checkout: (payment) => {
        if (cart.length === 0 || !activeEmployee) return null;
        const items = cart.map((l) => {
          const p = products.find((x) => x.id === l.productId)!;
          return { productId: p.id, name: p.name, qty: l.qty, price: p.price, unit: p.unit };
        });

        const sale: Sale = {
          id: `V-${Date.now()}`,
          at: new Date().toISOString(),
          total: items.reduce((s, i) => s + i.price * i.qty, 0),
          items,
          payment,
          employeeId: activeEmployee.id,
          employeeName: activeEmployee.name,
        };
        setProducts((prev) =>
          prev.map((p) => {
            const line = cart.find((l) => l.productId === p.id);
            return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
          }),
        );
        setSales((prev) => [sale, ...prev]);
        setCart([]);
        return sale;
      },
      updateProduct: (id, patch) =>
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      addProduct: (p) => setProducts((prev) => [{ ...p, id: `p-${Date.now()}` }, ...prev]),
      removeProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setCart((prev) => prev.filter((l) => l.productId !== id));
      },
    };
  }, [products, cart, sales, employees, activeEmployeeId]);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error("usePos debe usarse dentro de PosProvider");
  return ctx;
}

export const money = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export const isToday = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};
