'use client';

// Ticket / comprobante reutilizable de un pedido (diseño tipo recibo térmico).
// Se usa en el detalle de pedidos y en la confirmación de compra (para imprimir / PDF).

export interface TicketOrder {
  id: number;
  created_at?: string;
  status?: string;
  total_amount: number | string;
  delivery_address?: string;
  phone?: string;
  notes?: string;
  guest_name?: string;
  payment_method_display?: string;
  delivery_method_display?: string;
  items: { product: { name: string }; quantity: number; price: number | string; subtotal: number | string }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
  delivered: 'Entregado', cancelled: 'Cancelado',
};

function TicketPine() {
  return (
    <svg width="34" height="42" viewBox="0 0 72 90" fill="none" aria-hidden="true">
      <rect x="33" y="68" width="6" height="16" rx="1.5" className="fill-amber-700" />
      <path d="M36 62 L12 62 Q16 56 22 54 L18 54 Q22 48 28 46" className="stroke-green-900 fill-green-800/90" />
      <path d="M36 62 L60 62 Q56 56 50 54 L54 54 Q50 48 44 46" className="stroke-green-900 fill-green-800/90" />
      <path d="M36 46 L16 50 Q20 44 24 42 L20 42 Q24 36 30 34" className="stroke-green-800 fill-green-700/90" />
      <path d="M36 46 L56 50 Q52 44 48 42 L52 42 Q48 36 42 34" className="stroke-green-800 fill-green-700/90" />
      <path d="M36 34 L22 38 Q26 32 30 30 L26 30 Q30 24 34 22" className="stroke-green-700 fill-green-600/90" />
      <path d="M36 34 L50 38 Q46 32 42 30 L46 30 Q42 24 38 22" className="stroke-green-700 fill-green-600/90" />
      <path d="M36 8 L28 22 Q32 18 36 20 Q40 18 44 22 Z" className="fill-green-600" />
      <line x1="36" y1="8" x2="36" y2="68" className="stroke-[2.5] stroke-amber-700" />
    </svg>
  );
}

export default function OrderTicket({ order, customerName }: { order: TicketOrder; customerName?: string }) {
  const created = order.created_at ? new Date(order.created_at) : new Date();
  const name = customerName || order.guest_name || '';
  const articulos = order.items.reduce((n, it) => n + it.quantity, 0);

  return (
    <div className="bg-white text-gray-800 font-mono" id={`ticket-${order.id}`}>
      <div className="px-6 pt-5 pb-4">
        {/* Logo */}
        <div className="flex flex-col items-center text-center gap-0.5">
          <TicketPine />
          <p className="text-xl font-bold tracking-[0.18em] text-green-900 mt-1.5">LA PINAMARENSE</p>
          <p className="text-[11px] text-gray-500 uppercase tracking-[0.15em]">Fiambres · Picadas · Combos</p>
        </div>
        <div className="text-center text-[11px] text-gray-500 leading-relaxed mt-2.5">
          <p>Resistencia · B° España, Mz 79, Local 8</p>
          <p>Fontana · Av. Alvear 3500</p>
          <p>WhatsApp 3624-219435</p>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        {/* Datos del comprobante */}
        <div className="text-[13px] space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Comprobante</span><span className="font-bold">N° {String(order.id).padStart(6, '0')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span>{created.toLocaleDateString('es-AR')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Hora</span><span>{created.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span></div>
          {order.status && <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className="uppercase font-semibold">{STATUS_LABEL[order.status] ?? order.status}</span></div>}
          {name && <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="truncate ml-2 max-w-[55%] text-right">{name}</span></div>}
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        {/* Items */}
        <div className="flex text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">
          <span className="flex-1">Descripción</span>
          <span className="w-16 sm:w-24 text-right">Importe</span>
        </div>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="text-[13px]">
              <p className="line-clamp-1 text-gray-800">{item.product.name}</p>
              <div className="flex text-gray-500">
                <span className="flex-1">{item.quantity} x ${Number(item.price).toLocaleString('es-AR')}</span>
                <span className="w-16 sm:w-24 text-right text-gray-800 font-medium">${Number(item.subtotal).toLocaleString('es-AR')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        {/* Totales */}
        <div className="text-[13px] space-y-1">
          <div className="flex justify-between text-gray-500"><span>Artículos</span><span>{articulos}</span></div>
          {order.payment_method_display && <div className="flex justify-between text-gray-500"><span>Pago</span><span>{order.payment_method_display}</span></div>}
          {order.delivery_method_display && <div className="flex justify-between text-gray-500"><span>Entrega</span><span>{order.delivery_method_display}</span></div>}
        </div>
        <div className="flex justify-between items-baseline mt-2.5 pt-2.5 border-t-2 border-double border-gray-400">
          <span className="text-lg font-bold">TOTAL</span>
          <span className="text-xl font-extrabold">${Number(order.total_amount).toLocaleString('es-AR')}</span>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        {/* Entrega */}
        <div className="text-[12px] text-gray-600 space-y-1">
          {order.delivery_address && <p className="break-words"><span className="text-gray-400">▸ Entrega: </span>{order.delivery_address}</p>}
          {order.phone && <p><span className="text-gray-400">▸ Tel: </span>{order.phone}</p>}
          {order.notes && <p className="break-words"><span className="text-gray-400">▸ Nota: </span>{order.notes}</p>}
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        {/* Pie */}
        <p className="text-center text-[13px] font-semibold text-gray-700">¡Gracias por tu compra!</p>
        <p className="text-center text-[11px] text-gray-400 mt-1">@lapinamarense · Comprobante no válido como factura</p>

        {/* Código de barras */}
        <div className="mt-3 flex flex-col items-center">
          <div className="flex items-end gap-[1px] h-9">
            {Array.from({ length: 50 }, (_, i) => {
              const w = ((order.id * 7 + i * 31) % 3) + 1;
              return <div key={i} className="bg-gray-900 h-full" style={{ width: `${w}px` }} />;
            })}
          </div>
          <p className="text-[11px] tracking-[0.35em] text-gray-500 mt-1.5">{`7790${String(order.id).padStart(8, '0')}`}</p>
        </div>
      </div>

      {/* Borde inferior dentado */}
      <div
        className="w-full h-2.5"
        style={{
          backgroundImage: 'linear-gradient(45deg, transparent 50%, #fff 50%), linear-gradient(-45deg, transparent 50%, #fff 50%)',
          backgroundSize: '10px 10px', backgroundRepeat: 'repeat-x', backgroundPosition: 'top',
        }}
      />
    </div>
  );
}
