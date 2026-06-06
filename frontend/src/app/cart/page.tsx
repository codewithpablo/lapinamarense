'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, Loader2, ArrowRight, Package } from 'lucide-react';
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
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    fetchCart();
  }, [user]);

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CustomerSidebar />

      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Carrito de Compras</h1>
            {!loading && cart && (
              <p className="text-sm text-gray-500 mt-1">{cart.items.length} {cart.items.length === 1 ? 'producto' : 'productos'}</p>
            )}
          </div>

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
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Summary */}
              <div>
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
    </div>
  );
}

