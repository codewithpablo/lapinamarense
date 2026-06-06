'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/admin/Sidebar';
import { Plus, Loader2 } from 'lucide-react';

interface Purchase { id: number; supplier: string; date: string; items: number; total: number; status: string; notes?: string }
const EMPTY_FORM = { supplier: '', date: new Date().toISOString().split('T')[0], items: '', total: '', status: 'pending', notes: '' };
const STATUS_COLORS: Record<string, string> = {
  received:  'bg-green-100  text-green-700  border-green-200',
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-100    text-red-700    border-red-200',
};
const STATUS_LABELS: Record<string, string> = { received: 'Recibido', pending: 'Pendiente', cancelled: 'Cancelado' };
const SUPPLIERS = ['Distribuidora Norte', 'Lácteos del Sur S.A.', 'Yerba & Café S.R.L.', 'Limpieza Total', 'Bebidas Pinamar'];

const INITIAL: Purchase[] = [
  { id: 8, supplier: 'Distribuidora Norte',  date: '2026-06-02', items: 12, total: 84500,  status: 'received',  notes: 'Entrega completa en tiempo' },
  { id: 7, supplier: 'Lácteos del Sur S.A.', date: '2026-06-01', items: 6,  total: 31200,  status: 'received',  notes: '' },
  { id: 6, supplier: 'Bebidas Pinamar',      date: '2026-05-30', items: 20, total: 112000, status: 'received',  notes: 'Faltan 2 cajas de gaseosa' },
  { id: 5, supplier: 'Yerba & Café S.R.L.',  date: '2026-05-28', items: 8,  total: 56800,  status: 'received',  notes: '' },
  { id: 4, supplier: 'Distribuidora Norte',  date: '2026-05-25', items: 15, total: 97300,  status: 'received',  notes: '' },
  { id: 3, supplier: 'Limpieza Total',       date: '2026-05-22', items: 5,  total: 28600,  status: 'cancelled', notes: 'Proveedor canceló el pedido' },
  { id: 2, supplier: 'Bebidas Pinamar',      date: '2026-06-03', items: 10, total: 65000,  status: 'pending',   notes: 'Entrega programada para el 5/6' },
  { id: 1, supplier: 'Lácteos del Sur S.A.', date: '2026-06-03', items: 4,  total: 18400,  status: 'pending',   notes: '' },
];

export default function PurchasesPage() {
  const [purchases, setPurchases]     = useState<Purchase[]>(INITIAL);
  const [newOpen, setNewOpen]         = useState(false);
  const [detailItem, setDetailItem]   = useState<Purchase | null>(null);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] }); setNewOpen(true); };

  const handleCreate = async () => {
    if (!form.supplier || !form.total) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    const newId = Math.max(0, ...purchases.map(p => p.id)) + 1;
    setPurchases(prev => [{ id: newId, supplier: form.supplier, date: form.date, items: parseInt(form.items) || 0, total: parseFloat(form.total) || 0, status: form.status, notes: form.notes }, ...prev]);
    setNewOpen(false);
    setSaving(false);
  };

  const handleStatusChange = (id: number, status: string) => {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleDelete = () => {
    setPurchases(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
  };

  const totalReceived = purchases.filter(p => p.status === 'received').reduce((s, p) => s + p.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
              <p className="text-gray-500 mt-1">Historial de compras a proveedores</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Nueva compra
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total compras</p>
              <p className="text-2xl font-bold mt-1">{purchases.length}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-yellow-600 uppercase tracking-wide">Pendientes</p>
              <p className="text-2xl font-bold mt-1">{purchases.filter(p => p.status === 'pending').length}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-green-600 uppercase tracking-wide">Gastado este mes</p>
              <p className="text-2xl font-bold mt-1">${totalReceived.toLocaleString('es-AR')}</p>
            </CardContent></Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Historial de compras</CardTitle>
              <CardDescription>{purchases.length} compras registradas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                    <TableHead className="pl-6 w-12">#</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-6 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(p => (
                    <TableRow key={p.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-6 text-gray-400 font-mono text-sm">{p.id}</TableCell>
                      <TableCell className="font-medium text-sm">{p.supplier}</TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(p.date).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell className="text-sm text-gray-500">{p.items} artículos</TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={v => handleStatusChange(p.id, v)}>
                          <SelectTrigger className="h-7 text-xs w-32 border-0 p-0 shadow-none focus:ring-0">
                            <Badge className={`text-xs border cursor-pointer ${STATUS_COLORS[p.status]}`}>
                              {STATUS_LABELS[p.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="received">Recibido</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-semibold">${p.total.toLocaleString('es-AR')}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setDetailItem(p)}>Ver detalle</Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-200" onClick={() => setDeleteId(p.id)}>Eliminar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* New Purchase Modal */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva compra</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Proveedor *</Label>
              <Select value={form.supplier} onValueChange={v => set('supplier', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                <SelectContent>
                  {SUPPLIERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad de artículos</Label>
              <Input type="number" min="1" placeholder="0" value={form.items} onChange={e => set('items', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Total ($) *</Label>
              <Input type="number" min="0" placeholder="0" value={form.total} onChange={e => set('total', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="received">Recibido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notas</Label>
              <Input placeholder="Observaciones opcionales" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreate} disabled={saving || !form.supplier || !form.total}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de compra #{detailItem?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Proveedor</span><span className="font-medium">{detailItem?.supplier}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span>{detailItem?.date && new Date(detailItem.date).toLocaleDateString('es-AR')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Artículos</span><span>{detailItem?.items}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Estado</span>
              <Badge className={`text-xs border ${STATUS_COLORS[detailItem?.status ?? '']}`}>{STATUS_LABELS[detailItem?.status ?? '']}</Badge>
            </div>
            {detailItem?.notes && <div className="flex justify-between"><span className="text-gray-500">Notas</span><span className="text-right max-w-xs">{detailItem.notes}</span></div>}
            <div className="flex justify-between border-t pt-3"><span className="font-semibold">Total</span><span className="font-bold text-base">${detailItem?.total.toLocaleString('es-AR')}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailItem(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar compra</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

