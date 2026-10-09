export const RESPONSIBILITIES = {
  knowledgeBase: [
    'Stores articles with every version; only the live version is indexed',
    'Splits articles into sections and chunks, embeds them',
    'Extracts facts, claims, entities and topics, tracks verification status',
    'Keeps sources with reliability scores',
    'Owns the processing pipeline and its failures',
  ],
  rag: [
    'Understands the query: entities, language, inferred filters',
    'Narrows the corpus with filters before any search',
    'Runs vector and full-text search, fuses them with RRF',
    'Reranks candidates and drops noise',
    'Builds a compact context and scores confidence',
    'Refuses explicitly when confidence is low instead of calling the agent',
  ],
};

export const DECISIONS: { title: string; body: string }[] = [
  {
    title: 'pgvector + FTS in one PostgreSQL',
    body: 'One database keeps filters, vectors and text in a single transaction and a single query plan. A separate vector store would need its own copy of every filterable field.',
  },
  {
    title: 'Pre-filter before ANN, not after',
    body: 'Filtering after the nearest-neighbour search silently loses recall when filters are selective. The trace shows corpus size before and after.',
  },
  {
    title: 'Hybrid search with RRF',
    body: 'Vectors catch paraphrases, BM25 catches exact tokens like TRC-20 or AccountPermissionUpdate. RRF merges ranks without calibrating two score scales.',
  },
  {
    title: 'Context Builder decides what the agent sees',
    body: 'One place selects chunks, attaches facts, drops outdated ones and computes confidence. The agent never queries the knowledge base on its own.',
  },
  {
    title: 'Low confidence is a normal outcome',
    body: 'A refusal with possible sources and next actions is a regular response type, not an exception path.',
  },
];

export const OPEN_QUESTIONS: string[] = [
  'CMS export vs crawler as the ingestion source: one option is needed for the pilot.',
  'No ready Postgres FTS configs for Turkish and Ukrainian: lean on vectors plus entity boost.',
  'OpenAI Agents SDK lock-in: keep it behind our own AgentPort.',
  'Confidence weights are hand-picked; calibrate on 50–100 reference questions before go-live.',
  'Who resolves CONFLICTING facts: the agent, an editor, or exclusion until resolved.',
  'Reranker cost and latency per query: cache by hash(query, filters) with a TTL.',
  '12 agents in the brief vs 5 for the pilot.',
];
