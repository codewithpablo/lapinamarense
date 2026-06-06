'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ordersAPI, productsAPI } from '@/lib/api';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import Sidebar from '@/components/admin/Sidebar';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  Search,
} from 'lucide-react';

const LineChart = dynamic(() => import('@/components/charts/ClientCharts').then(m => ({ default: m.Line })), { ssr: false });

interface Order {
  id: number;
  status: string;
  total_amount: number;
  user: { username: string };
  delivery_address: string;
  phone: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category_name?: string;
  image_url?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const MOCK_ORDERS: Order[] = [
  { id: 101, status: 'delivered',  total_amount: 4850,  user: { username: 'sofia_m' },    delivery_address: 'Av. Constitución 123', phone: '2254-401234', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 100, status: 'preparing',  total_amount: 2340,  user: { username: 'carlos_r' },   delivery_address: 'Calle 3 N°456',        phone: '2254-402345', created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: 99,  status: 'confirmed',  total_amount: 7120,  user: { username: 'laura_v' },    delivery_address: 'Mitre 789',            phone: '2254-403456', created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: 98,  status: 'pending',    total_amount: 1560,  user: { username: 'diego_p' },    delivery_address: 'San Martín 321',       phone: '2254-404567', created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
  { id: 97,  status: 'delivered',  total_amount: 9200,  user: { username: 'ana_flores' }, delivery_address: 'Belgrano 654',         phone: '2254-405678', created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString() },
  { id: 96,  status: 'cancelled',  total_amount: 3400,  user: { username: 'martin_g' },   delivery_address: 'Rivadavia 987',        phone: '2254-406789', created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString() },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 1,  name: 'Yerba Mate 1kg',         price: 2800, stock: 45, category_name: 'Infusiones' },
  { id: 2,  name: 'Arroz Largo Fino 1kg',   price: 1200, stock: 3,  category_name: 'Almacén' },
  { id: 3,  name: 'Aceite de Girasol 1L',   price: 1850, stock: 28, category_name: 'Almacén' },
  { id: 4,  name: 'Azúcar 1kg',             price: 950,  stock: 7,  category_name: 'Almacén' },
  { id: 5,  name: 'Fideos Spaghetti 500g',  price: 780,  stock: 60, category_name: 'Pastas' },
  { id: 6,  name: 'Leche Entera 1L',        price: 1100, stock: 0,  category_name: 'Lácteos' },
  { id: 7,  name: 'Harina 000 1kg',         price: 850,  stock: 32, category_name: 'Almacén' },
  { id: 8,  name: 'Café Molido 250g',       price: 2100, stock: 4,  category_name: 'Infusiones' },
  { id: 9,  name: 'Jabón en Polvo 1kg',     price: 3200, stock: 18, category_name: 'Limpieza' },
  { id: 10, name: 'Sal Fina 1kg',           price: 450,  stock: 50, category_name: 'Almacén' },
  { id: 11, name: 'Pan Lactal Blanco',      price: 1650, stock: 0,  category_name: 'Panadería' },
  { id: 12, name: 'Manteca 200g',           price: 1900, stock: 2,  category_name: 'Lácteos' },
  { id: 13, name: 'Galletitas Crackers',    price: 980,  stock: 0,  category_name: 'Almacén' },
  { id: 14, name: 'Queso Cremoso 1kg',      price: 4200, stock: 1,  category_name: 'Lácteos' },
  { id: 15, name: 'Papel Higiénico x4',     price: 2400, stock: 6,  category_name: 'Limpieza' },
  { id: 16, name: 'Lavandina 1L',           price: 650,  stock: 8,  category_name: 'Limpieza' },
  { id: 17, name: 'Dulce de Leche 400g',    price: 1750, stock: 5,  category_name: 'Almacén' },
  { id: 18, name: 'Cerveza Lata 473ml',     price: 1200, stock: 0,  category_name: 'Bebidas' },
];

const MOCK_TOP_PRODUCTS = [
  { ...MOCK_PRODUCTS[0], sold: 87,  revenue: 243600 },
  { ...MOCK_PRODUCTS[4], sold: 74,  revenue: 57720  },
  { ...MOCK_PRODUCTS[2], sold: 61,  revenue: 112850 },
  { ...MOCK_PRODUCTS[8], sold: 55,  revenue: 176000 },
  { ...MOCK_PRODUCTS[6], sold: 48,  revenue: 40800  },
];

const G = { dark:'#166534', mid:'#16a34a', soft:'#4ade80', pale:'#86efac', mist:'#bbf7d0', fog:'#dcfce7', sage:'#6ee7b7', teal:'#2dd4bf' };
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function AdminPage() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [searchOrders, setSearchOrders] = useState('');
  const [searchStock, setSearchStock]   = useState('');
  const [searchTop, setSearchTop]       = useState('');
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const { user } = useAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll(),
        api.get('/auth/users/').catch(() => ({ data: [] })),
      ]);
      setOrders(ordersRes.data?.length ? ordersRes.data : MOCK_ORDERS);
      setProducts(productsRes.data?.length ? productsRes.data : MOCK_PRODUCTS);
      setCustomerCount((usersRes.data as any[]).length);
    } catch {
      setOrders(MOCK_ORDERS);
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const advanceOrder = async () => {
    if (!confirmOrder) return;
    setUpdatingOrder(confirmOrder.id);
    setConfirmOrder(null);
    try {
      await ordersAPI.updateStatus(confirmOrder.id, 'delivered');
      setOrders(prev => prev.map(o => o.id === confirmOrder.id ? { ...o, status: 'delivered' } : o));
    } catch { console.error('Error al actualizar pedido'); }
    finally { setUpdatingOrder(null); }
  };

  // ── Metrics ──
  const todaySales = orders
    .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + Number(o.total_amount), 0) || 14070;

  const monthlySales = orders
    .filter(o => { const d = new Date(o.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); })
    .reduce((s, o) => s + Number(o.total_amount), 0) || 284600;

  const realOutOfStock = products.filter(p => p.stock === 0);
  const realLowStock   = products.filter(p => p.stock > 0 && p.stock < 10);
  // Si no hay alertas reales, usar mock para demo
  const outOfStock = realOutOfStock.length > 0 ? realOutOfStock : MOCK_PRODUCTS.filter(p => p.stock === 0);
  const lowStock   = realLowStock.length > 0 ? realLowStock : MOCK_PRODUCTS.filter(p => p.stock > 0 && p.stock < 10);
  const pendingOrders = orders.filter(o => ['pending','confirmed','preparing'].includes(o.status));

  // ── Chart data: ventas diarias (últimos 7 días) ──
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dailySales = last7.map(day =>
    orders.filter(o => new Date(o.created_at).toDateString() === day.toDateString())
      .reduce((s, o) => s + Number(o.total_amount), 0)
  );
  const hasSalesData = dailySales.some(v => v > 0);
  const salesValues = hasSalesData ? dailySales : [8200, 12400, 9800, 15600, 11200, 14070, 13500];

  const lineData = {
    labels: last7.map(d => DAYS[d.getDay()]),
    datasets: [{
      label: 'Ventas ($)', data: salesValues, fill: true,
      borderColor: G.mid, backgroundColor: 'rgba(22,163,74,0.08)',
      pointBackgroundColor: G.mid, pointBorderColor: '#fff', pointBorderWidth: 2,
      pointRadius: 4, pointHoverRadius: 6, tension: 0.45, borderWidth: 2,
    }],
  };
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` $${Number(ctx.raw).toLocaleString('es-AR')}` } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, color: '#b0bec5' } },
      y: { grid: { color: 'rgba(0,0,0,0.035)', drawTicks: false }, border: { display: false }, ticks: { font: { size: 10 }, color: '#b0bec5', padding: 6, callback: (v: any) => `$${(Number(v) / 1000).toFixed(0)}k` } },
    },
  };

  const weekTotal = salesValues.reduce((a, b) => a + b, 0);
  const prevSales = salesValues.length >= 2 ? salesValues[salesValues.length - 2] : 0;
  const lastSales = salesValues[salesValues.length - 1] ?? 0;
  const growthPct = prevSales > 0 ? Math.round(((lastSales - prevSales) / prevSales) * 100) : 0;

  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (loading) {
    const dk = prefersDark;
    return (
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${dk ? 'bg-gradient-to-br from-green-950 via-green-900 to-green-950' : 'bg-white'}`}>
        {/* Circulos difuminados */}
        <div className={`absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse ${dk ? 'bg-green-500/15' : 'bg-green-500/25'}`} />
        <div className={`absolute top-[50%] right-[10%] w-[350px] h-[350px] rounded-full blur-[100px] animate-pulse [animation-delay:0.5s] ${dk ? 'bg-green-400/10' : 'bg-green-400/20'}`} />
        <div className={`absolute bottom-[10%] left-[40%] w-[300px] h-[300px] rounded-full blur-[90px] animate-pulse [animation-delay:1s] ${dk ? 'bg-emerald-500/10' : 'bg-green-500/15'}`} />
        <div className={`absolute top-[30%] right-[30%] w-[250px] h-[250px] rounded-full blur-[80px] animate-pulse [animation-delay:1.5s] ${dk ? 'bg-green-300/5' : 'bg-green-300/15'}`} />

        {/* Grid sutil de fondo */}
        <div className={`absolute inset-0 ${dk ? 'opacity-[0.03]' : 'opacity-[0.04]'}`} style={{ backgroundImage: `radial-gradient(circle, ${dk ? 'white' : '#166534'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="relative">
          {/* Circulos orbitando */}
          <div className="absolute inset-[-20px] animate-spin [animation-duration:3s]">
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full shadow-lg ${dk ? 'bg-green-400 shadow-green-400/60' : 'bg-green-600 shadow-green-600/40'}`} />
          </div>
          <div className="absolute inset-[-20px] animate-spin [animation-duration:4.5s] [animation-direction:reverse]">
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-lg ${dk ? 'bg-emerald-300 shadow-emerald-300/60' : 'bg-green-500 shadow-green-500/40'}`} />
          </div>
          <div className="absolute inset-[-20px] animate-spin [animation-duration:6s]">
            <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full shadow-lg ${dk ? 'bg-green-200 shadow-green-200/60' : 'bg-green-400 shadow-green-400/40'}`} />
          </div>
          {/* Pino estilo logo */}
          <svg width="72" height="90" viewBox="0 0 72 90" fill="none" className="drop-shadow-lg">
            <rect x="33" y="68" width="6" height="16" rx="1.5" className={dk ? 'fill-amber-600' : 'fill-amber-700'} />
            <path d="M36 62 L12 62 Q16 56 22 54 L18 54 Q22 48 28 46" className={`animate-pulse [animation-delay:0.6s] ${dk ? 'stroke-green-800 fill-green-500/90' : 'stroke-green-900 fill-green-800/90'}`} />
            <path d="M36 62 L60 62 Q56 56 50 54 L54 54 Q50 48 44 46" className={`animate-pulse [animation-delay:0.6s] ${dk ? 'stroke-green-800 fill-green-500/90' : 'stroke-green-900 fill-green-800/90'}`} />
            <path d="M36 46 L16 50 Q20 44 24 42 L20 42 Q24 36 30 34" className={`animate-pulse [animation-delay:0.3s] ${dk ? 'stroke-green-700 fill-green-400/90' : 'stroke-green-800 fill-green-700/90'}`} />
            <path d="M36 46 L56 50 Q52 44 48 42 L52 42 Q48 36 42 34" className={`animate-pulse [animation-delay:0.3s] ${dk ? 'stroke-green-700 fill-green-400/90' : 'stroke-green-800 fill-green-700/90'}`} />
            <path d="M36 34 L22 38 Q26 32 30 30 L26 30 Q30 24 34 22" className={`animate-pulse ${dk ? 'stroke-green-600 fill-green-300/90' : 'stroke-green-700 fill-green-600/90'}`} />
            <path d="M36 34 L50 38 Q46 32 42 30 L46 30 Q42 24 38 22" className={`animate-pulse ${dk ? 'stroke-green-600 fill-green-300/90' : 'stroke-green-700 fill-green-600/90'}`} />
            <path d="M36 8 L28 22 Q32 18 36 20 Q40 18 44 22 Z" className={`animate-pulse ${dk ? 'fill-green-300' : 'fill-green-600'}`} />
            <line x1="36" y1="8" x2="36" y2="68" className={`stroke-[2.5] ${dk ? 'stroke-amber-600' : 'stroke-amber-700'}`} />
          </svg>
          </div>

          <div className="text-center">
            <p className={`text-sm font-semibold ${dk ? 'text-white' : 'text-gray-800'}`}>La Pinamarense</p>
            <p className={`text-xs mt-1 animate-pulse ${dk ? 'text-green-400/60' : 'text-gray-400'}`}>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 2×2 chart grid */}
        <main className="flex-1 p-3 lg:p-4 pt-14 lg:pt-4 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-4 overflow-y-auto lg:overflow-hidden min-h-0">

          {/* 1 — Ventas semanales */}
          <Card className="border-0 shadow-sm min-h-[300px] lg:min-h-0 flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1 min-h-0">
              <div className="shrink-0 flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-green-600" /> Ventas semanales
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Últimos 7 días</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${growthPct >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}>
                  {growthPct >= 0 ? '+' : ''}{growthPct}% vs día ant.
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <LineChart data={lineData} options={lineOpts as any} />
              </div>
              <div className="shrink-0 grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                {[
                  { label: 'Hoy', value: `$${todaySales.toLocaleString('es-AR')}` },
                  { label: 'Semana', value: `$${weekTotal.toLocaleString('es-AR')}` },
                  { label: 'Mes', value: `$${monthlySales.toLocaleString('es-AR')}` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-xs font-bold text-gray-800">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2 — Pedidos pendientes: qué preparar/entregar */}
          <Card className="border-0 shadow-sm min-h-[300px] lg:min-h-0 flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1 min-h-0">
              <div className="shrink-0 flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4 text-green-600" /> Pedidos a domicilio
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {pendingOrders.length > 0
                      ? <><span className="text-orange-600 font-semibold">{pendingOrders.length}</span> esperando tu acción</>
                      : 'No hay pedidos pendientes'}
                  </p>
                </div>
              </div>
              <div className="shrink-0 relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                <input type="text" placeholder="Buscar cliente o dirección..." value={searchOrders} onChange={e => setSearchOrders(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50" />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {(pendingOrders.length > 0 ? pendingOrders : orders)
                  .filter(o => o.user.username.toLowerCase().includes(searchOrders.toLowerCase()) || o.delivery_address.toLowerCase().includes(searchOrders.toLowerCase()))
                  .slice(0, 6).map(order => {
                    const isPending = order.status !== 'delivered';
                    const action = isPending ? 'Entregar' : 'Entregado';
                    const actionColor = isPending ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-default';
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                            {order.user.username[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{order.user.username} · ${Number(order.total_amount).toLocaleString('es-AR')}</p>
                            <p className="text-[10px] text-gray-400 truncate">{order.delivery_address}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmOrder(order)}
                          disabled={updatingOrder === order.id || !isPending}
                          className={`text-[10px] font-semibold text-white px-3 py-1.5 rounded-lg shrink-0 transition-colors disabled:opacity-50 ${actionColor}`}
                        >
                          {updatingOrder === order.id ? '...' : action}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* 3 — Stock crítico: qué reponer */}
          <Card className="border-0 shadow-sm min-h-[300px] lg:min-h-0 flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1 min-h-0">
              <div className="shrink-0 flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Reponer urgente
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {outOfStock.length > 0 || lowStock.length > 0
                      ? <><span className="text-red-600 font-semibold">{outOfStock.length}</span> agotados · <span className="text-orange-600 font-semibold">{lowStock.length}</span> por acabarse</>
                      : 'Stock en orden'}
                  </p>
                </div>
              </div>
              <div className="shrink-0 relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                <input type="text" placeholder="Buscar producto..." value={searchStock} onChange={e => setSearchStock(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50" />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {[...outOfStock, ...lowStock]
                  .filter(p => p.name.toLowerCase().includes(searchStock.toLowerCase()) || (p.category_name || '').toLowerCase().includes(searchStock.toLowerCase()))
                  .slice(0, 8).map(product => (
                  <div key={product.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${product.stock === 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-orange-50 hover:bg-orange-100'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${product.stock === 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
                        <Package className={`h-4 w-4 ${product.stock === 0 ? 'text-red-600' : 'text-orange-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {product.stock === 0 ? '⚠ Clientes no pueden comprar' : `Quedan ${product.stock} — reponer pronto`}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] font-medium border ${product.stock === 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                      {product.stock === 0 ? 'Agotado' : `${product.stock} uds`}
                    </Badge>
                  </div>
                ))}
                {outOfStock.length === 0 && lowStock.length === 0 && (
                  <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-8">
                    <Package className="h-8 w-8 mb-2 text-green-300" />
                    <p className="text-sm font-medium text-green-600">Todo abastecido</p>
                    <p className="text-[11px]">No necesitás reponer nada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4 — Más vendidos: qué mantener en stock */}
          <Card className="border-0 shadow-sm min-h-[300px] lg:min-h-0 flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1 min-h-0">
              <div className="shrink-0 flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-green-600" /> Los que más te dejan
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Nunca dejes que se agoten estos</p>
                </div>
              </div>
              <div className="shrink-0 relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                <input type="text" placeholder="Buscar producto..." value={searchTop} onChange={e => setSearchTop(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50" />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {MOCK_TOP_PRODUCTS
                  .filter(p => p.name.toLowerCase().includes(searchTop.toLowerCase()) || (p.category_name || '').toLowerCase().includes(searchTop.toLowerCase()))
                  .map((product, i) => {
                    const stockProduct = products.find(p => p.id === product.id) || product;
                    const stockOk = stockProduct.stock > 10;
                    return (
                      <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="text-lg font-bold text-gray-200 w-6 text-center shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-400">{product.sold} vendidos · ${product.revenue.toLocaleString('es-AR')}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${stockOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {stockOk ? `${stockProduct.stock} uds ✓` : `${stockProduct.stock} uds ⚠`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={!!confirmOrder} onOpenChange={() => setConfirmOrder(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
          {confirmOrder && (
            <>
              <div className="bg-green-900 px-6 py-5 text-white">
                <p className="text-xs uppercase tracking-widest text-green-200 font-semibold mb-1">Confirmar entrega</p>
                <p className="text-2xl font-bold">${Number(confirmOrder.total_amount).toLocaleString('es-AR')}</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold shrink-0">
                    {confirmOrder.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{confirmOrder.user.username}</p>
                    <p className="text-xs text-gray-400">Pedido #{confirmOrder.id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Direccion</p>
                    <p className="text-gray-800 font-medium text-xs mt-0.5">{confirmOrder.delivery_address}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Telefono</p>
                    <p className="text-gray-800 font-medium text-xs mt-0.5">{confirmOrder.phone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Fecha</p>
                    <p className="text-gray-800 font-medium text-xs mt-0.5">{new Date(confirmOrder.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmOrder(null)}>Cancelar</Button>
                  <Button className="flex-1 bg-green-900 hover:bg-green-800" onClick={advanceOrder} disabled={updatingOrder === confirmOrder.id}>
                    {updatingOrder === confirmOrder.id ? 'Entregando...' : 'Confirmar entrega'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
