'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartAPI, ordersAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Phone, FileText, Package, CheckCircle2, ArrowLeft } from 'lucide-react';
import Loader from '@/components/ui/loader';

export default function CheckoutPage() {
  const [cart, setCart]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    delivery_address: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (!user) { router.push('/auth?redirect=/checkout'); return; }
    setFormData(f => ({
      ...f,
      delivery_address: user.address || '',
      phone: user.phone || '',
    }));
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await cartAPI.get();
      if (!res.data.items?.length) { router.push('/cart'); return; }
      setCart(res.data);
    } catch { router.push('/cart'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await ordersAPI.create(formData);
      setSuccess(true);
      setTimeout(() => router.push('/orders'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CustomerSidebar />

      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => router.push('/cart')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finalizar Compra</h1>
              <p className="text-sm text-gray-500 mt-0.5">Completá los datos de entrega</p>
            </div>
          </div>

          {loading ? (
            <Loader />

          ) : success ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">¡Pedido confirmado!</h2>
              <p className="text-sm text-gray-500">Redirigiendo a tus pedidos...</p>
            </div>

          ) : (
            <div className="grid lg:grid-cols-5 gap-6">

              {/* Form — 3 cols */}
              <div className="lg:col-span-3">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Información de entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                          {error}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label htmlFor="delivery_address" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          Dirección de entrega <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="delivery_address"
                          name="delivery_address"
                          value={formData.delivery_address}
                          onChange={handleChange}
                          placeholder="Av. Corrientes 1234, CABA"
                          className="h-10"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          Teléfono <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="11 1234-5678"
                          className="h-10"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-gray-400" />
                          Notas adicionales
                        </Label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="Instrucciones especiales, timbre, piso..."
                          rows={3}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 bg-green-800 hover:bg-green-700 text-white font-medium rounded-lg mt-2"
                      >
                        {submitting
                          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando...</>
                          : 'Confirmar pedido'
                        }
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Order summary — 2 cols */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-sm bg-white sticky top-8">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Resumen del pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {cart?.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.product.image_url
                              ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                              : <Package className="h-4 w-4 text-gray-300" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-gray-400">x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                            ${Number(item.subtotal).toLocaleString('es-AR')}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>${Number(cart?.total_price).toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Envío</span>
                        <span className="text-green-600 font-medium">Gratis</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 pt-1">
                        <span>Total</span>
                        <span>${Number(cart?.total_price).toLocaleString('es-AR')}</span>
                      </div>
                    </div>

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

