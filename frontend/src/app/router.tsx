import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AiAnswerPage } from '@/pages/AiAnswerPage';
import { ArchitecturePage } from '@/pages/ArchitecturePage';
import { DocumentPage } from '@/pages/DocumentPage';
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage';
import { ProcessingPage } from '@/pages/ProcessingPage';
import { RagSearchPage } from '@/pages/RagSearchPage';
import { RetrievedContextPage } from '@/pages/RetrievedContextPage';
import { Layout } from './Layout';

export const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { index: true, element: <Navigate to="/kb" replace /> },
        { path: 'kb', element: <KnowledgeBasePage /> },
        { path: 'kb/articles/:articleId', element: <DocumentPage /> },
        { path: 'processing', element: <ProcessingPage /> },
        { path: 'rag', element: <RagSearchPage /> },
        { path: 'rag/context', element: <RetrievedContextPage /> },
        { path: 'rag/answer', element: <AiAnswerPage /> },
        { path: 'architecture', element: <ArchitecturePage /> },
        { path: '*', element: <Navigate to="/kb" replace /> },
      ],
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
