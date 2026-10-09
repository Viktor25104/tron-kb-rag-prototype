import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiClientProvider, createApiClient, type ApiClient } from '@/shared/api';
import { ToastProvider } from '@/shared/ui';

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState<ApiClient>(createApiClient);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ApiClientProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </ApiClientProvider>
  );
}
