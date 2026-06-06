'use client';

import { useEffect, useState } from 'react';
import { combosAPI, productsAPI } from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Gift, Loader2, Package, X } from 'lucide-react';
import Loader from '@/components/ui/loader';

interface Product { id: number; name: string; price: number; image?: string }
interface ComboItem { product: Product; quantity: number }
interface Combo { id: number; name: string; description: string; price: number; image?: string; items: ComboItem[]; is_active: boolean }

export default function CombosPage() {
  const [combos, setCombos]       = useState<Combo[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editCombo, setEditCombo] = useState<Combo | null>(null);

  const emptyForm = { name: '', description: '', price: '', image: null as File | null };
  const [form, setForm] = useState(emptyForm);
  const [lineItems, setLineItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    Promise.all([combosAPI.getAll(), productsAPI.getAll()])
      .then(([c, p]) => { setCombos(c.data); setProducts(p.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    !lineItems.find(l => l.product.id === p.id)
  ).slice(0, 6);

  const addProduct = (p: Product) => {
    setLineItems(prev => [...prev, { product: p, quantity: 1 }]);
    setProductSearch('');
  };

  const setQty = (id: number, qty: number) => {
    if (qty < 1) { setLineItems(p => p.filter(l => l.product.id !== id)); return; }
    setLineItems(p => p.map(l => l.product.id === id ? { ...l, quantity: qty } : l));
  };

  const openNew = () => {
    setEditCombo(null); setForm(emptyForm); setLineItems([]); setOpen(true);
  };

  const openEdit = (combo: Combo) => {
    setEditCombo(combo);
    setForm({ name: combo.name, description: combo.description, price: String(combo.price), image: null });
    setLineItems(combo.items.map(i => ({ product: i.product, quantity: i.quantity })));
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || lineItems.length === 0) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      if (form.image) fd.append('image', form.image);

      let combo: Combo;
      if (editCombo) {
        const res = await combosAPI.update(editCombo.id, fd);
        combo = res.data;
      } else {
        const res = await combosAPI.create(fd);
        combo = res.data;
      }

      // Sync items
      const existing = editCombo?.items.map(i => i.product.id) ?? [];
      const toRemove = existing.filter(id => !lineItems.find(l => l.product.id === id));
      const toAdd = lineItems;
      await Promise.all([
        ...toRemove.map(id => combosAPI.removeItem(combo.id, id).catch(() => {})),
        ...toAdd.map(l => combosAPI.addItem(combo.id, l.product.id, l.quantity)),
      ]);

      const refreshed = await combosAPI.getAll();
      setCombos(refreshed.data);
      setOpen(false);
    } catch { console.error('Error al guardar el combo'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await combosAPI.delete(id).catch(() => {});
    setCombos(p => p.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Combos</h1>
              <p className="text-gray-500 mt-1">Agrupá productos en combos con precio especial</p>
            </div>
            <Button onClick={openNew} className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
              <Plus className="h-4 w-4 mr-2" /> Nuevo combo
            </Button>
          </div>

          {loading ? (
            <Loader />
          ) : combos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Gift className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No hay combos todavía</p>
              <p className="text-sm text-gray-400 mt-1">Creá el primero con el botón de arriba</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {combos.map(combo => (
                <Card key={combo.id} className="border-0 shadow-sm bg-white overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center relative overflow-hidden">
                    {combo.image
                      ? <img src={combo.image} alt={combo.name} className="w-full h-full object-cover" />
                      : <Gift className="h-12 w-12 text-green-300" />
                    }
                    <span className="absolute top-2 left-2 bg-green-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">COMBO</span>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-gray-900">{combo.name}</p>
                      <span className="text-base font-bold text-green-700">${Number(combo.price).toLocaleString('es-AR')}</span>
                    </div>
                    {combo.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{combo.description}</p>}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {combo.items.map((ci, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                          {ci.quantity > 1 ? `${ci.quantity}x ` : ''}{ci.product.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openEdit(combo)}>Editar</Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 border-red-200" onClick={() => handleDelete(combo.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCombo ? 'Editar combo' : 'Nuevo combo'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input placeholder="Combo Desayuno" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input placeholder="Descripción del combo..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio combo *</Label>
                <Input type="number" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Imagen</Label>
                <Input type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files?.[0] ?? null }))} />
              </div>
            </div>

            {/* Products */}
            <div className="space-y-2">
              <Label>Productos del combo *</Label>
              {lineItems.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {lineItems.map(l => (
                    <div key={l.product.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="flex-1 text-sm text-gray-800 truncate">{l.product.name}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQty(l.product.id, l.quantity - 1)} className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white text-xs">−</button>
                        <span className="w-6 text-center text-xs font-semibold">{l.quantity}</span>
                        <button onClick={() => setQty(l.product.id, l.quantity + 1)} className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white text-xs">+</button>
                      </div>
                      <button onClick={() => setLineItems(p => p.filter(x => x.product.id !== l.product.id))} className="text-gray-300 hover:text-red-400">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative">
                <Input
                  placeholder="Buscar producto para agregar..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="h-9 text-sm"
                />
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                        <Package className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-gray-400">${Number(p.price).toLocaleString('es-AR')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving || !form.name || !form.price || lineItems.length === 0} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : editCombo ? 'Guardar cambios' : 'Crear combo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
