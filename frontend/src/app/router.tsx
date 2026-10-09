import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';

export const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
