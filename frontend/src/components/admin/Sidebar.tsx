'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Truck,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard',     href: '/admin',            icon: LayoutDashboard, roles: ['superadmin','admin','empleado'] },
  { title: 'Caja',          href: '/admin/pos',        icon: ShoppingCart,    roles: ['superadmin','admin','empleado'] },
  { title: 'Ventas',        href: '/admin/sales',      icon: BarChart3,       roles: ['superadmin','admin','empleado'] },
  { title: 'Productos',     href: '/admin/products',   icon: Package,         roles: ['superadmin','admin','empleado'] },
  { title: 'Categorias',    href: '/admin/categories', icon: Layers,          roles: ['superadmin','admin'] },
  { title: 'Usuarios',      href: '/admin/usuarios',   icon: Users,           roles: ['superadmin'] },
  { title: 'Mi perfil',     href: '/admin/perfil',     icon: User,            roles: ['superadmin','admin','empleado'] },
];

interface SidebarProps {
  className?: string;
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin:      'Admin',
  empleado:   'Empleado',
  cliente:    'Cliente',
};

const ROLE_COLOR: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin:      'bg-green-100 text-green-700',
  empleado:   'bg-blue-100 text-blue-700',
  cliente:    'bg-gray-100 text-gray-500',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0', ROLE_COLOR[role] ?? 'bg-gray-100 text-gray-500')}>
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

function getInitials(user: { first_name?: string; last_name?: string; username?: string } | null) {
  if (!user) return 'A';
  const first = user.first_name?.[0] ?? '';
  const last  = user.last_name?.[0]  ?? '';
  return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || 'A';
}

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [stockAlerts, setStockAlerts]   = useState(0);
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push('/auth');
  }

  useEffect(() => {
    productsAPI.getAll()
      .then(res => {
        const count = (res.data as any[]).filter(p => p.stock < 10).length;
        setStockAlerts(count);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Spacer — keeps content pushed right on desktop, same width + transition as sidebar */}
      <div className={cn(
        'hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )} />

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-30 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-gray-900 text-sm">La Pinamarense</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Panel de administración</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronRight
              className={cn(
                'h-4 w-4 text-gray-500 transition-transform',
                isCollapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarItems.filter(item => !user?.role || item.roles.includes(user.role)).map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(item.href + '/');
            const isInventory = item.href === '/admin/inventory';

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-700',
                  isCollapsed && 'justify-center'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-white')} />
                {!isCollapsed && (
                  <span className="font-medium text-sm flex-1">{item.title}</span>
                )}
                {isInventory && stockAlerts > 0 && (
                  <span className={cn(
                    'text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-tight',
                    isActive
                      ? 'bg-white text-red-600'
                      : 'bg-red-500 text-white',
                    isCollapsed && 'absolute top-1 right-1 text-[10px] px-1'
                  )}>
                    {stockAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-100 transition-colors text-left',
                  isCollapsed && 'justify-center px-0'
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
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user ? (`${user.first_name} ${user.last_name}`.trim() || user.username) : 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email ?? 'pablo@pinamarense.com'}
                    </p>
                  </div>
                )}
                {!isCollapsed && user?.role && (
                  <RoleBadge role={user.role} />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align={isCollapsed ? 'center' : 'start'}
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
