'use client';

import { useEffect, useState } from 'react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Minus, Loader2 } from 'lucide-react';
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
  const [newProduct, setNewProduct] = useState({
    name: '', net_content: '', price: '', discount_price: '',
    offer_tag: '', category: '', stock: '', image: null as File | null,
  });

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

  const handleDeleteProduct = async (productId: number) => {
    try {
      await productsAPI.delete(productId);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
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
              {products.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay productos registrados</p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                      <TableHead className="pl-6">Imagen</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Etiqueta</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="pr-6 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50/50">
                        <TableCell className="pl-6">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{product.name}</TableCell>
                        <TableCell className="text-sm text-gray-500">{product.category?.name || '-'}</TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold">${Number(product.discount_price ?? product.price).toLocaleString('es-AR')}</span>
                          {product.discount_price && <span className="text-xs text-gray-400 line-through ml-1">${Number(product.price).toLocaleString('es-AR')}</span>}
                        </TableCell>
                        <TableCell>
                          {product.offer_tag
                            ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${OFFER_COLORS[product.offer_tag] || 'bg-gray-100 text-gray-600'}`}>{product.offer_tag}</span>
                            : <span className="text-gray-300 text-xs">-</span>}
                        </TableCell>
                        <TableCell>
                          <button onClick={() => openAdjust(product)} className="cursor-pointer">
                            <Badge className={`text-xs border ${product.stock === 0 ? 'bg-red-100 text-red-700 border-red-200' : product.stock < 10 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'} hover:opacity-80`}>
                              {product.stock === 0 ? 'Sin stock' : product.stock}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-200" onClick={() => handleDeleteProduct(product.id)}>
                            Eliminar
                          </Button>
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
    </div>
  );
}
