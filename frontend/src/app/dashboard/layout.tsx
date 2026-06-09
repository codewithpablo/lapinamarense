import RouteGuard from '@/components/auth/RouteGuard';

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard access="customer">{children}</RouteGuard>;
}
