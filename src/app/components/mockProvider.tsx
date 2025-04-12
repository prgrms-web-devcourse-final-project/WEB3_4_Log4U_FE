// src/app/components/MockProvider.tsx
'use client';

import { useEffect, useRef } from 'react';

export function MockProvider() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('MockProvider');
    console.log(ref.current);
    if (!ref.current) return;
    // browser 환경, client에서 사용하기 위한 worker 세팅
    async function setupWokrer() {
      if (typeof window === 'undefined') {
        console.log('window is undefined');
        return;
      }
      console.log('window is defined');
      const { worker } = await import('../mocks/browser');
      console.log('worker', worker);
      await worker.start();
      console.log('worker started');
    }
    setupWokrer();
  }, []);

  return <div ref={ref} />;
}
