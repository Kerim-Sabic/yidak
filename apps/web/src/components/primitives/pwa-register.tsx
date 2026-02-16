'use client';

import { useEffect } from 'react';

const shouldRegisterServiceWorker = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    return false;
  }

  return true;
};

export const PwaRegister = (): null => {
  useEffect(() => {
    if (!shouldRegisterServiceWorker()) {
      return;
    }

    const register = async (): Promise<void> => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        return;
      }
    };

    void register();
  }, []);

  return null;
};

export default PwaRegister;
