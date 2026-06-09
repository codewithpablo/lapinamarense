'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isStaff } from '@/lib/roles';
import Loader from '@/components/ui/loader';

type Access = 'staff' | 'customer';

/**
 * Protege un área según el rol del usuario. No mezcla accesos:
 *  - 'staff'    → solo superadmin/admin/empleado. Un cliente va a /dashboard.
 *  - 'customer' → solo cliente. Un staff va a /admin.
 * Sin sesión → /auth?redirect=<ruta actual>.
 */
export default function RouteGuard({ access, children }: { access: Access; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed =
    !!user && (access === 'staff' ? isStaff(user.role) : user.role === 'cliente');

  useEffect(() => {
    if (isLoading || allowed) return;
    if (!user) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Logueado pero en el área equivocada → lo mando a su área.
    // Rol desconocido/corrupto → a /auth (donde no se lo rebota, puede re-loguear).
    if (access === 'staff') {
      router.replace(user.role === 'cliente' ? '/dashboard' : '/auth');
    } else {
      router.replace(isStaff(user.role) ? '/admin' : '/auth');
    }
  }, [isLoading, allowed, user, access, pathname, router]);

  if (isLoading || !allowed) {
    return <Loader fullScreen />;
  }

  return <>{children}</>;
}
