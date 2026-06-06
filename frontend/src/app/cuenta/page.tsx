'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { ordersAPI, cartAPI } from '@/lib/api';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart, ArrowRight, Loader2, Sprout, Trophy, Gem, Star,
  TrendingUp, Clock, ShoppingBag, Wallet, Receipt, CalendarDays,
  User, MapPin,
} from 'lucide-react';
import Loader from '@/components/ui/loader';

// Charts cargados solo en browser (sin SSR) para evitar el flash
const LineChart     = dynamic(() => import('@/components/charts/ClientCharts').then(m => ({ default: m.Line })),     { ssr: false });
const DoughnutChart = dynamic(() => import('@/components/charts/ClientCharts').then(m => ({ default: m.Doughnut })), { ssr: false });
const BarChart      = dynamic(() => import('@/components/charts/ClientCharts').then(m => ({ default: m.Bar })),      { ssr: false });

interface OrderItem { product: { name: string }; quantity: number; price: number; subtotal: number; }
interface Order     { id: number; status: string; total_amount: number; created_at: string; items: OrderItem[]; }

const STATUS: Record<string, { label: string; color: string; hex: string }> = {
  pending:   { label: 'Pendiente',      color: 'bg-yellow-100 text-yellow-700', hex: '#fde047' },
  confirmed: { label: 'Confirmado',     color: 'bg-blue-100 text-blue-700',     hex: '#60a5fa' },
  preparing: { label: 'En preparación', color: 'bg-orange-100 text-orange-700', hex: '#fb923c' },
  delivered: { label: 'Entregado',      color: 'bg-green-100 text-green-700',   hex: '#4ade80' },
  cancelled: { label: 'Cancelado',      color: 'bg-red-100 text-red-700',       hex: '#f87171' },
};

const LEVELS = [
  { name: 'Semilla',  min: 0,   max: 99,       color: 'text-lime-600',   bg: 'bg-lime-50',   ring: 'ring-lime-200',   Icon: Sprout },
  { name: 'Silver',   min: 100, max: 299,       color: 'text-slate-500',  bg: 'bg-slate-50',  ring: 'ring-slate-200',  Icon: Star   },
  { name: 'Gold',     min: 300, max: 599,       color: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200', Icon: Trophy },
  { name: 'Diamante', min: 600, max: Infinity,  color: 'text-sky-600',    bg: 'bg-sky-50',    ring: 'ring-sky-200',    Icon: Gem    },
];
function getLevel(pts: number) { return LEVELS.find(l => pts >= l.min && pts <= l.max) ?? LEVELS[0]; }

const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Paleta verde delicada
const G = { dark:'#166534', mid:'#16a34a', soft:'#4ade80', pale:'#86efac', mist:'#bbf7d0', fog:'#dcfce7', sage:'#6ee7b7', teal:'#2dd4bf' };
const GREEN_SHADES = [G.dark, G.mid, G.soft, G.sage, G.teal, G.pale];

export default function CuentaPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders]         = useState<Order[]>([]);
  const [storeHours, setStoreHours] = useState<number[]>(Array(24).fill(0));
  const [cartCount, setCartCount]   = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { if (!isLoading && !user) router.push('/auth'); }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      ordersAPI.getAll().catch(() => ({ data: [] })),
      cartAPI.get().catch(() => ({ data: { items: [] } })),
      ordersAPI.getSalesData().catch(() => ({ data: null })),
    ]).then(([ordersRes, cart, salesRes]) => {
      const ords = ordersRes.data as Order[];
      setOrders(ords);
      setCartCount(((cart.data as any).items as any[]).length);
      const arr = Array(24).fill(0);
      if ((salesRes.data as any)?.hourly_orders) {
        ((salesRes.data as any).hourly_orders as { hour: number; count: number }[]).forEach(({ hour, count }) => { arr[hour] = count; });
      } else {
        ords.forEach(o => { arr[new Date(o.created_at).getHours()]++; });
      }
      setStoreHours(arr);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (isLoading || !user) return null;

  // ── Stats ──
  const completedOrders = orders.filter(o => ['entregado','completado','delivered','completed'].includes(o.status));
  const totalSpent      = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const avgTicket       = orders.length ? totalSpent / orders.length : 0;
  const level           = getLevel(Math.floor(totalSpent / 100));
  const byStatus: Record<string, number> = {};
  orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
  const byDay = Array(7).fill(0);
  orders.forEach(o => { byDay[new Date(o.created_at).getDay()]++; });
  const maxDay  = Math.max(...byDay, 1);
  const maxHour = Math.max(...storeHours, 1);
  const avgHour = storeHours.reduce((s, v) => s + v, 0) / 24;
  const quietHours = storeHours.map((v,i) => ({h:i,v})).filter(x => x.v < avgHour * 0.6 && x.h >= 8 && x.h <= 21).sort((a,b) => a.v-b.v).slice(0,2).map(x=>x.h);
  const recentOrders = [...orders].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0,4);

  // ── Chart data ──
  const monthlyMap: Record<string, number> = {};
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    monthlyMap[k] = (monthlyMap[k]||0) + Number(o.total_amount);
  });
  const monthlyEntries = Object.entries(monthlyMap).sort().slice(-8);
  const last6Labels    = Array.from({length:6}, (_,i) => { const d=new Date(); d.setMonth(d.getMonth()-5+i); return MONTHS[d.getMonth()]; });
  const areaLabels     = monthlyEntries.length ? monthlyEntries.map(([k]) => MONTHS[parseInt(k.split('-')[1])-1]) : last6Labels;
  const areaValues     = monthlyEntries.length ? monthlyEntries.map(([,v]) => v) : [8500,22000,15000,38000,29000,51000];

  const areaData = {
    labels: areaLabels,
    datasets: [{
      label: 'Gasto ($)', data: areaValues, fill: true,
      borderColor: G.mid, backgroundColor: 'rgba(22,163,74,0.08)',
      pointBackgroundColor: G.mid, pointBorderColor: '#fff', pointBorderWidth: 2,
      pointRadius: 4, pointHoverRadius: 6, tension: 0.45, borderWidth: 2,
    }],
  };
  const areaOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend:{display:false}, tooltip:{callbacks:{label:(ctx:any)=>` $${Number(ctx.raw).toLocaleString('es-AR')}`}} },
    scales: {
      x: { grid:{display:false}, border:{display:false}, ticks:{font:{size:10},color:'#b0bec5'} },
      y: { grid:{color:'rgba(0,0,0,0.035)',drawTicks:false}, border:{display:false}, ticks:{font:{size:10},color:'#b0bec5',padding:6,callback:(v:any)=>`$${(Number(v)/1000).toFixed(0)}k`} },
    },
  };

  const doughnutKeys    = Object.keys(byStatus);
  const doughnutLabels  = doughnutKeys.length ? doughnutKeys.map(k => STATUS[k]?.label ?? k) : ['Entregado','Pendiente','En camino'];
  const doughnutValues  = doughnutKeys.length ? Object.values(byStatus) : [6,2,1];
  const doughnutTotal   = doughnutValues.reduce((a,b)=>a+b,0);
  const doughnutData    = {
    labels: doughnutLabels,
    datasets: [{ data: doughnutValues, backgroundColor: doughnutLabels.map((_,i)=>GREEN_SHADES[i%GREEN_SHADES.length]), borderWidth:0, hoverOffset:8 }],
  };
  const doughnutOpts = {
    responsive:true, maintainAspectRatio:false, cutout:'70%',
    plugins:{ legend:{position:'bottom' as const, labels:{font:{size:10},boxWidth:8,padding:10,color:'#6b7280'}}, tooltip:{callbacks:{label:(ctx:any)=>` ${ctx.label}: ${ctx.raw}`}} },
  };

  const dayData = byDay.some(v=>v>0) ? byDay : [2,5,3,7,4,8,1];
  const barDayData = {
    labels: DAYS,
    datasets:[{ label:'Pedidos', data:dayData, backgroundColor:dayData.map(v=>v===Math.max(...dayData)&&v>0?G.mid:v>0?G.pale:G.fog), borderRadius:8, borderSkipped:false }],
  };

  const fallbackHours = Array(24).fill(0).map((_,h)=> h<8||h>21?1:h>=11&&h<=13?8:h>=18&&h<=20?7:3);
  const hourData      = storeHours.some(v=>v>0) ? storeHours : fallbackHours;
  const peakH         = hourData.indexOf(Math.max(...hourData));
  const barHourData   = {
    labels: hourData.map((_,h)=>h%4===0?`${h}h`:''),
    datasets:[{ label:'Pedidos', data:hourData,
      backgroundColor:hourData.map((v,h)=>quietHours.includes(h)?G.dark:v>=avgHour*1.4?G.soft:G.mist),
      borderRadius:3, borderSkipped:false }],
  };

  const barOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx:any)=>` ${ctx.raw} pedidos`}}},
    scales:{
      x:{grid:{display:false},border:{display:false},ticks:{font:{size:10},color:'#b0bec5'}},
      y:{grid:{color:'rgba(0,0,0,0.035)',drawTicks:false},border:{display:false},ticks:{font:{size:10},color:'#b0bec5',stepSize:1,padding:6}},
    },
  };

  // ── Stat del gráfico de área ──
  const prev = areaValues.length >= 2 ? areaValues[areaValues.length-2] : 0;
  const last = areaValues[areaValues.length-1] ?? 0;
  const growthPct = prev > 0 ? Math.round(((last-prev)/prev)*100) : 0;
  const topDay    = dayData.indexOf(Math.max(...dayData));

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <CustomerSidebar />

      <div className="flex-1 flex overflow-hidden">

        {/* ── 2×2 chart grid ── */}
        <main className="flex-1 p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-4 overflow-y-auto lg:overflow-hidden">

          {/* 1 — Evolución de compras */}
          <Card className="border-0 shadow-sm min-h-[280px] lg:min-h-0 flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1 min-h-0">
              <div className="shrink-0 flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-green-600" /> Evolución de compras
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Gasto mensual acumulado</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${growthPct>=0?'bg-green-50 text-green-700':'bg-red-50 text-red-500'}`}>
                  {growthPct>=0?'+':''}{growthPct}% vs mes ant.
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <LineChart data={areaData} options={areaOpts as any} />
              </div>
              <div className="shrink-0 grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                {[
                  { label:'Total período',    value:`$${areaValues.reduce((a,b)=>a+b,0).toLocaleString('es-AR')}` },
                  { label:'Mejor mes',        value:`$${Math.max(...areaValues).toLocaleString('es-AR')}` },
                  { label:'Promedio mensual', value:`$${Math.round(areaValues.reduce((a,b)=>a+b,0)/Math.max(areaValues.length,1)).toLocaleString('es-AR')}` },
                ].map(s=>(
                  <div key={s.label} className="text-center">
                    <p className="text-xs font-bold text-gray-800">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2 — Estado de pedidos */}
          <Card className="border-0 shadow-sm min-h-[280px] lg:min-h-0 flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1 min-h-0">
              <div className="shrink-0 mb-2">
                <p className="text-sm font-semibold text-gray-900">Estado de pedidos</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Distribución por estado</p>
              </div>
              <div className="flex-1 min-h-0 relative">
                <DoughnutChart data={doughnutData} options={doughnutOpts} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{paddingBottom:'32px'}}>
                  <p className="text-2xl font-extrabold text-gray-800">{doughnutTotal}</p>
                  <p className="text-[10px] text-gray-400">pedidos</p>
                </div>
              </div>
              <div className="shrink-0 grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-gray-50">
                <div className="bg-green-50 rounded-xl p-2 text-center">
                  <p className="text-base font-extrabold text-green-700">{completedOrders.length || doughnutValues[0]}</p>
                  <p className="text-[10px] text-gray-500">Entregados</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-base font-extrabold text-gray-700">
                    {doughnutTotal>0 ? `${Math.round(((completedOrders.length||doughnutValues[0])/doughnutTotal)*100)}%` : '—'}
                  </p>
                  <p className="text-[10px] text-gray-500">Tasa éxito</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3 — Mis días de compra */}
          <Card className="border-0 shadow-sm min-h-[280px] lg:min-h-0 flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1 min-h-0">
              <div className="shrink-0 flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-green-600" /> Mis días de compra
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Pedidos por día de la semana</p>
                </div>
                <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-full shrink-0">
                  {DAYS[topDay]} es tu día
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <BarChart data={barDayData} options={barOpts as any} />
              </div>
              <div className="shrink-0 grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                {[
                  { label:'Total', value:dayData.reduce((a,b)=>a+b,0) },
                  { label:'Récord', value:`${Math.max(...dayData)} ped.` },
                  { label:'Finde', value:`${dayData[0]+dayData[6]} ped.` },
                ].map(s=>(
                  <div key={s.label} className="text-center">
                    <p className="text-xs font-bold text-gray-800">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4 — Tráfico por hora */}
          <Card className="border-0 shadow-sm min-h-[280px] lg:min-h-0 flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1 min-h-0">
              <div className="shrink-0 flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-green-600" /> Tráfico por hora
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Actividad en la tienda</p>
                </div>
                {quietHours.length > 0 && (
                  <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-full shrink-0">
                    Tranquilo a las {quietHours[0]}h
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-0">
                <BarChart data={barHourData} options={barOpts as any} />
              </div>
              <div className="shrink-0 flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:G.dark}} /> Bajo</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:G.mist}} /> Normal</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:G.soft}} /> Pico</span>
                </div>
                <span className="text-[10px] text-gray-400">Pico: <span className="font-semibold text-gray-600">{peakH}:00h</span></span>
              </div>
            </CardContent>
          </Card>

        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="w-64 flex-shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-y-auto no-scrollbar">
          <div className="p-5 flex flex-col gap-5">

            {/* Perfil */}
            <div className="text-center">
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 ring-2 ${level.ring} overflow-hidden flex items-center justify-center ${user.avatar ? '' : level.bg}`}>
                {user.avatar
                  ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : <User className={`h-7 w-7 ${level.color}`} />
                }
              </div>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">{user.email}</p>
              {user.address && (
                <p className="flex items-center justify-center gap-1 mt-1 text-[10px] text-gray-400">
                  <MapPin className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{user.address}</span>
                </p>
              )}
              <div className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${level.bg} ${level.color}`}>
                <level.Icon className="h-3.5 w-3.5" /> {level.name}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* KPIs */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Resumen</p>
              {[
                { label:'Total gastado',   value:`$${totalSpent.toLocaleString('es-AR')}`,            Icon:Wallet,       cls:'text-green-700 bg-green-50'  },
                { label:'Pedidos',         value:orders.length,                                        Icon:ShoppingBag,  cls:'text-blue-700 bg-blue-50'    },
                { label:'Ticket promedio', value:`$${Math.round(avgTicket).toLocaleString('es-AR')}`, Icon:Receipt,      cls:'text-orange-700 bg-orange-50' },
                { label:'En carrito',      value:cartCount,                                            Icon:ShoppingCart, cls:'text-purple-700 bg-purple-50' },
              ].map(k=>(
                <div key={k.label} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${k.cls}`}>
                    <k.Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400">{k.label}</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{loading?'—':k.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {!loading && orders.length > 0 && (<>
              <hr className="border-gray-100" />

              {/* Estado */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Estado de pedidos</p>
                <div className="space-y-1.5">
                  {Object.entries(byStatus).sort((a,b)=>b[1]-a[1]).map(([st,cnt])=>{
                    const s=STATUS[st]??{label:st,color:'bg-gray-100 text-gray-600',hex:'#9ca3af'};
                    return (
                      <div key={st} className="flex items-center justify-between">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                        <span className="text-xs font-bold text-gray-600">{cnt}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-green-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-extrabold text-green-700">{completedOrders.length}</p>
                    <p className="text-[10px] text-gray-500">Entregados</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-extrabold text-gray-700">{orders.length?Math.round((completedOrders.length/orders.length)*100):0}%</p>
                    <p className="text-[10px] text-gray-500">Tasa éxito</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Últimos pedidos */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Últimos pedidos</p>
                  <Link href="/orders" className="text-[10px] text-green-700 hover:underline">Ver todos</Link>
                </div>
                <div className="space-y-2">
                  {recentOrders.slice(0,4).map(order=>{
                    const s=STATUS[order.status]??{label:order.status,color:'bg-gray-100 text-gray-600',hex:'#9ca3af'};
                    return (
                      <div key={order.id} className="p-2.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-800">Pedido #{order.id}</span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">{order.items.slice(0,2).map(i=>i.product.name).join(', ')}{order.items.length>2?'…':''}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}</span>
                          <span className="text-xs font-bold text-gray-900">${Number(order.total_amount).toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>)}

            {loading && (
              <Loader />
            )}

            {!loading && orders.length === 0 && (
              <div className="text-center py-4">
                <ShoppingBag className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-3">Realizá tu primer pedido</p>
                <Link href="/products">
                  <Button className="bg-green-800 hover:bg-green-700 text-white h-8 text-xs w-full">
                    Ir a la tienda <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}
