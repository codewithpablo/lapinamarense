'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Store, ShoppingCart, Package, User,
  Menu, X, ChevronRight, LogOut,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

function getInitials(user: { first_name?: string; last_name?: string; username?: string } | null) {
  if (!user) return '?';
  const f = user.first_name?.[0] ?? '';
  const l = user.last_name?.[0]  ?? '';
  return (f + l).toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
}

const navItems = [
  { title: 'Dashboard',   href: '/cuenta',   icon: Store   },
  { title: 'Tienda',      href: '/products', icon: Store   },
  { title: 'Mi carrito',  href: '/cart',     icon: ShoppingCart },
  { title: 'Mis pedidos', href: '/orders',   icon: Package },
  { title: 'Mi perfil',   href: '/cuenta/perfil', icon: User },
];

export default function CustomerSidebar() {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuth();

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

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(v => !v)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/40 z-40" />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-30 flex flex-col transition-all duration-300',
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
          <button
            onClick={() => setCollapsed(v => !v)}
            className="hidden lg:flex p-1 rounded-md hover:bg-gray-100 ml-auto"
          >
            <ChevronRight className={cn('h-4 w-4 text-gray-400 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
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
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {/* User profile con popover de logout */}
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
                      {user ? (`${user.first_name} ${user.last_name}`.trim() || user.username) : 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email ?? ''}
                    </p>
                  </div>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align={collapsed ? 'center' : 'start'}
              sideOffset={8}
              className="w-52 p-1.5"
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </aside>
    </>
  );
}
