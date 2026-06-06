'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

function PasswordInput({ id, name, value, onChange, placeholder }: {
  id: string; name?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pr-10 h-10"
        required
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ErrorBox({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {error}
    </div>
  );
}

function AuthPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [tab, setTab] = useState(initialTab);

  const [loginData, setLoginData]       = useState({ username: '', password: '' });
  const [loginError, setLoginError]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regData, setRegData]     = useState({ username: '', email: '', password: '', first_name: '', last_name: '', phone: '', address: '' });
  const [regError, setRegError]   = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const { login, register } = useAuth();
  const router = useRouter();
  const redirect = searchParams.get('redirect') || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const userData = await login(loginData.username, loginData.password);
      if (userData.role === 'superadmin' || userData.role === 'admin' || userData.role === 'empleado') {
        router.push('/admin');
      } else {
        router.push(redirect === '/' ? '/cuenta' : redirect);
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.detail || 'Usuario o contraseña incorrectos');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      await register(regData);
      router.push('/cuenta');
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const first = Object.values(data)[0];
        setRegError(Array.isArray(first) ? first[0] as string : String(first));
      } else {
        setRegError('Error al crear la cuenta');
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">

      {/* Left panel — image */}
      <div className="hidden lg:flex lg:w-1/2 sticky top-0 h-screen overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80"
          alt="Almacén La Pinamarense"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">La Pinamarense</span>
          </Link>
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-3">Minimercado de confianza</p>
            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Todo lo que<br />necesitás,<br />siempre cerca.
            </h2>
            <p className="text-white/60 text-base max-w-xs">
              Productos frescos y de calidad, entregados en la puerta de tu casa.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 h-screen overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 bg-white">

        {/* Back button */}
        <div className="mb-4 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-6 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-green-900 to-green-700 rounded-xl flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-gray-900 font-semibold text-lg">La Pinamarense</span>
        </Link>

        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">

          <Tabs value={tab} onValueChange={setTab}>

            <TabsList className="w-full bg-gray-100 mb-6">
              <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-green-800 data-[state=active]:font-semibold">
                Iniciar sesión
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-green-800 data-[state=active]:font-semibold">
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Login */}
            <TabsContent value="login">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
                <p className="text-sm text-gray-500 mt-1">Ingresá tus datos para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <ErrorBox error={loginError} />

                <div className="space-y-1.5">
                  <Label htmlFor="login-username" className="text-sm font-medium text-gray-700">Usuario</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={e => setLoginData(d => ({ ...d, username: e.target.value }))}
                    placeholder="tu_usuario"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">Contraseña</Label>
                  <PasswordInput
                    id="login-password"
                    value={loginData.password}
                    onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-10 bg-green-800 hover:bg-green-700 text-white font-medium rounded-lg"
                >
                  {loginLoading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ingresando...</>
                    : 'Ingresar'}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                ¿No tenés cuenta?{' '}
                <button onClick={() => setTab('register')} className="text-green-700 font-medium hover:underline">
                  Registrate gratis
                </button>
              </p>
            </TabsContent>

            {/* Register */}
            <TabsContent value="register">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
                <p className="text-sm text-gray-500 mt-1">Completá tus datos para registrarte</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                <ErrorBox error={regError} />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-first" className="text-sm font-medium text-gray-700">Nombre</Label>
                    <Input id="reg-first" value={regData.first_name}
                      onChange={e => setRegData(d => ({ ...d, first_name: e.target.value }))}
                      placeholder="Juan" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-last" className="text-sm font-medium text-gray-700">Apellido</Label>
                    <Input id="reg-last" value={regData.last_name}
                      onChange={e => setRegData(d => ({ ...d, last_name: e.target.value }))}
                      placeholder="Pérez" className="h-10" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-username" className="text-sm font-medium text-gray-700">
                    Usuario <span className="text-red-500">*</span>
                  </Label>
                  <Input id="reg-username" value={regData.username}
                    onChange={e => setRegData(d => ({ ...d, username: e.target.value }))}
                    placeholder="tu_usuario" className="h-10" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input id="reg-email" type="email" value={regData.email}
                    onChange={e => setRegData(d => ({ ...d, email: e.target.value }))}
                    placeholder="juan@email.com" className="h-10" required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">
                    Contraseña <span className="text-red-500">*</span>
                  </Label>
                  <PasswordInput
                    id="reg-password"
                    value={regData.password}
                    onChange={e => setRegData(d => ({ ...d, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone" className="text-sm font-medium text-gray-700">Teléfono</Label>
                    <Input id="reg-phone" type="tel" value={regData.phone}
                      onChange={e => setRegData(d => ({ ...d, phone: e.target.value }))}
                      placeholder="11 1234-5678" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-address" className="text-sm font-medium text-gray-700">Dirección</Label>
                    <Input id="reg-address" value={regData.address}
                      onChange={e => setRegData(d => ({ ...d, address: e.target.value }))}
                      placeholder="Av. Corrientes 1234" className="h-10" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={regLoading}
                  className="w-full h-10 bg-green-800 hover:bg-green-700 text-white font-medium rounded-lg !mt-5"
                >
                  {regLoading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando cuenta...</>
                    : 'Crear cuenta'}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                ¿Ya tenés cuenta?{' '}
                <button onClick={() => setTab('login')} className="text-green-700 font-medium hover:underline">
                  Iniciá sesión
                </button>
              </p>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function AuthPageWrapper() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}
