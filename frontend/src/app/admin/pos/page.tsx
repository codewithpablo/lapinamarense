'use client';

import { useEffect, useState } from 'react';
import { productsAPI, ordersAPI } from '@/lib/api';
import Sidebar from '@/components/admin/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Search, Plus, Minus, Trash2, ShoppingCart,
  CheckCircle2, Loader2, Package, User, X,
} from 'lucide-react';
import api from '@/lib/api';

interface Product  { id: number; name: string; price: number; stock: number; category_name?: string; image?: string }
interface LineItem  { product: Product; quantity: number }
interface Customer { id: number; username: string; first_name: string; last_name: string }

export default function PosPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [filtered, setFiltered]   = useState<Product[]>([]);
  const [search, setSearch]       = useState('');
  const [cart, setCart]           = useState<LineItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch]     = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // El layout guard ya garantiza un usuario staff.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    productsAPI.getAll().then(res => { setProducts(res.data); setFiltered(res.data); }).catch(() => {});
    api.get('/auth/users/').then(res => setCustomers(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter(p =>
      p.name.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q)
    ));
  }, [search, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const ex = prev.find(l => l.product.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stock) return prev;
        return prev.map(l => l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const setQty = (id: number, qty: number) => {
    if (qty < 1) { setCart(p => p.filter(l => l.product.id !== id)); return; }
    setCart(p => p.map(l => l.product.id === id ? { ...l, quantity: qty } : l));
  };

  const total = cart.reduce((s, l) => s + l.product.price * l.quantity, 0);

  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase();
    return c.username.toLowerCase().includes(q) || `${c.first_name} ${c.last_name}`.toLowerCase().includes(q);
  }).slice(0, 5);

  const handleConfirm = async () => {
    if (!cart.length) return;
    setError(''); setSubmitting(true);
    try {
      await ordersAPI.presencial({
        items: cart.map(l => ({ product_id: l.product.id, quantity: l.quantity })),
        customer_id: selectedCustomer?.id ?? null,
        notes,
      });
      setSuccess(true);
      setCart([]); setNotes(''); setSelectedCustomer(null); setCustomerSearch('');
      setTimeout(() => setSuccess(false), 3000);
      productsAPI.getAll().then(res => { setProducts(res.data); setFiltered(res.data); });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar la venta');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 pt-14 lg:pt-0">
      <Sidebar />

      {/* Main area — fills remaining height */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {success && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 bg-green-50 border-b border-green-200 text-green-700 px-4 py-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" /> Venta registrada
          </div>
        )}

        {/* Two-column body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* LEFT — Product catalog */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-100 min-h-[40vh] lg:min-h-0">

            {/* Search */}
            <div className="relative mb-4 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white"
              />
            </div>

            {/* Scrollable grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-2">
                {filtered.map(product => {
                  const inCart = cart.find(l => l.product.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className={`relative bg-white rounded-xl border text-left transition-all shadow-sm
                        ${product.stock === 0
                          ? 'opacity-40 cursor-not-allowed border-gray-100'
                          : inCart
                            ? 'border-green-300 shadow-md ring-1 ring-green-200'
                            : 'border-gray-100 hover:border-green-200 hover:shadow-md'
                        }`}
                    >
                      {inCart && (
                        <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center z-10">
                          {inCart.quantity}
                        </span>
                      )}
                      <div className="aspect-square bg-gray-50 rounded-t-xl flex items-center justify-center overflow-hidden">
                        {product.image
                          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          : <Package className="h-8 w-8 text-gray-200" />
                        }
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1 mb-0.5">{product.name}</p>
                        <p className="text-[10px] text-gray-400 mb-1.5">{product.category_name || '—'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">${Number(product.price).toLocaleString('es-AR')}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {product.stock > 0 ? `${product.stock} u.` : 'Sin stock'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Cart & confirm */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-white overflow-hidden">

            {/* Customer */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 relative">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Cliente
              </p>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${customerSearch ? 'border-green-300 bg-green-50/40' : 'border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50/40'}`}
                onClick={() => { if (!customerSearch) setCustomerSearch(' '); }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selectedCustomer ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <User className={`h-3.5 w-3.5 ${selectedCustomer ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${selectedCustomer ? 'text-green-700' : 'text-gray-400'}`}>
                    {selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Anonimo'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {selectedCustomer ? `@${selectedCustomer.username}` : 'Toca para asignar un cliente'}
                  </p>
                </div>
                {selectedCustomer && (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedCustomer(null); setCustomerSearch(''); }}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {customerSearch && (
                <div className="absolute left-5 right-5 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <Input
                      autoFocus
                      placeholder="Buscar cliente..."
                      value={customerSearch.trim()}
                      onChange={e => setCustomerSearch(e.target.value)}
                      onBlur={() => { setTimeout(() => { setCustomerSearch(''); }, 150); }}
                      className="h-8 text-sm"
                    />
                  </div>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <span className="font-medium text-gray-800">{c.first_name} {c.last_name}</span>
                        <span className="text-gray-400 text-xs ml-1.5">@{c.username}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3">Sin resultados</p>
                  )}
                </div>
              )}
            </div>

            {/* Cart items — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 select-none">
                  <ShoppingCart className="h-12 w-12 mb-3" />
                  <p className="text-sm">Seleccioná productos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map(line => (
                    <div key={line.product.id} className="flex items-center gap-2 py-2 border-b border-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{line.product.name}</p>
                        <p className="text-[11px] text-gray-400">${Number(line.product.price).toLocaleString('es-AR')} c/u</p>
                        <button onClick={() => setDetailProduct(line.product)} className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-1.5 py-0.5 rounded font-medium mt-1">Ver mas</button>
                      </div>
                      <span className="text-xs font-bold text-gray-900 w-14 text-right flex-shrink-0">
                        ${Number(line.product.price * line.quantity).toLocaleString('es-AR')}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setQty(line.product.id, line.quantity - 1)}
                          className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-900">{line.quantity}</span>
                        <button
                          onClick={() => setQty(line.product.id, line.quantity + 1)}
                          disabled={line.quantity >= line.product.stock}
                          className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 disabled:opacity-30"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => setCart(p => p.filter(l => l.product.id !== line.product.id))}
                        className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer — total + confirm */}
            <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 space-y-3 bg-white">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Subtotal ({cart.length} items)</span>
                <span className="text-xl font-bold text-gray-900">${Number(total).toLocaleString('es-AR')}</span>
              </div>

              <Input
                placeholder="Notas (opcional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="h-9 text-sm"
                disabled={!cart.length}
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <Button
                onClick={handleConfirm}
                disabled={!cart.length || submitting}
                className="w-full h-11 bg-green-800 hover:bg-green-700 text-white font-semibold text-sm rounded-xl disabled:opacity-40"
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</>
                  : 'Confirmar'
                }
              </Button>
            </div>

          </div>
        </div>
      </div>

      <Dialog open={!!detailProduct} onOpenChange={() => setDetailProduct(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
          {detailProduct && (
            <>
              <div className="h-56 bg-gray-50 flex items-center justify-center">
                {detailProduct.image
                  ? <img src={detailProduct.image} alt={detailProduct.name} className="w-full h-full object-cover" />
                  : <Package className="h-16 w-16 text-gray-200" />
                }
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">{detailProduct.name}</p>
                  {detailProduct.category_name && (
                    <p className="text-sm text-gray-400 mt-0.5">{detailProduct.category_name}</p>
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-green-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-green-600 uppercase tracking-wide font-semibold">Precio</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">${Number(detailProduct.price).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Stock</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{detailProduct.stock} <span className="text-sm font-normal text-gray-400">u.</span></p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

