'use client';

import { useEffect, useState } from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  text?: string;
  welcome?: boolean;
}

function getTheme(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function setTheme(dark: boolean) {
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

export function getStoredTheme(): boolean {
  return getTheme();
}

function Typewriter({ text, speed = 60, dk }: { text: string; speed?: number; dk: boolean }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={dk ? 'text-green-300' : 'text-gray-700'}>
      {displayed}
      {!done && <span className="animate-pulse">|</span>}
    </span>
  );
}

export default function Loader({ fullScreen = false, text = 'Cargando...', welcome = false }: LoaderProps) {
  const [dk, setDk] = useState<boolean | null>(null);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setDk(getTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!welcome || !mounted) return;
    const steps = [500, 3500, 6500, 8000];
    const timers = steps.map((ms, i) =>
      setTimeout(() => setWelcomeStep(i + 1), ms)
    );

    // Barra de progreso de 0 a 100 en 12s
    const startTime = Date.now();
    const duration = 4000;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(Math.round(p));
      if (elapsed < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    return () => timers.forEach(clearTimeout);
  }, [welcome, mounted]);

  if (dk === null) {
    if (fullScreen) return <div className="min-h-screen" />;
    return <div className="py-16" />;
  }

  const pine = (
    <div className="relative">
      <svg width="64" height="80" viewBox="0 0 72 90" fill="none" className="drop-shadow-md">
        <rect x="33" y="68" width="6" height="16" rx="1.5" className={dk ? 'fill-amber-600' : 'fill-amber-700'} />
        <path d="M36 62 L12 62 Q16 56 22 54 L18 54 Q22 48 28 46" className={`animate-pulse [animation-delay:0.6s] ${dk ? 'stroke-green-800 fill-green-500/90' : 'stroke-green-900 fill-green-800/90'}`} />
        <path d="M36 62 L60 62 Q56 56 50 54 L54 54 Q50 48 44 46" className={`animate-pulse [animation-delay:0.6s] ${dk ? 'stroke-green-800 fill-green-500/90' : 'stroke-green-900 fill-green-800/90'}`} />
        <path d="M36 46 L16 50 Q20 44 24 42 L20 42 Q24 36 30 34" className={`animate-pulse [animation-delay:0.3s] ${dk ? 'stroke-green-700 fill-green-400/90' : 'stroke-green-800 fill-green-700/90'}`} />
        <path d="M36 46 L56 50 Q52 44 48 42 L52 42 Q48 36 42 34" className={`animate-pulse [animation-delay:0.3s] ${dk ? 'stroke-green-700 fill-green-400/90' : 'stroke-green-800 fill-green-700/90'}`} />
        <path d="M36 34 L22 38 Q26 32 30 30 L26 30 Q30 24 34 22" className={`animate-pulse ${dk ? 'stroke-green-600 fill-green-300/90' : 'stroke-green-700 fill-green-600/90'}`} />
        <path d="M36 34 L50 38 Q46 32 42 30 L46 30 Q42 24 38 22" className={`animate-pulse ${dk ? 'stroke-green-600 fill-green-300/90' : 'stroke-green-700 fill-green-600/90'}`} />
        <path d="M36 8 L28 22 Q32 18 36 20 Q40 18 44 22 Z" className={`animate-pulse ${dk ? 'fill-green-300' : 'fill-green-600'}`} />
        <line x1="36" y1="8" x2="36" y2="68" className={`stroke-[2.5] ${dk ? 'stroke-amber-600' : 'stroke-amber-700'}`} />
      </svg>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${dk ? 'bg-gradient-to-br from-green-950 via-green-900 to-green-950' : 'bg-white'}`}>
        <div className={`absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse ${dk ? 'bg-green-500/15' : 'bg-green-500/25'}`} />
        <div className={`absolute top-[50%] right-[10%] w-[350px] h-[350px] rounded-full blur-[100px] animate-pulse [animation-delay:0.5s] ${dk ? 'bg-green-400/10' : 'bg-green-400/20'}`} />
        <div className={`absolute bottom-[10%] left-[40%] w-[300px] h-[300px] rounded-full blur-[90px] animate-pulse [animation-delay:1s] ${dk ? 'bg-emerald-500/10' : 'bg-green-500/15'}`} />
        <div className={`absolute inset-0 ${dk ? 'opacity-[0.03]' : 'opacity-[0.04]'}`} style={{ backgroundImage: `radial-gradient(circle, ${dk ? 'white' : '#166534'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {pine}

          {welcome ? (
            <div className="text-center space-y-3 max-w-sm px-4 min-h-[140px] flex flex-col justify-start">
              {welcomeStep >= 1 && (
                <p className={`text-2xl font-bold transition-all duration-700 ${dk ? 'text-white' : 'text-gray-900'}`}>
                  La Pinamarense
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 min-h-[300px]">
      {pine}
    </div>
  );
}
