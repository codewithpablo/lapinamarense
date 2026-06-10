'use client';

import { useEffect, useState } from 'react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Minus, Loader2, Trash2 } from 'lucide-react';
import Loader from '@/components/ui/loader';
import Sidebar from '@/components/admin/Sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OFFER_TAGS = ['', 'OFERTA', 'PROMO', '2x1', '3x2', 'NUEVO', 'POPULAR'];
const OFFER_COLORS: Record<string, string> = {
  'OFERTA': 'bg-red-100 text-red-700', 'PROMO': 'bg-orange-100 text-orange-700',
  '2x1': 'bg-purple-100 text-purple-700', '3x2': 'bg-blue-100 text-blue-700',
  'NUEVO': 'bg-green-100 text-green-700', 'POPULAR': 'bg-yellow-100 text-yellow-700',
};

interface Product {
  id: number;
  name: string;
  net_content: string;
  price: number;
  discount_price?: number | null;
  offer_tag?: string;
  category: { id: number; name: string };
  stock: number;
  is_active: boolean;
  image?: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState('');
  const [savingStock, setSavingStock] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', net_content: '', price: '', discount_price: '',
    offer_tag: '', category: '', stock: '', image: null as File | null,
  });

  // Edición de un producto existente
  const [editing, setEditing] = useState<Product | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', net_content: '', price: '', discount_price: '',
    offer_tag: '', category: '', stock: '', is_active: true,
    image: null as File | null, removeImage: false,
  });

  const openEdit = (p: Product) => {
    setEditing(p);
    setEditForm({
      name: p.name ?? '',
      net_content: p.net_content ?? '',
      price: String(p.price ?? ''),
      discount_price: p.discount_price != null ? String(p.discount_price) : '',
      offer_tag: p.offer_tag ?? '',
      category: String(p.category?.id ?? ''),
      stock: String(p.stock ?? ''),
      is_active: p.is_active,
      image: null,
      removeImage: false,
    });
  };

  const handleEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    const fd = new FormData();
    fd.append('name', editForm.name);
    fd.append('net_content', editForm.net_content);
    fd.append('price', editForm.price);
    // discount_price vacío → lo mandamos vacío para limpiarlo
    fd.append('discount_price', editForm.discount_price || '');
    fd.append('offer_tag', editForm.offer_tag || '');
    fd.append('category', editForm.category);
    fd.append('stock', editForm.stock);
    fd.append('is_active', editForm.is_active ? 'true' : 'false');
    if (editForm.image) {
      fd.append('image', editForm.image);          // foto nueva
    } else if (editForm.removeImage) {
      fd.append('image', '');                        // quitar la foto actual
    }
    try {
      await productsAPI.patch(editing.id, fd);
      setEditing(null);
      fetchData();
    } catch (error) {
      console.error('Error al editar producto:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('net_content', newProduct.net_content);
    formData.append('price', newProduct.price);
    if (newProduct.discount_price) formData.append('discount_price', newProduct.discount_price);
    if (newProduct.offer_tag) formData.append('offer_tag', newProduct.offer_tag);
    formData.append('category', newProduct.category);
    formData.append('stock', newProduct.stock);
    if (newProduct.image) formData.append('image', newProduct.image);
    try {
      await productsAPI.create(formData);
      setIsAddDialogOpen(false);
      setNewProduct({ name: '', net_content: '', price: '', discount_price: '', offer_tag: '', category: '', stock: '', image: null });
      fetchData();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  // Ejecuta el borrado ya confirmado.
  const handleDeleteProduct = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await productsAPI.delete(confirmDelete.id);
      setConfirmDelete(null);
      setEditing(null);       // por si se borró desde el modal de edición
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setDeleting(false);
    }
  };

  const openAdjust = (p: Product) => { setAdjusting(p); setNewStock(String(p.stock)); };

  const handleAdjust = async () => {
    if (!adjusting) return;
    const val = parseInt(newStock);
    if (isNaN(val) || val < 0) return;
    setSavingStock(true);
    try {
      await productsAPI.patch(adjusting.id, { stock: val });
      fetchData();
      setAdjusting(null);
    } catch { console.error('Error al ajustar stock'); }
    finally { setSavingStock(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1"><Loader /></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Productos</CardTitle>
                <CardDescription>{products.length} registrados</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Agregar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar nuevo producto</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input id="name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="net_content">Contenido Neto</Label>
                      <Input id="net_content" value={newProduct.net_content} onChange={(e) => setNewProduct({ ...newProduct, net_content: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="price">Precio</Label>
                        <Input id="price" type="number" placeholder="0" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="discount_price">Precio oferta <span className="text-gray-400 font-normal">(opcional)</span></Label>
                        <Input id="discount_price" type="number" placeholder="0" value={newProduct.discount_price} onChange={(e) => setNewProduct({ ...newProduct, discount_price: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Etiqueta <span className="text-gray-400 font-normal">(opcional)</span></Label>
                      <div className="flex gap-2 flex-wrap">
                        {OFFER_TAGS.map(tag => (
                          <button key={tag} type="button"
                            onClick={() => setNewProduct({ ...newProduct, offer_tag: tag })}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${newProduct.offer_tag === tag ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                          >
                            {tag || 'Sin etiqueta'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input id="stock" type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="image">Imagen</Label>
                      <Input id="image" type="file" onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files ? e.target.files[0] : null })} />
                    </div>
                  </div>
                  <Button onClick={handleAddProduct}>Guardar</Button>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={products}
                getRowKey={(p) => p.id}
                emptyMessage="No hay productos registrados"
                className="!shadow-none !rounded-none rounded-b-xl"
                columns={[
                  {
                    key: 'producto', header: 'Producto',
                    cell: (product) => (
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                        <span className="font-medium text-sm text-gray-900">{product.name}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'categoria', header: 'Categoría', hideOnMobile: true,
                    cell: (product) => <span className="text-gray-500">{product.category?.name || '-'}</span>,
                  },
                  {
                    key: 'precio', header: 'Precio',
                    cell: (product) => (
                      <span className="whitespace-nowrap">
                        <span className="font-semibold text-gray-900">${Number(product.discount_price ?? product.price).toLocaleString('es-AR')}</span>
                        {product.discount_price && <span className="text-xs text-gray-400 line-through ml-1">${Number(product.price).toLocaleString('es-AR')}</span>}
                      </span>
                    ),
                  },
                  {
                    key: 'etiqueta', header: 'Etiqueta', hideOnMobile: true,
                    cell: (product) => product.offer_tag
                      ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${OFFER_COLORS[product.offer_tag] || 'bg-gray-100 text-gray-600'}`}>{product.offer_tag}</span>
                      : <span className="text-gray-300 text-xs">-</span>,
                  },
                  {
                    key: 'stock', header: 'Stock', align: 'center', stopClick: true,
                    cell: (product) => (
                      <button onClick={() => openAdjust(product)} className="cursor-pointer">
                        <Badge className={`text-xs border ${product.stock === 0 ? 'bg-red-100 text-red-700 border-red-200' : product.stock < 10 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                          {product.stock === 0 ? 'Sin stock' : product.stock}
                        </Badge>
                      </button>
                    ),
                  },
                  {
                    key: 'acciones', header: 'Acciones', align: 'right', stopClick: true,
                    cell: (product) => (
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-xs text-green-700 hover:text-green-900 font-medium hover:underline" onClick={() => openEdit(product)}>
                          Editar
                        </button>
                        <button className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline" onClick={() => setConfirmDelete(product)}>
                          Eliminar
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Adjust Stock Modal */}
      <Dialog open={!!adjusting} onOpenChange={() => setAdjusting(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
            <DialogDescription>{adjusting?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-2">
            <Button variant="outline" size="icon" onClick={() => setNewStock(s => String(Math.max(0, parseInt(s || '0') - 1)))}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="0"
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              className="w-20 text-center text-lg font-bold"
            />
            <Button variant="outline" size="icon" onClick={() => setNewStock(s => String(parseInt(s || '0') + 1))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center">Stock actual: {adjusting?.stock}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjusting(null)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAdjust} disabled={savingStock}>
              {savingStock && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar producto */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
          {/* Header con la foto en grande tipo banner */}
          <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
            {(() => {
              const preview = editForm.image
                ? URL.createObjectURL(editForm.image)
                : (!editForm.removeImage && editing?.image ? editing.image : null);
              return preview ? (
                <img src={preview} alt={editing?.name ?? ''} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <Package className="h-12 w-12" />
                  <span className="text-xs mt-1">Sin imagen</span>
                </div>
              );
            })()}
            {/* Degradado para que se lea el título sobre la foto */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <DialogHeader className="text-left space-y-0">
                <DialogTitle className="text-white drop-shadow">Editar producto</DialogTitle>
                <DialogDescription className="text-white/80 drop-shadow">{editing?.name}</DialogDescription>
              </DialogHeader>
            </div>
            {/* Acciones sobre la foto */}
            <div className="absolute top-3 right-3 flex gap-2">
              <label className="cursor-pointer text-xs font-medium bg-white/90 hover:bg-white text-gray-700 px-2.5 py-1.5 rounded-lg shadow-sm transition-colors">
                Cambiar foto
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.files ? e.target.files[0] : null, removeImage: false })} />
              </label>
              {((!editForm.removeImage && editing?.image) || editForm.image) && (
                <button type="button"
                  onClick={() => setEditForm({ ...editForm, image: null, removeImage: true })}
                  className="text-xs font-medium bg-red-600/90 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg shadow-sm transition-colors">
                  Quitar
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-4 px-6 pb-2 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-net">Contenido neto</Label>
              <Input id="edit-net" value={editForm.net_content} onChange={(e) => setEditForm({ ...editForm, net_content: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Precio</Label>
                <Input id="edit-price" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-discount">Precio oferta <span className="text-gray-400 font-normal">(opcional)</span></Label>
                <Input id="edit-discount" type="number" placeholder="0" value={editForm.discount_price} onChange={(e) => setEditForm({ ...editForm, discount_price: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Etiqueta <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <div className="flex gap-2 flex-wrap">
                {OFFER_TAGS.map(tag => (
                  <button key={tag} type="button"
                    onClick={() => setEditForm({ ...editForm, offer_tag: tag })}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${editForm.offer_tag === tag ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {tag || 'Sin etiqueta'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input id="edit-stock" type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} className="h-4 w-4 accent-green-600" />
              Producto activo (visible en la tienda)
            </label>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2 px-6 pb-6">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:border-red-200"
              onClick={() => { if (editing) setConfirmDelete(editing); }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Eliminar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleEdit} disabled={savingEdit}>
                {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              Vas a eliminar <span className="font-semibold text-gray-700">{confirmDelete?.name}</span>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteProduct} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-1.5" /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
