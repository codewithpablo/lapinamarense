'use client';

import Link from 'next/link';
import { ShoppingCart, User, LogOut, Store } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Store className="h-6 w-6" />
            <span className="text-xl font-bold">La Pinamarense</span>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link href="/products">
              <Button variant="ghost">Productos</Button>
            </Link>

            <Link href="/cart">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>

            {user ? (
              <>
                {user.is_store_owner && (
                  <Link href="/admin">
                    <Button variant="ghost">Admin</Button>
                  </Link>
                )}
                <Link href="/orders">
                  <Button variant="ghost">Mis Pedidos</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
                <Badge variant="secondary">{user.username}</Badge>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button>Registrarse</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
