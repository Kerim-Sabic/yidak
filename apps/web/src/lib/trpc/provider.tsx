'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';


import { createQueryClient, createTrpcClient, trpc } from './client';

import type { ReactNode } from 'react';

interface TRPCProviderProps {
  children: ReactNode;
}

export const TRPCProvider = ({ children }: TRPCProviderProps): React.JSX.Element => {
  const [queryClient] = useState(() => createQueryClient());
  const [trpcClient] = useState(() => createTrpcClient());

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  );
};
