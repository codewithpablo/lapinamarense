'use client';

import { useEffect, useRef, useState } from 'react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { cart } from '@/lib/cart';
import { useAuth } from '@/contexts/AuthContext';
import CustomerSidebar from '@/components/customer/CustomerSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Package, Loader2, Tag, Gift, ChevronRight,
  Pizza, Snowflake, Sandwich, Cookie, Layers, UtensilsCrossed,
  GlassWater, Milk, Wheat, Candy, Sparkles, Wine, Cigarette,
  Flame, type LucideIcon,
} from 'lucide-react';
import Loader from '@/components/ui/loader';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Padres
  'Pizzas':              Pizza,
  'Congelados':          Snowflake,
  'Tapas':               Layers,
  // Hijos de Pizzas
  'Pizzas de Campo':     Flame,
  'Pizzas Congeladas':   Snowflake,
  'Pizzetones Congelados': Pizza,
  // Hijos de Congelados
  'Hamburguesas Congeladas': Sandwich,
  'Congelados Panatta':  Cookie,
  'Congelados Varios':   Package,
  'Tartas Congeladas':   Layers,
  'Empanadas Congeladas': UtensilsCrossed,
  // Hijos de Tapas
  'Tapas Pascualina':    Layers,
  'Tapas Empanada':      UtensilsCrossed,
  'Tapas Pastelitos':    Cookie,
  // Hojas
  'Pastas':              UtensilsCrossed,
  'Bebidas':             GlassWater,
  'Lácteos y Fiambres':  Milk,
  'Panadería':           Wheat,
  'Golosinas':           Candy,
  'Limpieza':            Sparkles,
  'Bebidas Alcohólicas': Wine,
  'Cigarrillos':         Cigarette,
};

interface Product {
  id: number;
  name: string;
  net_content: string;
  price: number;
  discount_price?: number | null;
  offer_tag?: string;
  image?: string;
  image_url?: string;
  stock: number;
}

interface Category {
  id: number;
  name: string;
  children: Category[];
}

interface Flyout {
  children: Category[];
  top: number;
}

const OFFER_COLORS: Record<string, string> = {
  'OFERTA':  'bg-red-500 text-white',
  'PROMO':   'bg-orange-500 text-white',
  '2x1':     'bg-purple-600 text-white',
  '3x2':     'bg-blue-600 text-white',
  'NUEVO':   'bg-green-500 text-white',
  'POPULAR': 'bg-yellow-500 text-white',
};

export default function ProductsPage() {
  const [products, setProducts]                 = useState<Product[]>([]);
  const [categories, setCategories]             = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [activeTab, setActiveTab]               = useState<'productos' | 'combos' | 'ofertas'>('productos');
  const [loading, setLoading]                   = useState(true);
  const [addingId, setAddingId]                 = useState<number | null>(null);
  const [addedId, setAddedId]                   = useState<number | null>(null);
  const [flyout, setFlyout]                     = useState<Flyout | null>(null);
  const [rightCollapsed, setRightCollapsed]     = useState(false);
  const [catDrawerOpen, setCatDrawerOpen]       = useState(false);
  const [expandedCat, setExpandedCat]           = useState<number | null>(null);
  const asideRef    = useRef<HTMLElement>(null);
  const flyoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  useEffect(() => { fetchData(); }, [selectedCategory, searchQuery, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const categoriesRes = await categoriesAPI.getAll();
      const cats: Category[] = categoriesRes.data;
      setCategories(cats);

      const params: any = {};
      if (activeTab === 'combos') {
        const combosCat = cats.find(c => c.name === 'Combos');
        if (combosCat) params.category = combosCat.id;
      } else if (activeTab === 'productos') {
        if (selectedCategory) params.category = selectedCategory;
        if (searchQuery)      params.search   = searchQuery;
      }

      const productsRes = await productsAPI.getAll(params);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const offers = products.filter(p => p.offer_tag || p.discount_price);

  // ── Flyout helpers ──────────────────────────────────────────────────────
  const openFlyout = (cat: Category, e: React.MouseEvent) => {
    if (flyoutTimer.current) clearTimeout(flyoutTimer.current);
    if (!cat.children?.length) { setFlyout(null); return; }
    const itemRect  = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const asideRect = asideRef.current?.getBoundingClientRect() ?? { top: 0 };
    setFlyout({ children: cat.children, top: itemRect.top - asideRect.top });
  };
  const scheduleFlyoutClose = () => {
    flyoutTimer.current = setTimeout(() => setFlyout(null), 120);
  };
  const cancelFlyoutClose = () => {
    if (flyoutTimer.current) clearTimeout(flyoutTimer.current);
  };

  // ── addToCart (funciona logueado o como invitado) ────────────────────────
  const addToCart = async (product: Product) => {
    setAddingId(product.id);
    try {
      await cart.add({
        id: product.id,
        name: product.name,
        price: Number(product.discount_price ?? product.price),
        image: product.image || product.image_url,
      });
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1500);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingId(null);
    }
  };

  // ── ProductCard ─────────────────────────────────────────────────────────
  const ProductCard = ({ product }: { product: Product }) => {
    const img = product.image || product.image_url;
    const hasDiscount = product.discount_price != null;
    const displayPrice = hasDiscount ? product.discount_price! : product.price;
    const savePct = hasDiscount
      ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
      : 0;
    const isMechanica = product.offer_tag === '2x1' || product.offer_tag === '3x2';

    return (
      <Card className={`border-0 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden bg-white ${hasDiscount ? 'ring-1 ring-inset ring-red-100' : ''}`}>
        <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {img
            ? <img src={img} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            : <Package className="h-10 w-10 text-gray-300" />}
          {product.offer_tag && (
            <span className={`absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm ${OFFER_COLORS[product.offer_tag] || 'bg-gray-600 text-white'}`}>
              {product.offer_tag}
            </span>
          )}
          {hasDiscount && !isMechanica && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
              -{savePct}%
            </span>
          )}
        </div>
        <CardContent className="p-3 flex flex-col flex-1">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1 mb-0.5">{product.name}</p>
          {product.net_content && <p className="text-xs text-gray-400 mb-1">{product.net_content}</p>}
          {isMechanica && (
            <p className="text-[11px] text-purple-700 font-medium bg-purple-50 rounded-md px-2 py-1 mb-2">
              {product.offer_tag === '2x1' ? 'Llevás 2 y pagás 1' : 'Llevás 3 y pagás 2'}
            </p>
          )}
          <div className="mt-auto">
            {hasDiscount ? (
              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-red-600">${Number(displayPrice).toLocaleString('es-AR')}</span>
                  <span className="text-sm text-gray-400 line-through">${Number(product.price).toLocaleString('es-AR')}</span>
                </div>
                <p className="text-[10px] text-green-700 font-medium">
                  Ahorrás ${(Number(product.price) - Number(displayPrice)).toLocaleString('es-AR')}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-gray-900">${Number(product.price).toLocaleString('es-AR')}</span>
                <Badge className={product.stock > 0 ? 'bg-green-100 text-green-700 border-0 text-[10px]' : 'bg-red-100 text-red-700 border-0 text-[10px]'}>
                  {product.stock > 0 ? `${product.stock} u.` : 'Agotado'}
                </Badge>
              </div>
            )}
            <Button
              className={`w-full h-8 text-xs font-medium rounded-lg transition-all ${addedId === product.id ? 'bg-green-500 hover:bg-green-500 text-white' : 'bg-green-800 hover:bg-green-700 text-white'}`}
              onClick={() => addToCart(product)}
              disabled={product.stock === 0 || addingId === product.id}
            >
              {addingId === product.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : addedId === product.id
                  ? '¡Agregado!'
                  : <><ShoppingCart className="h-3.5 w-3.5 mr-1.5" />Agregar</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProductGrid = ({ items }: { items: Product[] }) =>
    items.length === 0
      ? <div className="flex flex-col items-center py-24 text-gray-400"><Package className="h-10 w-10 mb-3 text-gray-300" /><p className="text-sm">No se encontraron productos</p></div>
      : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">{items.map(p => <ProductCard key={p.id} product={p} />)}</div>;

  const visibleCats = categories.filter(cat => cat.name !== 'Combos');

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <CustomerSidebar
        title="Tienda"
        rightSlot={activeTab === 'productos' ? (
          <button
            onClick={() => setCatDrawerOpen(true)}
            className="w-9 h-9 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 transition flex items-center justify-center shadow-sm"
            aria-label="Filtrar por categoría"
          >
            <Layers className="h-5 w-5 text-white" />
          </button>
        ) : undefined}
      />

      <div className="flex-1 flex min-w-0">

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 p-4 lg:p-8 pt-[4.5rem] lg:pt-8">

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-sm w-full sm:w-fit">
            {([
              { id: 'productos', label: 'Productos', icon: Package },
              { id: 'combos',    label: 'Combos',    icon: Gift },
              { id: 'ofertas',   label: 'Ofertas',   icon: Tag  },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-green-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                {tab.label}
                {!loading && activeTab === tab.id && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none bg-white/20 text-white">
                    {tab.id === 'ofertas' ? offers.length : products.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <Loader />
          ) : activeTab === 'productos' ? (<>
            <div className="relative mb-4 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white text-sm"
              />
            </div>
            <ProductGrid items={products} />
          </>) : activeTab === 'combos' ? (
            <ProductGrid items={products} />
          ) : (
            offers.length === 0
              ? <div className="flex flex-col items-center py-24 text-gray-400"><Tag className="h-10 w-10 mb-3 text-gray-300" /><p className="text-sm">No hay ofertas activas</p></div>
              : <ProductGrid items={offers} />
          )}
        </div>

        {/* Spacer + sidebar fijo solo en tab productos */}
        <div className={`${activeTab === 'productos' ? (rightCollapsed ? 'w-0' : 'w-56') : 'w-0'} shrink-0 transition-all duration-300 hidden lg:block`} />

        {activeTab === 'productos' && (
          <aside
            ref={asideRef}
            className={`fixed right-0 top-0 h-screen bg-white border-l border-gray-200 flex flex-col z-20 transition-all duration-300 hidden lg:flex ${rightCollapsed ? 'w-14' : 'w-56'}`}
          >
            {/* Boton colapsar */}
            <div className="flex items-center justify-between px-3 pt-4 pb-2">
              {!rightCollapsed && <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Categorias</p>}
              <button
                onClick={() => setRightCollapsed(v => !v)}
                className="p-1 rounded-md hover:bg-gray-100 ml-auto"
              >
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${rightCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Scrollable nav */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-6 space-y-0.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-green-700 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                } ${rightCollapsed ? 'justify-center' : ''}`}
              >
                <Package className="h-4 w-4 shrink-0" />
                {!rightCollapsed && 'Todos'}
              </button>

              {categories.filter(cat => cat.name !== 'Combos').map(cat => {
                const Icon = CATEGORY_ICONS[cat.name] ?? Package;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={(e) => openFlyout(cat, e)}
                    onMouseLeave={scheduleFlyoutClose}
                  >
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-green-700 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                      } ${rightCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!rightCollapsed && <span className="flex-1 text-left">{cat.name}</span>}
                      {!rightCollapsed && cat.children?.length > 0 && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Flyout — fuera del div scrolleable, relativo al aside */}
            {flyout && (
              <div
                className="absolute right-full top-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-[200] min-w-[200px]"
                style={{ top: flyout.top }}
                onMouseEnter={cancelFlyoutClose}
                onMouseLeave={scheduleFlyoutClose}
              >
                {flyout.children.map(child => {
                  const ChildIcon = CATEGORY_ICONS[child.name] ?? Package;
                  return (
                    <button
                      key={child.id}
                      onClick={() => { setSelectedCategory(child.id); setFlyout(null); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors ${
                        selectedCategory === child.id
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                      {child.name}
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        )}

        {/* ── Drawer de Categorías (solo mobile) ── */}
        {activeTab === 'productos' && (
          <>
            {catDrawerOpen && (
              <div onClick={() => setCatDrawerOpen(false)} className="lg:hidden fixed inset-0 bg-black/40 z-40" />
            )}
            <aside className={`lg:hidden fixed right-0 top-0 h-screen w-72 max-w-[85vw] z-50 bg-white border-l border-gray-100 flex flex-col transition-transform duration-300 ${catDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              {/* Header del drawer */}
              <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-green-600" /> Categorías
                </span>
                <button
                  onClick={() => setCatDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 transition flex items-center justify-center"
                  aria-label="Cerrar categorías"
                >
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Lista de categorías con subcategorías inline (touch-friendly) */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                <button
                  onClick={() => { setSelectedCategory(null); setCatDrawerOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === null ? 'bg-green-700 text-white shadow-sm' : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <Package className="h-4 w-4 shrink-0" /> Todos
                </button>

                {visibleCats.map(cat => {
                  const Icon = CATEGORY_ICONS[cat.name] ?? Package;
                  const hasChildren = cat.children?.length > 0;
                  const isExpanded = expandedCat === cat.id;
                  return (
                    <div key={cat.id}>
                      <button
                        onClick={() => {
                          if (hasChildren) {
                            setExpandedCat(isExpanded ? null : cat.id);
                          } else {
                            setSelectedCategory(cat.id); setCatDrawerOpen(false);
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === cat.id ? 'bg-green-700 text-white shadow-sm' : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{cat.name}</span>
                        {hasChildren && (
                          <ChevronRight className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </button>
                      {/* Subcategorías */}
                      {hasChildren && isExpanded && (
                        <div className="ml-5 mt-0.5 mb-1 space-y-0.5 border-l border-gray-100 pl-2">
                          {cat.children.map(child => {
                            const ChildIcon = CATEGORY_ICONS[child.name] ?? Package;
                            return (
                              <button
                                key={child.id}
                                onClick={() => { setSelectedCategory(child.id); setCatDrawerOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                                  selectedCategory === child.id ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
                                }`}
                              >
                                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                {child.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
