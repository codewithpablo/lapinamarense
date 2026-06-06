'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, ArrowRight, MapPin, Phone, FileText, ShoppingBag, ChevronDown, Check } from 'lucide-react';
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

export default function OrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
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

      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-5xl mx-auto">

          <div className="mb-4 flex items-center justify-between">
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
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                    <TableHead className="pl-5 py-2.5 w-16 text-xs font-semibold text-gray-500">#</TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-gray-500">Fecha</TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-gray-500">Productos</TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-gray-500">Estado</TableHead>
                    <TableHead className="py-2.5 text-xs font-semibold text-gray-500">Total</TableHead>
                    <TableHead className="pr-5 py-2.5 text-right text-xs font-semibold text-gray-500"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id} className="hover:bg-gray-50/60 border-b border-gray-50 last:border-0">
                      <TableCell className="pl-5 py-2.5 font-mono text-xs text-gray-400">
                        {order.id}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="py-2.5 max-w-[180px]">
                        <p className="text-xs text-gray-700 truncate">
                          {order.items.map(i => i.product.name).join(', ')}
                        </p>
                        <p className="text-[10px] text-gray-400">{order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}</p>
                      </TableCell>
                      <TableCell className="py-2.5">
                        {user?.is_store_owner
                          ? <StatusChanger order={order} onUpdate={handleStatusUpdate} />
                          : <StatusBadge status={order.status} />
                        }
                      </TableCell>
                      <TableCell className="py-2.5 font-semibold text-xs text-gray-900 whitespace-nowrap">
                        ${Number(order.total_amount).toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell className="pr-5 py-2.5 text-right">
                        <button
                          className="text-xs text-green-700 hover:text-green-900 font-medium hover:underline"
                          onClick={() => setSelected(order)}
                        >
                          Ver detalle
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Pedido #{selected?.id}</span>
              {selected && <StatusBadge status={selected.status} />}
            </DialogTitle>
            {selected && (
              <p className="text-xs text-gray-400 font-normal mt-0.5">
                {new Date(selected.created_at).toLocaleDateString('es-AR', { dateStyle: 'long' })} · {new Date(selected.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </DialogHeader>

          {selected && (
            <div className="space-y-5 pt-1">

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Productos</p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.product.image_url
                          ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                          : <Package className="h-4 w-4 text-gray-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-400">${Number(item.price).toLocaleString('es-AR')} c/u · x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                        ${Number(item.subtotal).toLocaleString('es-AR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-gray-500">Envío</span>
                <span className="text-sm text-green-600 font-medium">Gratis</span>
              </div>
              <div className="flex justify-between items-center -mt-2">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">${Number(selected.total_amount).toLocaleString('es-AR')}</span>
              </div>

              {/* Delivery info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Entrega</p>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{selected.delivery_address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{selected.phone}</span>
                </div>
                {selected.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{selected.notes}</span>
                  </div>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

