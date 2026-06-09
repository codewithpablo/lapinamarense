'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isStaff } from '@/lib/roles';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/auth'); return; }
    if (!isStaff(user.role)) router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading || !user || !isStaff(user.role)) return null;

  return <>{children}</>;
}
