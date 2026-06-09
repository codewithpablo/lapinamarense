'use client';

import { useEffect, useState } from 'react';
import { productsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import Sidebar from '@/components/admin/Sidebar';
import { Loader2, Package, Minus, Plus, AlertTriangle, XCircle } from 'lucide-react';
import Loader from '@/components/ui/loader';

interface Product { id: number; name: string; stock: number; price: number; category_name?: string; category?: { name: string } }

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge className="bg-red-100    text-red-700    border-red-200    text-xs border">Sin stock</Badge>;
  if (stock < 10)  return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs border">{stock} — bajo</Badge>;
  return                  <Badge className="bg-green-100  text-green-700  border-green-200  text-xs border">{stock} — ok</Badge>;
}

export default function InventoryPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [newStock, setNewStock]   = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    productsAPI.getAll()
      .then(res => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  const openAdjust = (p: Product) => { setAdjusting(p); setNewStock(String(p.stock)); };

  const handleAdjust = async () => {
    if (!adjusting) return;
    const val = parseInt(newStock);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    try {
      await productsAPI.patch(adjusting.id, { stock: val });
      load();
      setAdjusting(null);
    } catch { console.error('Error al ajustar el stock'); }
    finally  { setSaving(false); }
  };

  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock   = products.filter(p => p.stock > 0 && p.stock < 10);
  const alertItems = [...outOfStock, ...lowStock];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-500 mt-1">Control de stock de productos</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total productos</p>
              <p className="text-2xl font-bold mt-1">{products.length}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-orange-600 uppercase tracking-wide">Stock bajo</p>
              <p className="text-2xl font-bold mt-1 text-orange-600">{lowStock.length}</p>
            </CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="pt-5">
              <p className="text-xs text-red-600 uppercase tracking-wide">Sin stock</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{outOfStock.length}</p>
            </CardContent></Card>
          </div>

          {/* Stock alerts panel */}
          {!loading && alertItems.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas de stock ({alertItems.length})
              </h2>

              {outOfStock.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{p.name}</p>
                      <p className="text-xs text-red-500">{p.category_name || '—'} · Sin stock</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 text-xs" onClick={() => openAdjust(p)}>
                    Reponer
                  </Button>
                </div>
              ))}

              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">{p.name}</p>
                      <p className="text-xs text-orange-500">{p.category_name || '—'} · Quedan {p.stock} unidades</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs" onClick={() => openAdjust(p)}>
                    Ajustar
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Full inventory table */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Estado del inventario</CardTitle>
              <CardDescription>Hacé clic en &quot;Ajustar&quot; para modificar el stock</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <Loader />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                      <TableHead className="pl-6 w-12">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="pr-6 text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p.id} className="hover:bg-gray-50/50">
                        <TableCell className="pl-6 text-gray-400 font-mono text-sm">{p.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                              <Package className="h-3.5 w-3.5 text-gray-500" />
                            </div>
                            <span className="font-medium text-sm">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{p.category_name || p.category?.name || '—'}</TableCell>
                        <TableCell className="font-medium text-sm">${Number(p.price).toLocaleString('es-AR')}</TableCell>
                        <TableCell><StockBadge stock={p.stock} /></TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button variant="outline" size="sm" onClick={() => openAdjust(p)}>Ajustar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Adjust Stock Modal */}
      <Dialog open={!!adjusting} onOpenChange={() => setAdjusting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
            <DialogDescription>{adjusting?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setNewStock(s => String(Math.max(0, parseInt(s || '0') - 1)))}>
                <Minus className="h-4 w-4" />
              </Button>
              <div className="space-y-1.5 text-center">
                <Label>Cantidad en stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={e => setNewStock(e.target.value)}
                  className="w-28 text-center text-lg font-bold"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setNewStock(s => String(parseInt(s || '0') + 1))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center">Stock actual: {adjusting?.stock} unidades</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjusting(null)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAdjust} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

