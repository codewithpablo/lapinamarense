'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, LayoutGroup } from 'framer-motion';
import AutoScroll from 'embla-carousel-auto-scroll';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { productsAPI, categoriesAPI } from '@/lib/api';
import Loader, { setTheme, getStoredTheme } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import {
  Truck, Shield, Clock, Star, ArrowRight, Package,
  Heart, CheckCircle2, ChevronRight, Menu, X, Sparkles, MapPin,
  Sun, Moon, Instagram,
} from 'lucide-react';

const productImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80",
  "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80",
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&q=80",
];

const carouselImages = [
  "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&q=80", // tabla de fiambres
  "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&q=80", // quesos
  "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80", // salame en rodajas
  "https://images.unsplash.com/photo-1631379578550-7038263db699?w=800&q=80", // tabla de quesos
  "https://images.unsplash.com/photo-1601000938259-9e92002320b2?w=800&q=80", // picada / charcutería
  "https://images.unsplash.com/photo-1452251889946-8ff5ea7b27ab?w=800&q=80", // fiambres / embutidos
  "https://images.unsplash.com/photo-1438522014717-d7ce32b9bab9?w=800&q=80", // quesos
  "https://images.unsplash.com/photo-1626957341926-98752fc2ba90?w=800&q=80", // queso en cuña
  "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=800&q=80", // tabla picada
];

const photoLabels = [
  'Tabla de fiambres',
  'Quesos seleccionados',
  'Salame artesanal',
  'Tabla de quesos',
  'Picadas para compartir',
  'Jamón crudo y cocido',
  'Salamines',
  'Quesos especiales',
  'Picada La Pinamarense',
];

const CELL = 130;
const GRID_GAP = 5;
const COLS = 3;
const ROWS = 3;

const gridOrders = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [4, 7, 1, 8, 0, 5, 2, 6, 3],
  [6, 3, 8, 1, 5, 0, 7, 2, 4],
  [8, 0, 5, 2, 6, 3, 4, 1, 7],
  [3, 5, 7, 0, 8, 2, 1, 4, 6],
];

function PhotoGrid() {
  const [orderIdx, setOrderIdx] = useState(0);
  const [focusIdx, setFocusIdx] = useState(0);
  const [inspecting, setInspecting] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (inspecting !== null) return; // pausar reorder mientras inspecciona
    const interval = setInterval(() => {
      setOrderIdx(prev => (prev + 1) % gridOrders.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [inspecting]);

  const order = gridOrders[orderIdx];

  useEffect(() => {
    setFocusIdx(order[4]);
  }, [orderIdx]);

  const getPos = (slot: number) => ({
    x: (slot % COLS) * (CELL + GRID_GAP),
    y: Math.floor(slot / COLS) * (CELL + GRID_GAP),
  });

  const positions: Record<number, { x: number; y: number }> = {};
  order.forEach((imgIdx, slot) => { positions[imgIdx] = getPos(slot); });

  const totalW = COLS * CELL + (COLS - 1) * GRID_GAP;
  const totalH = ROWS * CELL + (ROWS - 1) * GRID_GAP;

  // Escala la grilla (de ancho fijo) para que quepa en el contenedor disponible,
  // sin agrandarla más allá de su tamaño natural. Evita el desborde en mobile.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const avail = el.clientWidth;
      setScale(avail > 0 ? Math.min(1, avail / totalW) : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [totalW]);

  return (
    <>
      <div ref={wrapperRef} className="w-full flex flex-col items-center overflow-hidden">
        <div style={{ width: totalW * scale, height: totalH * scale }} className="relative">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
        <LayoutGroup>
          <div className="relative" style={{ height: totalH, width: totalW, margin: '0 auto' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(imgIdx => {
              const pos = positions[imgIdx];
              const isFocused = imgIdx === focusIdx;
              return (
                <motion.div
                  key={imgIdx}
                  layoutId={`grid-${imgIdx}`}
                  className={`absolute rounded-xl overflow-hidden shadow-lg border cursor-pointer ${isFocused ? 'border-white/80' : 'border-white/30'}`}
                  animate={{
                    x: pos.x,
                    y: pos.y,
                    width: CELL,
                    height: CELL,
                    filter: isFocused ? 'blur(0px) brightness(1.05)' : 'blur(0.5px) brightness(0.9)',
                  }}
                  transition={{
                    duration: 1.4,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{ zIndex: isFocused ? 10 : 1 }}
                  onClick={() => setInspecting(imgIdx)}
                >
                  <img
                    src={carouselImages[imgIdx]}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.onerror = null;
                      t.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%2316a34a"/></svg>';
                    }}
                  />
                  {isFocused && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <p className="text-white text-xs font-semibold">{photoLabels[imgIdx]}</p>
                    </motion.div>
                  )}
                  {isFocused && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-white/60 rounded-tl-sm" />
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-white/60 rounded-tr-sm" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-white/60 rounded-bl-sm" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-white/60 rounded-br-sm" />
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </LayoutGroup>
        </div>
        </div>
        <div className="flex justify-between items-center mt-3 px-1" style={{ width: totalW * scale }}>
          <span className="text-[10px] text-white/40 font-mono">{String(focusIdx + 1).padStart(2, '0')}/09</span>
          <div className="flex items-center gap-1.5">
            <Instagram className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[10px] text-white/40 font-mono">@lapinamarense</span>
          </div>
        </div>
      </div>

      {/* Inspect mode — primera persona */}
      {inspecting !== null && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setInspecting(null)}
        >
          {/* Fondo blur */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Foto acercandose */}
          <motion.div
            className="relative z-10 max-w-lg w-[90vw] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.2, 0, 0.2, 1] }}
          >
            <img
              src={carouselImages[inspecting]}
              alt={photoLabels[inspecting]}
              className="w-full h-full object-cover"
            />

            {/* Label abajo */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 py-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="text-white text-lg font-bold">{photoLabels[inspecting]}</p>
              <p className="text-white/50 text-xs mt-1">@lapinamarense</p>
            </motion.div>

          </motion.div>

          {/* Hint para cerrar */}
          <motion.p
            className="absolute bottom-8 text-white/30 text-xs font-mono z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            toca para volver
          </motion.p>
        </motion.div>
      )}
    </>
  );
}

interface Product {
  id: number;
  name: string;
  net_content: string;
  price: number;
  image?: string | null;
  stock: number;
  category_name?: string;
}

interface Category { id: number; name: string; }

export default function Home() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [isWelcome] = useState(() => {
    if (typeof window === 'undefined') return false;
    const visited = sessionStorage.getItem('lp_visited');
    if (!visited) { sessionStorage.setItem('lp_visited', '1'); return true; }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark]           = useState(false);

  useEffect(() => {
    setDark(getStoredTheme());

    if (isWelcome) {
      setTimeout(() => setReady(true), 5000);
    }

    Promise.all([productsAPI.getAll({}), categoriesAPI.getAll()])
      .then(([p, c]) => { setProducts(p.data); setCategories(c.data); })
      .catch(() => {})
      .finally(() => {
        setDataReady(true);
        if (!isWelcome) setReady(true);
      });
  }, []);

  const toggleDark = (v: boolean) => {
    setDark(v);
    setTheme(v);
  };

  if (!ready || !dataReady) {
    return <Loader fullScreen welcome={isWelcome} />;
  }

  // ── theme tokens ──────────────────────────────────────────────────────────
  const D = dark;

  const bg         = D ? 'bg-green-950'                          : 'bg-white';
  const navBg      = D ? 'bg-green-950/90 border-white/10'       : 'bg-white/40 border-gray-100/50';
  const navLink    = D ? 'text-green-300 hover:text-white'        : 'text-gray-600 hover:text-gray-900';
  const navBrand   = D ? 'text-white'                             : 'text-gray-900';
  const mobileBg   = D ? 'bg-green-950 border-white/10'          : 'bg-white border-gray-100';

  const heroBg     = D ? 'bg-green-950'                          : 'bg-gradient-to-b from-green-50/50 to-white';
  const heroTitle  = D ? 'text-white'                            : 'text-gray-900';
  const heroSub    = D ? 'text-green-200'                        : 'text-gray-600';
  const heroBadge  = D ? 'bg-white/10 text-green-300'            : 'bg-green-100 text-green-700';
  const heroStat   = D ? 'text-white'                            : 'text-gray-900';
  const heroStatL  = D ? 'text-green-400'                        : 'text-gray-500';
  const heroBtnOut = D ? 'border-white/50 !text-white bg-transparent hover:bg-white/15 hover:!text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50';

  const secBorder  = D ? 'border-white/10'                       : 'border-gray-100';
  const label      = D ? 'text-green-400'                        : 'text-green-700';
  const title      = D ? 'text-white'                            : 'text-gray-900';
  const muted      = D ? 'text-green-300'                        : 'text-gray-500';
  const accentLine = D ? 'bg-green-400'                          : 'bg-green-700';
  const divider    = D ? 'divide-white/10'                       : 'divide-gray-100';
  const borderCol  = D ? 'border-white/10'                       : 'border-gray-100';
  const numColor   = D ? 'text-white/10'                         : 'text-gray-100';
  const iconBg     = D ? 'bg-white/5 group-hover:bg-white/10'    : 'bg-gray-50 group-hover:bg-green-50';
  const iconColor  = D ? 'text-green-400'                        : 'text-green-800';
  const chevColor  = D ? 'text-white/20 group-hover:text-green-400' : 'text-gray-200 group-hover:text-green-400';
  const statVal    = D ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-800';
  const statSub    = D ? 'text-green-200'                        : 'text-gray-700';
  const statSubSub = D ? 'text-green-500'                        : 'text-gray-400';
  const footerLink = D ? 'text-green-400 hover:text-white'       : 'text-gray-500 hover:text-gray-900';
  const footerCopy = D ? 'text-green-600'                        : 'text-gray-400';

  return (
    <div className={`${bg} transition-colors duration-300 relative`}>
      {/* ── Círculos difuminados de fondo (light mode) ── */}
      {!D && (
        <>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-visible hidden sm:block">
            <div className="absolute top-[5%] left-[10%] w-[500px] h-[500px] rounded-full bg-green-500/30 blur-[100px]" />
            <div className="absolute top-[30%] right-[5%] w-[400px] h-[400px] rounded-full bg-green-400/25 blur-[80px]" />
            <div className="absolute top-[55%] left-[45%] w-[600px] h-[600px] rounded-full bg-green-500/20 blur-[110px]" />
            <div className="absolute top-[75%] left-[5%] w-[350px] h-[350px] rounded-full bg-green-400/30 blur-[90px]" />
            <div className="absolute top-[90%] right-[15%] w-[450px] h-[450px] rounded-full bg-green-500/25 blur-[100px]" />
          </div>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-visible sm:hidden">
            <div className="absolute top-[10%] left-[5%] w-[200px] h-[200px] rounded-full bg-green-500/15 blur-[80px]" />
            <div className="absolute top-[40%] right-[0%] w-[180px] h-[180px] rounded-full bg-green-400/10 blur-[70px]" />
            <div className="absolute top-[75%] left-[10%] w-[160px] h-[160px] rounded-full bg-green-500/12 blur-[70px]" />
          </div>
        </>
      )}

      {/* ── Navbar ── */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl h-16 border-b transition-colors duration-300 ${navBg}`}>
        <div className="w-full px-4 sm:px-6 lg:px-12 h-full flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-12">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-500 rounded-lg flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className={`text-base sm:text-xl font-semibold transition-colors duration-300 ${navBrand}`}>La Pinamarense</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {['Productos:/products','Nosotros:/about','Contacto:/contact'].map(item => {
                const [lbl, href] = item.split(':');
                return <Link key={href} href={href} className={`text-sm transition-colors ${navLink}`}>{lbl}</Link>;
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/auth" className={`hidden md:block text-sm transition-colors ${navLink}`}>Iniciar sesión</Link>
            <Link href="/auth?tab=register" className="hidden sm:block">
              <Button className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-xl font-medium">
                Comenzar gratis
              </Button>
            </Link>
            <button
              onClick={() => toggleDark(!dark)}
              className={`p-2 rounded-lg transition-colors ${D ? 'bg-white/10 text-yellow-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {D ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="md:hidden p-1.5" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X className={`h-5 w-5 ${D ? 'text-white' : 'text-gray-700'}`} /> : <Menu className={`h-5 w-5 ${D ? 'text-white' : 'text-gray-700'}`} />}
            </button>
          </div>
        </div>
        <motion.div
          className={`md:hidden border-t overflow-hidden ${D ? 'border-white/10' : 'border-gray-100/50'}`}
          initial={false}
          animate={{
            height: mobileOpen ? 'auto' : 0,
            opacity: mobileOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className={`px-5 py-5 space-y-1 ${D ? 'bg-green-900' : 'bg-green-50'}`}>
            {[
              { label: 'Productos', href: '/products', icon: Package },
              { label: 'Nosotros', href: '/about', icon: Heart },
              { label: 'Contacto', href: '/contact', icon: Star },
            ].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-medium transition-colors ${D ? 'text-green-200 hover:bg-white/10 hover:text-white' : 'text-gray-700 hover:bg-green-100 hover:text-green-800'}`}
              >
                <item.icon className="h-4 w-4 opacity-60" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="h-4 w-4 opacity-40" />
              </Link>
            ))}
            <div className={`my-3 h-px ${D ? 'bg-white/10' : 'bg-green-200'}`} />
            <div className="flex gap-2">
              <Link href="/auth" onClick={() => setMobileOpen(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-medium transition-colors ${D ? 'text-white border border-white/20 hover:bg-white/10' : 'text-gray-800 border border-gray-200 hover:bg-gray-50'}`}
              >
                <Shield className="h-4 w-4" />
                Iniciar sesión
              </Link>
              <Link href="/auth?tab=register" onClick={() => setMobileOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-semibold bg-green-700 hover:bg-green-600 text-white transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Comenzar gratis
              </Link>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* ── Cinta informativa ── */}
      <div className={`overflow-hidden whitespace-nowrap ${D ? 'bg-gradient-to-r from-green-950 via-green-800 to-green-950 text-green-300' : 'bg-gradient-to-r from-green-800 via-green-600 to-green-800 text-white'}`}>
        <div className="animate-marquee inline-flex gap-16 py-1.5 text-xs font-medium">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="inline-flex gap-16">
              <span>Envios a domicilio en Resistencia y Fontana</span>
              <span>Sucursal Resistencia: B° España, Mz 79, Local 8</span>
              <span>Sucursal Fontana: Av. Alvear 3500</span>
              <span>Fiambres · Picadas · Combos · Bebidas · Congelados</span>
              <span>Pedidos por WhatsApp: 3624-219435</span>
              <span>Ofertas nuevas todas las semanas</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className={`min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] px-5 sm:px-8 lg:px-12 py-8 lg:py-0 flex items-center transition-colors duration-300 ${heroBg}`}>
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] sm:leading-[1.05] tracking-tight ${heroTitle}`}>
              Tu <span className="font-fiambreria">fiambrería</span> de confianza, ahora online
            </h1>
            <p className={`text-base sm:text-lg lg:text-xl mb-6 sm:mb-10 leading-relaxed ${heroSub}`}>
              Comprá productos frescos de calidad premium y recibilos en la puerta de tu casa.
            </p>
            <motion.div
              className="flex flex-col sm:flex-row gap-3 mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto bg-green-700 hover:bg-green-600 text-white px-6 sm:px-8 py-3 rounded-xl font-medium shadow-lg">
                  Comprar ahora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button size="lg" variant="outline" className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-medium ${heroBtnOut}`}>
                  Crear cuenta gratis
                </Button>
              </Link>
            </motion.div>
            <motion.div
              className="grid grid-cols-3 gap-4 sm:gap-8 max-w-xs sm:max-w-lg mx-auto lg:mx-0 text-center lg:text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {[['500+','Productos'],['24/7','Disponible'],['100%','Garantía']].map(([v,l]) => (
                <div key={l}>
                  <div className={`text-2xl sm:text-3xl font-bold mb-1 ${heroStat}`}>{v}</div>
                  <div className={`text-xs sm:text-sm ${heroStatL}`}>{l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
          <motion.div
            className="w-full lg:w-1/2 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            <PhotoGrid />
          </motion.div>
        </div>
      </section>

      {/* ── Products ── */}
      <section className={`border-t ${secBorder}`}>
        <motion.div
          className="flex items-end justify-between px-5 sm:px-8 lg:px-12 pt-8 sm:pt-12 lg:pt-16 pb-6 sm:pb-8 lg:pb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div>
            <p className={`text-xs font-semibold tracking-[0.25em] uppercase mb-2 sm:mb-3 ${label}`}>Catálogo</p>
            <h2 className={`text-2xl sm:text-3xl lg:text-5xl font-bold ${title}`}>Productos destacados</h2>
          </div>
          <Link href="/products" className={`flex items-center gap-1.5 transition-colors text-xs sm:text-sm font-semibold ${label}`}>
            Ver todos <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </motion.div>
        <motion.div
          className="px-5 sm:px-8 lg:px-12 pb-8 sm:pb-12 lg:pb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Carousel
            opts={{ loop: true, align: 'start' }}
            plugins={[AutoScroll({ speed: 1, stopOnInteraction: false, stopOnMouseEnter: false })]}
            className="w-full"
          >
            <CarouselContent className="-ml-3 sm:-ml-5">
              {products.slice(0, 8).map((product, idx) => (
                <CarouselItem key={product.id} className="pl-3 sm:pl-5 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <Link href="/products"
                    className={`border rounded-2xl p-4 sm:p-5 flex flex-col transition-all duration-200 group h-full ${D ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="w-full aspect-square rounded-xl mb-3 sm:mb-4 overflow-hidden shrink-0">
                      <img
                        src={productImages[idx % productImages.length]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className={`font-semibold text-xs sm:text-sm line-clamp-2 mb-1 flex-1 ${title}`}>{product.name}</p>
                    <p className={`text-lg sm:text-2xl font-bold mt-2 ${label}`}>${product.price}</p>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className={`h-screen flex items-center px-5 sm:px-8 lg:px-12 border-t overflow-hidden ${secBorder}`}>
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <p className={`text-xs font-semibold tracking-[0.25em] uppercase mb-5 ${label}`}>¿Por qué elegirnos?</p>
            <h2 className={`text-5xl xl:text-6xl font-bold leading-[1.1] mb-8 ${title}`}>
              Experiencia<br />que marca<br />la diferencia.
            </h2>
            <div className={`w-14 h-1 rounded-full mb-8 ${accentLine}`} />
            <p className={`text-lg leading-relaxed max-w-sm ${muted}`}>
              Cada detalle está pensado para que tu experiencia sea simple, rápida y confiable.
            </p>
          </motion.div>
          <div className="w-full">
            <motion.div
              className="lg:hidden mb-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className={`text-xs font-semibold tracking-[0.25em] uppercase mb-2 ${label}`}>¿Por qué elegirnos?</p>
              <h2 className={`text-2xl sm:text-3xl font-bold ${title}`}>Experiencia que marca la diferencia.</h2>
            </motion.div>
            <div className={`divide-y ${divider}`}>
              {[
                { icon: Truck,  title: 'Envío Express',       desc: 'Entrega en menos de 24 horas.' },
                { icon: Shield, title: 'Calidad Garantizada', desc: 'Productos frescos seleccionados.' },
                { icon: Clock,  title: 'Siempre Disponible',  desc: 'Comprá 24/7 online.' },
                { icon: Star,   title: 'Precios Imbatibles',  desc: 'Las mejores ofertas, sin letra chica.' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 sm:gap-6 py-4 sm:py-5 lg:py-6 group cursor-default"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                >
                  <span className={`text-3xl sm:text-4xl lg:text-5xl font-bold w-10 sm:w-14 shrink-0 select-none ${numColor}`}>0{i+1}</span>
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-colors ${iconBg}`}>
                    <f.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm sm:text-base mb-0.5 ${title}`}>{f.title}</p>
                    <p className={`text-xs sm:text-sm ${muted}`}>{f.desc}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${chevColor}`} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={`h-screen flex flex-col justify-center px-5 sm:px-8 lg:px-12 border-t ${secBorder}`}>
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            className={`flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 lg:mb-16 border-b pb-6 sm:pb-8 gap-3 ${borderCol}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div>
              <p className={`text-xs font-semibold tracking-[0.25em] uppercase mb-2 sm:mb-3 ${label}`}>Nuestros números</p>
              <h2 className={`text-3xl sm:text-4xl lg:text-6xl font-bold ${title}`}>Cifras que<br />nos definen.</h2>
            </div>
            <p className={`text-sm max-w-xs hidden lg:block ${muted}`}>
              Cada número refleja el compromiso con nuestros clientes.
            </p>
          </motion.div>
          <div className={`grid grid-cols-2 lg:grid-cols-4 divide-x ${divider}`}>
            {[
              { value: '10K+', label: 'Clientes satisfechos', sub: 'y creciendo' },
              { value: '50K+', label: 'Pedidos entregados',   sub: 'desde que abrimos' },
              { value: '98%',  label: 'Satisfacción',         sub: 'según encuestas' },
              { value: '5★',   label: 'Calificación',         sub: 'en reseñas verificadas' },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 group"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              >
                <div className={`text-4xl sm:text-5xl lg:text-7xl font-bold mb-2 sm:mb-3 tracking-tight transition-colors ${statVal}`}>{s.value}</div>
                <p className={`font-semibold text-sm sm:text-base mb-1 ${statSub}`}>{s.label}</p>
                <p className={`text-xs ${statSubSub}`}>{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`h-screen flex overflow-hidden relative border-t ${secBorder}`}>
        {!D && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-green-400/35 blur-[80px] pointer-events-none z-[1]" />
        )}
        <div className="relative z-10 flex flex-col lg:flex-row w-full">
          <motion.div
            className="flex-1 flex flex-col justify-center px-5 sm:px-8 lg:px-20 py-10 sm:py-14 lg:py-16"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <p className={`text-xs font-semibold tracking-[0.25em] uppercase mb-4 sm:mb-6 ${label}`}>Empezá hoy</p>
            <h2 className={`text-3xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-5 sm:mb-8 ${title}`}>
              ¿Listo para<br />comenzar?
            </h2>
            <p className={`text-sm sm:text-base lg:text-lg leading-relaxed max-w-md mb-8 sm:mb-12 ${muted}`}>
              Registrate gratis y accedé a cientos de productos con entrega a domicilio en Pinamar y alrededores.
            </p>
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/auth?tab=register">
                <Button size="lg" className={`w-full sm:w-auto font-semibold px-6 sm:px-8 py-3 rounded-xl shadow-lg transition-all ${D ? 'bg-white hover:bg-gray-100 text-green-950' : 'bg-green-700 hover:bg-green-600 text-white'}`}>
                  Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-medium transition-all ${D ? 'border-white/50 !text-white bg-transparent hover:bg-white/15 hover:!text-white' : 'border-gray-300 text-gray-900 hover:bg-gray-100'}`}>
                  Iniciar sesión
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          <div className={`hidden lg:flex w-80 xl:w-96 flex-col justify-center px-12 gap-6 border-l backdrop-blur-xl ${D ? 'bg-white/5 border-white/10' : 'bg-white/40 border-gray-100/50'}`}>
            {[
              { icon: CheckCircle2, title: 'Sin comisiones',    desc: 'Pagás el precio del producto, nada más.' },
              { icon: Truck,        title: 'Envío a domicilio', desc: 'Entregamos en menos de 24hs.' },
              { icon: Heart,        title: 'Soporte humano',    desc: 'Un equipo real para ayudarte.' },
            ].map((b, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.15, ease: 'easeOut' }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${D ? 'bg-white/10' : 'bg-green-100'}`}>
                  <b.icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${title}`}>{b.title}</p>
                  <p className={`text-xs mt-0.5 ${muted}`}>{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`border-t py-10 sm:py-14 px-5 sm:px-8 lg:px-12 ${secBorder}`}>
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo + descripcion */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-500 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <span className={`font-semibold ${title}`}>La Pinamarense</span>
              </div>
              <p className={`text-sm leading-relaxed ${muted}`}>Tu fiambrería de confianza con productos frescos y de calidad.</p>
            </div>

            {/* Sucursales */}
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${label}`}>Sucursales</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${muted}`} />
                  <div>
                    <p className={`text-sm font-medium ${title}`}>Resistencia</p>
                    <p className={`text-xs ${muted}`}>B° España, Mz 79, Local 8</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${muted}`} />
                  <div>
                    <p className={`text-sm font-medium ${title}`}>Fontana</p>
                    <p className={`text-xs ${muted}`}>Av. Alvear 3500</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${label}`}>Seguinos</p>
              <div className="flex flex-col gap-2">
                <a href="https://instagram.com/lapinamarense" target="_blank" rel="noopener noreferrer" className={`text-sm transition-colors flex items-center gap-2 ${footerLink}`}>
                  <Instagram className="h-4 w-4" /> @lapinamarense
                </a>
                {[['Productos','/products'],['Contacto','/contact']].map(([l,h]) => (
                  <Link key={h} href={h} className={`text-sm transition-colors ${footerLink}`}>{l}</Link>
                ))}
              </div>
            </div>
          </div>

          <div className={`border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${secBorder}`}>
            <p className={`text-xs ${footerCopy}`}>© 2024 La Pinamarense. Todos los derechos reservados.</p>
            <div className="flex gap-4 text-xs">
              {[['Privacidad','/privacy'],['Terminos','/terms']].map(([l,h]) => (
                <Link key={h} href={h} className={`transition-colors ${footerLink}`}>{l}</Link>
              ))}
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
