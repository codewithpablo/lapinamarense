'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cart as cartLib } from '@/lib/cart';
import { cn } from '@/lib/utils';
import {
  Store, ShoppingCart, Package, User,
  ChevronLeft, ChevronRight, LogOut, LogIn,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

function getInitials(user: { first_name?: string; last_name?: string; username?: string } | null) {
  if (!user) return '?';
  const f = user.first_name?.[0] ?? '';
  const l = user.last_name?.[0]  ?? '';
  return (f + l).toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
}

const navItems = [
  { title: 'Dashboard',   href: '/dashboard',   icon: Store,        guest: false },
  { title: 'Tienda',      href: '/products', icon: Store,           guest: true  },
  { title: 'Mi carrito',  href: '/cart',     icon: ShoppingCart,    guest: true  },
  { title: 'Mis pedidos', href: '/orders',   icon: Package,         guest: false },
  { title: 'Mi perfil',   href: '/dashboard/perfil', icon: User,    guest: false },
];

interface CustomerSidebarProps {
  /** Permite controlar la apertura mobile desde afuera (p. ej. para sincronizar con un panel derecho).
   *  Si no se pasan, el sidebar usa estado interno. */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  /** Título que muestra el header translúcido mobile. Si no se pasa, se deriva de la ruta. */
  title?: string;
  /** Contenido extra a la derecha del header mobile (p. ej. la flecha del panel de resumen del dashboard). */
  rightSlot?: React.ReactNode;
}

export default function CustomerSidebar({ mobileOpen: mobileOpenProp, onMobileOpenChange, title, rightSlot }: CustomerSidebarProps = {}) {
  const [collapsed, setCollapsed]             = useState(false);
  const [mobileOpenInternal, setMobileOpenInternal] = useState(false);
  const [cartCount, setCartCount]             = useState(0);

  // Controlado desde afuera si se pasan las props; si no, estado propio.
  const controlled  = mobileOpenProp !== undefined;
  const mobileOpen  = controlled ? mobileOpenProp! : mobileOpenInternal;
  const setMobileOpen = (open: boolean) => {
    if (controlled) onMobileOpenChange?.(open);
    else setMobileOpenInternal(open);
  };
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuth();

  // Título del header mobile: el prop tiene prioridad; si no, se busca el ítem de nav que matchea la ruta.
  const headerTitle = title
    ?? [...navItems].sort((a, b) => b.href.length - a.href.length).find(i => pathname.startsWith(i.href))?.title
    ?? 'Mi cuenta';

  // Refresca el contador del carrito (logueado o invitado) en cada navegación
  // y cuando cambia el carrito de invitado (evento 'cart-changed').
  useEffect(() => {
    const refresh = () => cartLib.get().then(d => setCartCount(d.items?.length ?? 0)).catch(() => {});
    refresh();
    window.addEventListener('cart-changed', refresh);
    return () => window.removeEventListener('cart-changed', refresh);
  }, [pathname]);

  // Ítems de navegación visibles: si es invitado, solo los marcados como guest.
  const visibleNav = user ? navItems : navItems.filter(i => i.guest);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Spacer */}
      <div className={cn(
        'hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64'
      )} />

      {/* Header translúcido (solo mobile): siempre presente en toda sección del cliente.
          Flecha izquierda = abrir menú (siempre). Título de la sección. rightSlot opcional a la derecha.
          Es fixed (ancho completo del viewport); las páginas compensan con un spacer h-14 lg:hidden. */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-3 h-14 bg-white/70 backdrop-blur-md border-b border-gray-200/70">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 transition flex items-center justify-center shadow-sm"
          aria-label="Abrir menú"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
        <span className="text-sm font-semibold text-gray-700 truncate">{headerTitle}</span>
        {/* Si no hay slot derecho, un spacer para mantener el título centrado */}
        {rightSlot ?? <span className="w-9" aria-hidden="true" />}
      </header>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/40 z-40" />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 flex flex-col transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-800 to-green-600 rounded-lg flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">La Pinamarense</span>
            </Link>
          )}
          {/* Cerrar (mobile): dentro del propio menú. Flecha hacia afuera (izquierda). */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-8 h-8 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 transition flex items-center justify-center ml-auto"
            aria-label="Cerrar menú"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          {/* Colapsar (desktop) */}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="hidden lg:flex p-1 rounded-md hover:bg-gray-100 ml-auto"
          >
            <ChevronRight className={cn('h-4 w-4 text-gray-400 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const isCart = item.href === '/cart';
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-green-700 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700',
                  collapsed && 'justify-center',
                )}
              >
                <span className="relative flex-shrink-0">
                  <Icon className="h-5 w-5" />
                  {isCart && cartCount > 0 && collapsed && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </span>
                {!collapsed && <span className="flex-1">{item.title}</span>}
                {!collapsed && isCart && cartCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {user ? (
            /* Usuario logueado: perfil con popover de logout */
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-100 transition-colors text-left',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-green-100"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold ring-2 ring-green-100">
                      {getInitials(user)}
                    </div>
                  )}
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {`${user.first_name} ${user.last_name}`.trim() || user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email ?? ''}</p>
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align={collapsed ? 'center' : 'start'} sideOffset={8} className="w-52 p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </PopoverContent>
            </Popover>
          ) : (
            /* Invitado: botón para iniciar sesión / crear cuenta */
            <Link
              href="/auth"
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0'
              )}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {!collapsed && 'Iniciar sesión'}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
