'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersAPI } from '@/lib/api';
import { cart as cartLib, isAuth } from '@/lib/cart';
import { useAuth } from '@/contexts/AuthContext';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import OrderTicket, { type TicketOrder } from '@/components/customer/OrderTicket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Loader2, MapPin, Phone, FileText, Package, ArrowLeft, User, Store, Truck,
  Wallet, Banknote, Printer, Copy, Check, UserPlus, MessageCircle,
} from 'lucide-react';
import Loader from '@/components/ui/loader';

const ALIAS = 'lapinamarense';
const TITULAR = 'Héctor Waldemar Alarcón';
const WHATSAPP = '5493624851127'; // NÚMERO DE PRUEBA (3624-851127)

type Payment = 'efectivo' | 'transferencia';
type Delivery = 'envio' | 'retiro';

export default function CheckoutPage() {
  const [cart, setCart]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [createdOrder, setCreatedOrder] = useState<TicketOrder | null>(null);
  const [aliasCopied, setAliasCopied]   = useState(false);
  const [sharing, setSharing]           = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const [payment, setPayment]   = useState<Payment>('efectivo');
  const [delivery, setDelivery] = useState<Delivery>('envio');
  const [form, setForm] = useState({ name: '', phone: '', delivery_address: '', notes: '' });

  useEffect(() => {
    setForm(f => ({
      ...f,
      name: user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username : f.name,
      delivery_address: user?.address || f.delivery_address,
      phone: user?.phone || f.phone,
    }));
    cartLib.get()
      .then(data => {
        if (!data.items?.length) { router.push('/cart'); return; }
        setCart(data);
      })
      .catch(() => router.push('/cart'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const copyAlias = () => {
    navigator.clipboard?.writeText(ALIAS).then(() => {
      setAliasCopied(true);
      setTimeout(() => setAliasCopied(false), 2000);
    }).catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (delivery === 'envio' && !form.delivery_address.trim()) {
      setError('Ingresá la dirección de entrega.');
      return;
    }
    if (!form.phone.trim()) { setError('Ingresá un teléfono de contacto.'); return; }
    if (!isAuth() && !form.name.trim()) { setError('Ingresá tu nombre.'); return; }

    setSubmitting(true);
    try {
      let order: TicketOrder;
      if (isAuth()) {
        const res = await ordersAPI.create({
          delivery_address: delivery === 'envio' ? form.delivery_address : 'Retiro en el local',
          phone: form.phone,
          notes: form.notes,
          payment_method: payment,
          delivery_method: delivery,
        });
        order = res.data;
      } else {
        const res = await ordersAPI.guest({
          items: cart.items.map((i: any) => ({ product_id: i.product.id, quantity: i.quantity })),
          name: form.name,
          phone: form.phone,
          payment_method: payment,
          delivery_method: delivery,
          delivery_address: delivery === 'envio' ? form.delivery_address : '',
          notes: form.notes,
        });
        order = res.data;
      }
      await cartLib.clear();
      // Guardamos los datos del invitado para prellenar el registro si decide crear cuenta.
      if (!isAuth()) {
        localStorage.setItem('pending_register', JSON.stringify({
          first_name: form.name.split(' ')[0] || '',
          last_name: form.name.split(' ').slice(1).join(' ') || '',
          phone: form.phone,
          address: form.delivery_address,
        }));
      }
      setCreatedOrder(order);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo crear el pedido. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Genera el PDF del ticket (a partir del #print-area). La PÁGINA del PDF tiene el
  // tamaño del ticket (angosta y alta, tipo recibo) — no una hoja A4.
  const buildTicketPdf = async () => {
    const node = document.getElementById('print-area');
    if (!node || !createdOrder) throw new Error('Ticket no disponible');
    const { toPng } = await import('html-to-image');
    const { jsPDF } = await import('jspdf');
    const scale = 2; // captura en alta resolución
    // Esperar fuentes + warm-up: html-to-image suele salir en blanco el PRIMER render.
    try { await (document as any).fonts?.ready; } catch {}
    await toPng(node, { pixelRatio: 1, cacheBust: true }).catch(() => {});
    const dataUrl = await toPng(node, { backgroundColor: '#ffffff', pixelRatio: scale, cacheBust: true });
    const img = document.createElement('img');
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('img')); img.src = dataUrl; });
    const w = img.width / scale;   // ancho real del ticket en px CSS
    const h = img.height / scale;  // alto real del ticket
    const pdf = new jsPDF({ unit: 'px', format: [w, h], orientation: 'p' });
    pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
    const blob = pdf.output('blob');
    const file = new File([blob], `comprobante-${createdOrder.id}.pdf`, { type: 'application/pdf' });
    return { pdf, file };
  };

  // Descarga el PDF tamaño ticket directamente.
  const handleDownloadPdf = async () => {
    if (!createdOrder) return;
    setSharing(true);
    try {
      const { pdf } = await buildTicketPdf();
      pdf.save(`comprobante-${createdOrder.id}.pdf`);
    } catch {
      window.print(); // último recurso
    } finally {
      setSharing(false);
    }
  };

  // Envía SOLO el PDF (sin mensaje) al WhatsApp del local vía el menú de compartir.
  const handleSendTicket = async () => {
    if (!createdOrder) return;
    setSharing(true);
    try {
      const { pdf, file } = await buildTicketPdf();
      const nav = navigator as any;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          // Abre el menú de compartir con el PDF adjunto. El usuario elige WhatsApp
          // y luego selecciona el contacto de La Pinamarense para enviarlo.
          await nav.share({ files: [file], title: `Comprobante #${createdOrder.id} — La Pinamarense` });
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return; // el usuario canceló: no hacemos fallback
          // otro error de share → seguimos al fallback
        }
      }
      // Fallback (desktop / navegador sin compartir archivos): descargamos el PDF y
      // abrimos el chat del local para que el usuario lo adjunte manualmente.
      pdf.save(`comprobante-${createdOrder.id}.pdf`);
      window.open(`https://wa.me/${WHATSAPP}`, '_blank');
    } catch {
      window.open(`https://wa.me/${WHATSAPP}`, '_blank');
    } finally {
      setSharing(false);
    }
  };

  // ── Pantalla de éxito ──
  if (createdOrder) {
    return (
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        <CustomerSidebar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-[4.5rem] lg:pt-8 print:p-0 print:overflow-visible">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-center">
            <div className="mb-6 text-center print:hidden">
              <h1 className="text-2xl font-bold text-gray-900">¡Pedido confirmado!</h1>
              <p className="text-sm text-gray-500 mt-1">Mostrale este comprobante al local o enviáselo por WhatsApp.</p>
            </div>

            <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start justify-center">
              {/* Ticket */}
              <div id="print-area" className="bg-white rounded-xl shadow-sm overflow-hidden mx-auto w-full max-w-[420px]">
                <OrderTicket order={createdOrder} customerName={form.name} />
              </div>

              {/* Acciones */}
              <div className="space-y-4 print:hidden">
                {payment === 'transferencia' && (
                  <Card className="border border-green-200 bg-green-50/50 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-green-900 flex items-center gap-1.5 mb-2">
                        <Banknote className="h-4 w-4" /> Datos para la transferencia
                      </p>
                      <div className="bg-white rounded-lg p-3 space-y-1.5 border border-green-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Alias</p>
                            <p className="font-mono font-bold text-gray-900">{ALIAS}</p>
                          </div>
                          <button onClick={copyAlias} className="text-xs flex items-center gap-1 text-green-700 hover:text-green-900 font-medium">
                            {aliasCopied ? <><Check className="h-3.5 w-3.5" />Copiado</> : <><Copy className="h-3.5 w-3.5" />Copiar</>}
                          </button>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Titular</p>
                          <p className="text-sm font-medium text-gray-800">{TITULAR}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-green-800 mt-2">
                        Transferí el total y enviá el comprobante por WhatsApp para confirmar el pedido.
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={handleSendTicket} disabled={sharing} className="w-full bg-green-600 hover:bg-green-700 text-white h-11">
                    {sharing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                    Enviar comprobante por WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full h-11" onClick={handleDownloadPdf} disabled={sharing}>
                    <Printer className="h-4 w-4 mr-2" /> Descargar PDF (ticket)
                  </Button>
                </div>

                {/* CTA crear cuenta (solo invitado) */}
                {!user && (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <UserPlus className="h-5 w-5 text-green-700" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">Creá tu cuenta</p>
                      <p className="text-xs text-gray-500 mt-1 mb-3">
                        Seguí comprando más rápido y mirá el historial de tus pedidos.
                      </p>
                      <Link href="/auth?tab=register">
                        <Button className="w-full bg-green-800 hover:bg-green-700 text-white h-10 text-sm">
                          Crear cuenta gratis
                        </Button>
                      </Link>
                      <p className="text-[11px] text-gray-400 mt-2">Con tu email o con Google</p>
                    </CardContent>
                  </Card>
                )}

                <Link href="/products">
                  <Button variant="ghost" className="w-full text-gray-500 h-10">Seguir comprando</Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Formulario ──
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <CustomerSidebar />
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-[4.5rem] lg:pt-8">
        <div className="max-w-4xl mx-auto">

          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => router.push('/cart')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finalizar Compra</h1>
              <p className="text-sm text-gray-500 mt-0.5">Elegí cómo pagás y recibís tu pedido</p>
            </div>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="grid lg:grid-cols-5 gap-6">

              {/* Form — 3 cols */}
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="space-y-4">

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                  )}

                  {/* Entrega */}
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-1.5"><Truck className="h-4 w-4 text-green-600" /> ¿Cómo lo recibís?</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setDelivery('envio')}
                          className={`p-3 rounded-xl border text-left transition-all ${delivery === 'envio' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:border-gray-300'}`}>
                          <Truck className={`h-4 w-4 mb-1 ${delivery === 'envio' ? 'text-green-700' : 'text-gray-400'}`} />
                          <p className="text-sm font-semibold text-gray-900">Envío a domicilio</p>
                          <p className="text-[11px] text-gray-500">Te lo llevamos</p>
                        </button>
                        <button type="button" onClick={() => setDelivery('retiro')}
                          className={`p-3 rounded-xl border text-left transition-all ${delivery === 'retiro' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:border-gray-300'}`}>
                          <Store className={`h-4 w-4 mb-1 ${delivery === 'retiro' ? 'text-green-700' : 'text-gray-400'}`} />
                          <p className="text-sm font-semibold text-gray-900">Retiro en el local</p>
                          <p className="text-[11px] text-gray-500">Lo pasás a buscar</p>
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pago */}
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-1.5"><Wallet className="h-4 w-4 text-green-600" /> ¿Cómo pagás?</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setPayment('efectivo')}
                          className={`p-3 rounded-xl border text-left transition-all ${payment === 'efectivo' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:border-gray-300'}`}>
                          <Banknote className={`h-4 w-4 mb-1 ${payment === 'efectivo' ? 'text-green-700' : 'text-gray-400'}`} />
                          <p className="text-sm font-semibold text-gray-900">Efectivo</p>
                          <p className="text-[11px] text-gray-500">Al recibir / retirar</p>
                        </button>
                        <button type="button" onClick={() => setPayment('transferencia')}
                          className={`p-3 rounded-xl border text-left transition-all ${payment === 'transferencia' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:border-gray-300'}`}>
                          <Wallet className={`h-4 w-4 mb-1 ${payment === 'transferencia' ? 'text-green-700' : 'text-gray-400'}`} />
                          <p className="text-sm font-semibold text-gray-900">Transferencia</p>
                          <p className="text-[11px] text-gray-500">Te pasamos el alias</p>
                        </button>
                      </div>
                      {payment === 'transferencia' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                          <p className="text-green-900">Transferí a <span className="font-mono font-bold">{ALIAS}</span> a nombre de <span className="font-semibold">{TITULAR}</span> y enviá el comprobante por WhatsApp. Te mostramos el alias al confirmar.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Datos de contacto */}
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-1.5"><User className="h-4 w-4 text-green-600" /> Tus datos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {!user && (
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-400" /> Nombre y apellido <span className="text-red-500">*</span></Label>
                          <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre" className="h-10" required />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> Teléfono <span className="text-red-500">*</span></Label>
                        <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="3624 123456" className="h-10" required />
                      </div>
                      {delivery === 'envio' && (
                        <div className="space-y-1.5">
                          <Label htmlFor="delivery_address" className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" /> Dirección de entrega <span className="text-red-500">*</span></Label>
                          <Input id="delivery_address" name="delivery_address" value={form.delivery_address} onChange={handleChange} placeholder="Av. Alvear 1234, Resistencia" className="h-10" required />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-gray-400" /> Notas (opcional)</Label>
                        <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Timbre, piso, referencia..." rows={2}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none" />
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" disabled={submitting} className="w-full h-11 bg-green-800 hover:bg-green-700 text-white font-medium rounded-lg">
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando...</> : 'Confirmar pedido'}
                  </Button>
                </form>
              </div>

              {/* Resumen — 2 cols */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-sm bg-white sticky top-[4.5rem] lg:top-8">
                  <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-gray-900">Resumen del pedido</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {cart?.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {(item.product.image_url || item.product.image)
                              ? <img src={item.product.image_url || item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                              : <Package className="h-4 w-4 text-gray-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-gray-400">x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 flex-shrink-0">${Number(item.subtotal).toLocaleString('es-AR')}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>${Number(cart?.total_price).toLocaleString('es-AR')}</span></div>
                      <div className="flex justify-between text-sm text-gray-500"><span>Envío</span><span className="text-green-600 font-medium">{delivery === 'retiro' ? 'Retiro' : 'Gratis'}</span></div>
                      <div className="flex justify-between font-bold text-gray-900 pt-1"><span>Total</span><span>${Number(cart?.total_price).toLocaleString('es-AR')}</span></div>
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
