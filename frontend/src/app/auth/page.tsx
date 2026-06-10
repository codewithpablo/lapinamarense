'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isStaff } from '@/lib/roles';
import Loader from '@/components/ui/loader';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
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

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function OrDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
      <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-gray-400">o continuá con</span></div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.14Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function GoogleInner({ onToken, onError }: { onToken: (t: string) => void; onError: () => void }) {
  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: tr => onToken(tr.access_token),
    onError: () => onError(),
  });
  return (
    <button
      type="button"
      onClick={() => login()}
      className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
    >
      <GoogleG /> Continuar con Google
    </button>
  );
}

function GoogleAuthButton({ onToken, onError }: { onToken: (t: string) => void; onError: () => void }) {
  // Sin Client ID configurado mostramos el botón deshabilitado (se activa al setear NEXT_PUBLIC_GOOGLE_CLIENT_ID).
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID"
        className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
      >
        <GoogleG /> Continuar con Google <span className="text-[10px]">(configurar Client ID)</span>
      </button>
    );
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleInner onToken={onToken} onError={onError} />
    </GoogleOAuthProvider>
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

  // Prellenar el registro con los datos del invitado que recién compró (si los hay).
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pending_register');
      if (!raw) return;
      const d = JSON.parse(raw);
      setRegData(prev => ({
        ...prev,
        first_name: d.first_name || prev.first_name,
        last_name:  d.last_name  || prev.last_name,
        phone:      d.phone      || prev.phone,
        address:    d.address    || prev.address,
      }));
      localStorage.removeItem('pending_register');
    } catch {}
  }, []);

  const { login, loginWithGoogle, register, user, isLoading } = useAuth();
  const router = useRouter();
  const rawRedirect = searchParams.get('redirect') || '/';
  // Solo rutas internas: bloquea open-redirect (https://evil.com, //evil.com).
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
  const justAuthedRef = useRef(false);

  // Si ya está logueado, no mostramos el formulario: lo mandamos a su área.
  useEffect(() => {
    if (isLoading || !user || justAuthedRef.current) return;
    router.replace(isStaff(user.role) ? '/admin' : '/dashboard');
  }, [isLoading, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const userData = await login(loginData.username, loginData.password);
      justAuthedRef.current = true;
      if (userData.role === 'superadmin' || userData.role === 'admin' || userData.role === 'empleado') {
        router.push('/admin');
      } else {
        router.push(redirect === '/' ? '/dashboard' : redirect);
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
      justAuthedRef.current = true;
      router.push('/dashboard');
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

  const handleGoogle = async (accessToken: string) => {
    setLoginError(''); setRegError('');
    try {
      const userData = await loginWithGoogle(accessToken);
      justAuthedRef.current = true;
      if (isStaff(userData.role)) {
        router.push('/admin');
      } else {
        router.push(redirect === '/' ? '/dashboard' : redirect);
      }
    } catch (err: any) {
      const st = err?.response?.status;
      const msg =
        st === 503 ? 'El login con Google no está configurado todavía.'
        : st === 401 ? 'No se pudo validar tu cuenta de Google. Probá de nuevo.'
        : !err?.response ? 'Error de red. Revisá tu conexión.'
        : 'No se pudo continuar con Google.';
      setLoginError(msg);
      setRegError(msg);
    }
  };

  // Esperando auth o rebotando a un usuario ya logueado → sin flash del formulario.
  if (isLoading || (user && !justAuthedRef.current)) {
    return <Loader fullScreen />;
  }

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

              <OrDivider />
              <GoogleAuthButton onToken={handleGoogle} onError={() => setLoginError('No se pudo continuar con Google')} />

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

              <OrDivider />
              <GoogleAuthButton onToken={handleGoogle} onError={() => setRegError('No se pudo continuar con Google')} />

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
