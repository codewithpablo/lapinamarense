'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { isStaff } from '@/lib/roles';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DataTable } from '@/components/ui/data-table';
import { Loader2, ArrowRight, ShoppingBag, ChevronDown, Check } from 'lucide-react';
import Loader from '@/components/ui/loader';

interface OrderItem {
  product: { name: string; image_url?: string };
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: number;
  status: string;
  total_amount: number;
  delivery_address: string;
  phone: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

const STATUS: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pendiente',        className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmado',       className: 'bg-blue-100   text-blue-700   border-blue-200'   },
  preparing: { label: 'En preparación',   className: 'bg-orange-100 text-orange-700 border-orange-200' },
  delivered: { label: 'Entregado',        className: 'bg-green-100  text-green-700  border-green-200'  },
  cancelled: { label: 'Cancelado',        className: 'bg-red-100    text-red-700    border-red-200'    },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  return <Badge className={`${s.className} border text-xs font-medium`}>{s.label}</Badge>;
}

function StatusChanger({ order, onUpdate }: { order: Order; onUpdate: (id: number, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const s = STATUS[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-600 border-gray-200' };

  const handleSelect = async (newStatus: string) => {
    if (newStatus === order.status) { setOpen(false); return; }
    setSaving(true);
    try {
      await ordersAPI.updateStatus(order.id, newStatus);
      onUpdate(order.id, newStatus);
    } catch {}
    finally { setSaving(false); setOpen(false); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-opacity hover:opacity-80 ${s.className}`}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : s.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        {Object.entries(STATUS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-gray-50 transition-colors"
          >
            <span className={`px-2 py-0.5 rounded-full border font-medium ${val.className}`}>{val.label}</span>
            {order.status === key && <Check className="h-3.5 w-3.5 text-green-600" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function TicketPine() {
  return (
    <svg width="34" height="42" viewBox="0 0 72 90" fill="none" aria-hidden="true">
      <rect x="33" y="68" width="6" height="16" rx="1.5" className="fill-amber-700" />
      <path d="M36 62 L12 62 Q16 56 22 54 L18 54 Q22 48 28 46" className="stroke-green-900 fill-green-800/90" />
      <path d="M36 62 L60 62 Q56 56 50 54 L54 54 Q50 48 44 46" className="stroke-green-900 fill-green-800/90" />
      <path d="M36 46 L16 50 Q20 44 24 42 L20 42 Q24 36 30 34" className="stroke-green-800 fill-green-700/90" />
      <path d="M36 46 L56 50 Q52 44 48 42 L52 42 Q48 36 42 34" className="stroke-green-800 fill-green-700/90" />
      <path d="M36 34 L22 38 Q26 32 30 30 L26 30 Q30 24 34 22" className="stroke-green-700 fill-green-600/90" />
      <path d="M36 34 L50 38 Q46 32 42 30 L46 30 Q42 24 38 22" className="stroke-green-700 fill-green-600/90" />
      <path d="M36 8 L28 22 Q32 18 36 20 Q40 18 44 22 Z" className="fill-green-600" />
      <line x1="36" y1="8" x2="36" y2="68" className="stroke-[2.5] stroke-amber-700" />
    </svg>
  );
}

export default function OrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    ordersAPI.getAll()
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleStatusUpdate = (id: number, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CustomerSidebar />

      <main className="flex-1 p-4 lg:p-6 pt-[4.5rem] lg:pt-6">
        <div className="max-w-5xl mx-auto">

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis Pedidos</h1>
              {!loading && (
                <p className="text-xs text-gray-400 mt-0.5">{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} en total</p>
              )}
            </div>
          </div>

          {loading ? (
            <Loader />

          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <ShoppingBag className="h-7 w-7 text-gray-300" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">No tenés pedidos aún</h2>
              <p className="text-sm text-gray-500 mb-5">Explorá el catálogo y realizá tu primera compra</p>
              <Button className="bg-green-800 hover:bg-green-700 text-white h-9 text-sm" onClick={() => router.push('/products')}>
                Ir a la tienda <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

          ) : (
            <DataTable
              data={orders}
              getRowKey={(o) => o.id}
              onRowClick={(o) => setSelected(o)}
              columns={[
                {
                  key: 'id', header: '#', className: 'w-16',
                  cell: (order) => <span className="font-mono text-xs text-gray-400">{order.id}</span>,
                },
                {
                  key: 'fecha', header: 'Fecha',
                  cell: (order) => (
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  ),
                },
                {
                  key: 'productos', header: 'Productos', hideOnMobile: true,
                  cell: (order) => (
                    <div className="max-w-[180px]">
                      <p className="text-xs text-gray-700 truncate">{order.items.map(i => i.product.name).join(', ')}</p>
                      <p className="text-[10px] text-gray-400">{order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}</p>
                    </div>
                  ),
                },
                {
                  key: 'estado', header: 'Estado', stopClick: true,
                  cell: (order) => isStaff(user?.role)
                    ? <StatusChanger order={order} onUpdate={handleStatusUpdate} />
                    : <StatusBadge status={order.status} />,
                },
                {
                  key: 'total', header: 'Total', align: 'right',
                  cell: (order) => (
                    <span className="font-semibold text-xs text-gray-900 whitespace-nowrap">
                      ${Number(order.total_amount).toLocaleString('es-AR')}
                    </span>
                  ),
                },
                {
                  key: 'ver', header: '', align: 'right', className: 'w-8',
                  cell: () => <ArrowRight className="h-4 w-4 text-gray-300 inline-block" />,
                },
              ]}
            />
          )}
        </div>
      </main>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-[420px] p-0 gap-0 border-0 bg-transparent shadow-none [&>button]:top-2 [&>button]:right-2 [&>button]:text-gray-400">
          {selected && (
            <div className="bg-white text-gray-800 font-mono flex flex-col max-h-[88vh]" style={{ filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.22))' }}>
              <DialogTitle className="sr-only">Comprobante del pedido #{selected.id}</DialogTitle>

              <div className="px-6 pt-5 pb-4 overflow-y-auto min-h-0">
                {/* Logo */}
                <div className="flex flex-col items-center text-center gap-0.5">
                  <TicketPine />
                  <p className="text-xl font-bold tracking-[0.18em] text-green-900 mt-1.5">LA PINAMARENSE</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-[0.15em]">Fiambres · Picadas · Combos</p>
                </div>
                <div className="text-center text-[11px] text-gray-500 leading-relaxed mt-2.5">
                  <p>Resistencia · B° España, Mz 79, Local 8</p>
                  <p>Fontana · Av. Alvear 3500</p>
                  <p>WhatsApp 3624-219435</p>
                </div>

                <div className="border-t border-dashed border-gray-300 my-3" />

                {/* Datos del comprobante */}
                <div className="text-[13px] space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Comprobante</span><span className="font-bold">N° {String(selected.id).padStart(6, '0')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span>{new Date(selected.created_at).toLocaleDateString('es-AR')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Hora</span><span>{new Date(selected.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className="uppercase font-semibold">{STATUS[selected.status]?.label ?? selected.status}</span></div>
                  {user && (
                    <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="truncate ml-2 max-w-[55%] text-right">{`${user.first_name} ${user.last_name}`.trim() || user.username}</span></div>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-300 my-3" />

                {/* Items */}
                <div className="flex text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">
                  <span className="flex-1">Descripción</span>
                  <span className="w-24 text-right">Importe</span>
                </div>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="text-[13px]">
                      <p className="line-clamp-1 text-gray-800">{item.product.name}</p>
                      <div className="flex text-gray-500">
                        <span className="flex-1">{item.quantity} x ${Number(item.price).toLocaleString('es-AR')}</span>
                        <span className="w-24 text-right text-gray-800 font-medium">${Number(item.subtotal).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-300 my-3" />

                {/* Totales */}
                <div className="text-[13px] space-y-1">
                  <div className="flex justify-between text-gray-500"><span>Artículos</span><span>{selected.items.reduce((n, it) => n + it.quantity, 0)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Envío</span><span>GRATIS</span></div>
                </div>
                <div className="flex justify-between items-baseline mt-2.5 pt-2.5 border-t-2 border-double border-gray-400">
                  <span className="text-lg font-bold">TOTAL</span>
                  <span className="text-xl font-extrabold">${Number(selected.total_amount).toLocaleString('es-AR')}</span>
                </div>

                <div className="border-t border-dashed border-gray-300 my-3" />

                {/* Entrega */}
                <div className="text-[12px] text-gray-600 space-y-1">
                  <p className="break-words"><span className="text-gray-400">▸ Entrega: </span>{selected.delivery_address}</p>
                  <p><span className="text-gray-400">▸ Tel: </span>{selected.phone}</p>
                  {selected.notes && <p className="break-words"><span className="text-gray-400">▸ Nota: </span>{selected.notes}</p>}
                </div>

                <div className="border-t border-dashed border-gray-300 my-3" />

                {/* Pie */}
                <p className="text-center text-[13px] font-semibold text-gray-700">¡Gracias por tu compra!</p>
                <p className="text-center text-[11px] text-gray-400 mt-1">@lapinamarense · Comprobante no válido como factura</p>

                {/* Código de barras */}
                <div className="mt-3 flex flex-col items-center">
                  <div className="flex items-end gap-[1px] h-9">
                    {Array.from({ length: 50 }, (_, i) => {
                      const w = ((selected.id * 7 + i * 31) % 3) + 1;
                      return <div key={i} className="bg-gray-900 h-full" style={{ width: `${w}px` }} />;
                    })}
                  </div>
                  <p className="text-[11px] tracking-[0.35em] text-gray-500 mt-1.5">{`7790${String(selected.id).padStart(8, '0')}`}</p>
                </div>
              </div>

              {/* Borde inferior dentado (como cortado del rollo) */}
              <div
                className="w-full h-2.5 shrink-0"
                style={{
                  backgroundImage: 'linear-gradient(45deg, transparent 50%, #fff 50%), linear-gradient(-45deg, transparent 50%, #fff 50%)',
                  backgroundSize: '10px 10px',
                  backgroundRepeat: 'repeat-x',
                  backgroundPosition: 'top',
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

