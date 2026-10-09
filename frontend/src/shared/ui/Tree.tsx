import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface TreeNode {
  id: string;
  label: ReactNode;
  meta?: ReactNode;
  content?: ReactNode;
  children?: TreeNode[];
}

interface TreeProps {
  nodes: TreeNode[];
  highlightedId?: string | null;
  defaultExpanded?: string[];
}

export function Tree({ nodes, highlightedId = null, defaultExpanded = [] }: TreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded));

  useEffect(() => {
    if (!highlightedId) return;
    const path = findPath(nodes, highlightedId);
    if (path) setExpanded((current) => new Set([...current, ...path]));
  }, [highlightedId, nodes]);

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ul className="text-sm" role="tree">
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          highlightedId={highlightedId}
        />
      ))}
    </ul>
  );
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  highlightedId: string | null;
}

function TreeItem({ node, depth, expanded, onToggle, highlightedId }: TreeItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  const expandable = Boolean(node.children?.length) || Boolean(node.content);
  const isOpen = expanded.has(node.id);
  const highlighted = node.id === highlightedId;

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlighted]);

  return (
    <li ref={ref} role="treeitem" aria-expanded={expandable ? isOpen : undefined}>
      <button
        type="button"
        onClick={() => {
          onToggle(node.id);
        }}
        disabled={!expandable}
        className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-zinc-50 disabled:cursor-default ${highlighted ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span className="mt-0.5 w-3 shrink-0 text-xs text-zinc-400" aria-hidden>
          {expandable ? (isOpen ? '▾' : '▸') : ''}
        </span>
        <span className="min-w-0 flex-1">{node.label}</span>
        {node.meta && <span className="shrink-0 text-xs text-zinc-500">{node.meta}</span>}
      </button>
      {isOpen && node.content && (
        <div className="pb-2 pr-2" style={{ paddingLeft: `${depth * 16 + 28}px` }}>
          {node.content}
        </div>
      )}
      {isOpen && node.children && (
        <ul role="group">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              highlightedId={highlightedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function findPath(nodes: TreeNode[], id: string): string[] | null {
  for (const node of nodes) {
    if (node.id === id) return [node.id];
    const path = node.children ? findPath(node.children, id) : null;
    if (path) return [node.id, ...path];
  }
  return null;
}
