'use client';

import { useEffect, useState } from 'react';
import { ordersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/admin/Sidebar';
import { ShoppingCart, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Loader from '@/components/ui/loader';

interface Order {
  id: number;
  user: { username: string };
  status: string;
  total_amount: number;
  delivery_address: string;
  phone: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100   text-blue-800   border-blue-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100  text-green-800  border-green-200',
  cancelled: 'bg-red-100    text-red-800    border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const MOCK_ORDERS: Order[] = [
  { id: 101, status: 'delivered',  total_amount: 4850, user: { username: 'sofia_m'     }, delivery_address: 'Av. Constitución 123', phone: '2254-401234', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()  },
  { id: 100, status: 'preparing',  total_amount: 2340, user: { username: 'carlos_r'    }, delivery_address: 'Calle 3 N°456',        phone: '2254-402345', created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString()  },
  { id: 99,  status: 'confirmed',  total_amount: 7120, user: { username: 'laura_v'     }, delivery_address: 'Mitre 789',            phone: '2254-403456', created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: 98,  status: 'pending',    total_amount: 1560, user: { username: 'diego_p'     }, delivery_address: 'San Martín 321',       phone: '2254-404567', created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
  { id: 97,  status: 'delivered',  total_amount: 9200, user: { username: 'ana_flores'  }, delivery_address: 'Belgrano 654',         phone: '2254-405678', created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString() },
  { id: 96,  status: 'cancelled',  total_amount: 3400, user: { username: 'martin_g'    }, delivery_address: 'Rivadavia 987',        phone: '2254-406789', created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString() },
  { id: 95,  status: 'delivered',  total_amount: 6100, user: { username: 'pabloalonso' }, delivery_address: 'Libertad 111',         phone: '2254-407890', created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString() },
  { id: 94,  status: 'confirmed',  total_amount: 3850, user: { username: 'sofia_m'     }, delivery_address: 'Av. 9 de Julio 200',   phone: '2254-401234', created_at: new Date(Date.now() - 1000 * 60 * 900).toISOString() },
];

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data?.length ? response.data : MOCK_ORDERS);
    } catch {
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch {
      console.error('Error al actualizar el estado');
    } finally {
      setUpdatingId(null);
    }
  };

  const totals = {
    all:       orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    active:    orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue:   orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_amount), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Ventas</h1>
            <p className="text-gray-500 mt-1">Gestión de pedidos del minimercado</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total pedidos</p>
                <p className="text-2xl font-bold mt-1">{totals.all}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-yellow-600 uppercase tracking-wide">Pendientes</p>
                <p className="text-2xl font-bold mt-1">{totals.pending}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-purple-600 uppercase tracking-wide">En curso</p>
                <p className="text-2xl font-bold mt-1">{totals.active}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-green-600 uppercase tracking-wide">Ingresos</p>
                <p className="text-2xl font-bold mt-1">${totals.revenue.toLocaleString('es-AR')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Todos los pedidos</CardTitle>
              <CardDescription>Hacé clic en el estado para cambiarlo</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <Loader />
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <ShoppingCart className="h-8 w-8" />
                  <p className="text-sm">No hay ventas registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                      <TableHead className="pl-6 w-20">Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="pr-6 w-44">Cambiar estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50/50">
                        <TableCell className="pl-6 font-mono text-sm text-gray-400">
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
                              {order.user.username[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{order.user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[160px] truncate">
                          {order.delivery_address}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {order.phone}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${Number(order.total_amount).toLocaleString('es-AR')}
                        </TableCell>
                        <TableCell className="pr-6">
                          <Select
                            value={order.status}
                            onValueChange={(val) => updateOrderStatus(order.id, val)}
                            disabled={updatingId === order.id}
                          >
                            <SelectTrigger className="h-8 text-xs w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="confirmed">Confirmado</SelectItem>
                              <SelectItem value="preparing">En preparación</SelectItem>
                              <SelectItem value="delivered">Entregado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}

