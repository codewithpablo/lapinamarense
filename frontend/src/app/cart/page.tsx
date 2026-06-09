'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartAPI } from '@/lib/api';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package, ChevronRight, Receipt } from 'lucide-react';
import Loader from '@/components/ui/loader';

interface CartItem {
  id: number;
  product: { id: number; name: string; price: number; image_url?: string; };
  quantity: number;
  subtotal: number;
}

interface Cart {
  items: CartItem[];
  total_price: number;
}

export default function CartPage() {
  const [cart, setCart]     = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const router = useRouter();

  // El layout guard ya garantiza un cliente autenticado.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const res = await cartAPI.get();
      setCart(res.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  const updateQuantity = async (productId: number, qty: number) => {
    if (qty < 1) return;
    await cartAPI.updateItem(productId, qty).catch(() => {});
    fetchCart();
  };

  const removeItem = async (productId: number) => {
    await cartAPI.removeItem(productId).catch(() => {});
    fetchCart();
  };

  const clearCart = async () => {
    await cartAPI.clear().catch(() => {});
    fetchCart();
  };

  const hasItems = !!cart && cart.items.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CustomerSidebar
        title="Mi carrito"
        rightSlot={hasItems ? (
          <button
            onClick={() => setSummaryOpen(true)}
            className="w-9 h-9 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 transition flex items-center justify-center shadow-sm"
            aria-label="Ver resumen del pedido"
          >
            <Receipt className="h-5 w-5 text-white" />
          </button>
        ) : undefined}
      />

      <main className="flex-1 p-4 lg:p-8 pt-[4.5rem] lg:pt-8 pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto">

          {loading ? (
            <Loader />

          ) : !cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-gray-300" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Tu carrito está vacío</h2>
              <p className="text-sm text-gray-500 mb-6">Explorá el catálogo y agregá productos</p>
              <Button
                className="bg-green-800 hover:bg-green-700 text-white"
                onClick={() => router.push('/products')}
              >
                Ir a la tienda <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

          ) : (
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Items */}
              <div className="lg:col-span-2 space-y-3">
                {cart.items.map(item => (
                  <Card key={item.id} className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">

                        {/* Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.product.image_url
                            ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                            : <Package className="h-6 w-6 text-gray-300" />
                          }
                        </div>

                        {/* Name + price */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.product.name}</p>
                          <p className="text-sm text-gray-500">${Number(item.product.price).toLocaleString('es-AR')} c/u</p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Subtotal + delete */}
                        <div className="text-right flex items-center gap-3">
                          <p className="font-bold text-gray-900 text-sm">
                            ${Number(item.subtotal).toLocaleString('es-AR')}
                          </p>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ))}

                <button
                  onClick={clearCart}
                  className="hidden lg:inline-block text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Summary — columna a la derecha SOLO en desktop */}
              <div className="hidden lg:block">
                <Card className="border-0 shadow-sm bg-white sticky top-8">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resumen del pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>${Number(cart.total_price).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Envío</span>
                      <span className="text-green-600 font-medium">Gratis</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span>${Number(cart.total_price).toLocaleString('es-AR')}</span>
                    </div>
                    <Button
                      className="w-full bg-green-800 hover:bg-green-700 text-white h-10 font-medium mt-1"
                      onClick={() => router.push('/checkout')}
                    >
                      Confirmar pedido <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* ── Botón "Vaciar carrito" fijo en el footer (solo mobile) ── */}
      {hasItems && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-white/80 backdrop-blur-md border-t border-gray-200/70">
          <Button
            onClick={clearCart}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-11 font-semibold"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Vaciar carrito
          </Button>
        </div>
      )}

      {/* ── Resumen del pedido como SIDEBAR DERECHO en mobile (drawer) ── */}
      {hasItems && (
        <>
          {/* Overlay */}
          {summaryOpen && (
            <div onClick={() => setSummaryOpen(false)} className="lg:hidden fixed inset-0 bg-black/40 z-40" />
          )}
          {/* Drawer */}
          <aside className={cn(
            'lg:hidden fixed right-0 top-0 h-screen w-72 max-w-[85vw] z-50 bg-white border-l border-gray-100 flex flex-col transition-transform duration-300',
            summaryOpen ? 'translate-x-0' : 'translate-x-full',
          )}>
            {/* Header del drawer */}
            <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-green-600" /> Resumen del pedido
              </span>
              <button
                onClick={() => setSummaryOpen(false)}
                className="w-8 h-8 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 transition flex items-center justify-center"
                aria-label="Cerrar resumen"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>
            {/* Contenido */}
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${Number(cart!.total_price).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Envío</span>
                <span className="text-green-600 font-medium">Gratis</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>${Number(cart!.total_price).toLocaleString('es-AR')}</span>
              </div>
              <Button
                className="w-full bg-green-800 hover:bg-green-700 text-white h-10 font-medium mt-1"
                onClick={() => router.push('/checkout')}
              >
                Confirmar pedido <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

