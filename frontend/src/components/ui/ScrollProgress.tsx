'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      {/* Track */}
      <div className="absolute inset-0 bg-transparent" />

      {/* Fill */}
      <div
        className="h-full relative"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #15803d, #4ade80, #86efac)',
          boxShadow: '0 0 8px 1px rgba(74, 222, 128, 0.5)',
          transition: 'width 60ms linear',
        }}
      >
        {/* Glowing dot at the tip */}
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full"
          style={{
            background: '#4ade80',
            boxShadow: '0 0 8px 3px rgba(74, 222, 128, 0.8), 0 0 2px 1px rgba(74, 222, 128, 1)',
          }}
        />
      </div>
    </div>
  );
}
