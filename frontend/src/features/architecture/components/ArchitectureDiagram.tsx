const BOX = 'fill-white stroke-zinc-300';
const LABEL = 'fill-zinc-900 text-[13px] font-semibold';
const SUB = 'fill-zinc-500 text-[11px]';

interface NodeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle?: string;
  accent?: boolean;
}

function Node({ x, y, w, h, title, subtitle, accent = false }: NodeProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        className={accent ? 'fill-sky-50 stroke-sky-300' : BOX}
      />
      <text
        x={x + w / 2}
        y={y + (subtitle ? h / 2 - 3 : h / 2 + 4)}
        textAnchor="middle"
        className={LABEL}
      >
        {title}
      </text>
      {subtitle && (
        <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" className={SUB}>
          {subtitle}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className="stroke-zinc-400"
      strokeWidth={1.5}
      markerEnd="url(#arrow)"
    />
  );
}

export function ArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 1040 300"
      className="h-auto w-full min-w-[760px]"
      role="img"
      aria-label="Knowledge Base feeds the RAG pipeline, which builds a compact context for the AI agent"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-zinc-400" />
        </marker>
      </defs>

      <rect
        x={10}
        y={20}
        width={200}
        height={260}
        rx={8}
        className="fill-zinc-50 stroke-zinc-300"
        strokeDasharray="4 3"
      />
      <text x={110} y={44} textAnchor="middle" className={LABEL}>
        Knowledge Base
      </text>
      <Node
        x={30}
        y={64}
        w={160}
        h={44}
        title="PostgreSQL"
        subtitle="articles · versions · facts"
      />
      <Node x={30} y={122} w={160} h={44} title="pgvector" subtitle="HNSW over live chunks" />
      <Node x={30} y={180} w={160} h={44} title="Full-text" subtitle="tsvector / BM25" />
      <text x={110} y={258} textAnchor="middle" className={SUB}>
        project_id on every row
      </text>

      <rect
        x={250}
        y={20}
        width={620}
        height={260}
        rx={8}
        className="fill-zinc-50 stroke-zinc-300"
        strokeDasharray="4 3"
      />
      <text x={560} y={44} textAnchor="middle" className={LABEL}>
        RAG
      </text>
      <Node x={270} y={122} w={100} h={44} title="Pre-filter" subtitle="before search" />
      <Node x={400} y={64} w={110} h={40} title="Vector" />
      <Node x={400} y={124} w={110} h={40} title="Full-Text" />
      <Node x={400} y={184} w={110} h={40} title="Metadata" />
      <Node x={540} y={122} w={80} h={44} title="RRF" subtitle="k = 60" />
      <Node x={645} y={122} w={95} h={44} title="Reranking" subtitle="own port" />
      <Node x={760} y={122} w={95} h={44} title="Context" subtitle="Builder" accent />
      <text x={807} y={196} textAnchor="middle" className={SUB}>
        confidence gate
      </text>

      <Node x={910} y={110} w={120} h={68} title="AI Agent" subtitle="answer + citations" />
      <text x={970} y={202} textAnchor="middle" className={SUB}>
        skipped on LOW
      </text>

      <Arrow x1={210} y1={144} x2={268} y2={144} />
      <Arrow x1={370} y1={136} x2={398} y2={86} />
      <Arrow x1={370} y1={144} x2={398} y2={144} />
      <Arrow x1={370} y1={152} x2={398} y2={202} />
      <Arrow x1={510} y1={86} x2={538} y2={136} />
      <Arrow x1={510} y1={144} x2={538} y2={144} />
      <Arrow x1={510} y1={202} x2={538} y2={152} />
      <Arrow x1={620} y1={144} x2={643} y2={144} />
      <Arrow x1={740} y1={144} x2={758} y2={144} />
      <Arrow x1={855} y1={144} x2={908} y2={144} />
    </svg>
  );
}
