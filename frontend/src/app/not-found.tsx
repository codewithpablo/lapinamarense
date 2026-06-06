'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStoredTheme } from '@/components/ui/loader';

export default function NotFound() {
  const [dk, setDk] = useState(false);

  useEffect(() => {
    setDk(getStoredTheme());
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden px-6 ${dk ? 'bg-gradient-to-br from-green-950 via-green-900 to-green-950' : 'bg-white'}`}>
      {/* Circulos difuminados */}
      <div className={`absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse ${dk ? 'bg-green-500/15' : 'bg-green-500/25'}`} />
      <div className={`absolute top-[50%] right-[10%] w-[350px] h-[350px] rounded-full blur-[100px] animate-pulse [animation-delay:0.5s] ${dk ? 'bg-green-400/10' : 'bg-green-400/20'}`} />
      <div className={`absolute bottom-[10%] left-[40%] w-[300px] h-[300px] rounded-full blur-[90px] animate-pulse [animation-delay:1s] ${dk ? 'bg-emerald-500/10' : 'bg-green-500/15'}`} />

      {/* Grid sutil */}
      <div className={`absolute inset-0 ${dk ? 'opacity-[0.03]' : 'opacity-[0.04]'}`} style={{ backgroundImage: `radial-gradient(circle, ${dk ? 'white' : '#166534'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-500 rounded-lg flex items-center justify-center">
            <TreePine className="h-5 w-5 text-white" />
          </div>
          <span className={`text-lg font-semibold ${dk ? 'text-white' : 'text-gray-900'}`}>La Pinamarense</span>
        </div>

        {/* 404 grande */}
        <h1 className={`text-8xl sm:text-9xl font-black tracking-tighter leading-none mb-4 ${dk ? 'text-white/10' : 'text-green-200'}`}>
          404
        </h1>

        <h2 className={`text-xl sm:text-2xl font-bold mb-2 -mt-6 ${dk ? 'text-white' : 'text-gray-900'}`}>
          Pagina no encontrada
        </h2>

        <p className={`text-sm mb-8 leading-relaxed ${dk ? 'text-green-300/60' : 'text-gray-400'}`}>
          Parece que este camino no lleva a ningun lado. Pero no te preocupes, te ayudamos a volver.
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className={dk ? 'border-white/30 !text-white hover:bg-white/10 bg-transparent' : 'border-gray-300 !text-gray-700 bg-white hover:bg-gray-50'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Home className="h-4 w-4 mr-2" /> Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
