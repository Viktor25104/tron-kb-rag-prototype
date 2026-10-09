import type { ReactNode } from 'react';
import type { ApiClient } from './ApiClient';
import { ApiClientContext } from './useApiClient';

export function ApiClientProvider({
  client,
  children,
}: {
  client: ApiClient;
  children: ReactNode;
}) {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}
