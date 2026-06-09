import RouteGuard from '@/components/auth/RouteGuard';

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard access="customer">{children}</RouteGuard>;
}
