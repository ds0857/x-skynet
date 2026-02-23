/**
 * layout.ts — DAG layout utilities for X-Skynet DAG Run Viewer (P2-07)
 *
 * Provides topological sort and layer-assignment for Sugiyama-style layouts.
 * This is used to compute `depth` (column) and `rank` (row) for each node so
 * that Mermaid definitions are emitted in a sensible order, and future
 * canvas-based renderers can position nodes without a full layout library.
 */

import type { DAGNode, Edge } from '../types/dag';

/** A node augmented with its computed layout position */
export interface LayoutNode extends DAGNode {
  /** Topological depth (0 = source / trigger node) */
  depth: number;
  /** Rank within the same depth level (0-indexed) */
  rank: number;
}

/**
 * Build an adjacency list (id → set of downstream ids) from an edge list.
 */
export function buildAdjacency(
  edges: Edge[],
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const { from, to } of edges) {
    if (!adj.has(from)) adj.set(from, new Set());
    adj.get(from)!.add(to);
  }
  return adj;
}

/**
 * Build a reverse adjacency list (id → set of upstream ids).
 */
export function buildIncoming(edges: Edge[]): Map<string, Set<string>> {
  const inc = new Map<string, Set<string>>();
  for (const { from, to } of edges) {
    if (!inc.has(to)) inc.set(to, new Set());
    inc.get(to)!.add(from);
  }
  return inc;
}

/**
 * Kahn's algorithm topological sort.
 * Returns node ids in topological order, or throws if a cycle is detected.
 */
export function topologicalSort(
  nodes: DAGNode[],
  edges: Edge[],
): string[] {
  const inDegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const { to } of edges) {
    inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const adj = buildAdjacency(edges);
  const sorted: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const neighbour of adj.get(id) ?? []) {
      const newDeg = (inDegree.get(neighbour) ?? 1) - 1;
      inDegree.set(neighbour, newDeg);
      if (newDeg === 0) queue.push(neighbour);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('[layout] Cycle detected in DAG — topological sort failed');
  }
  return sorted;
}

/**
 * Assign a `depth` to every node using the longest-path algorithm
 * (depth = max depth of all predecessors + 1, 0 for roots).
 */
export function assignDepths(
  nodes: DAGNode[],
  edges: Edge[],
): Map<string, number> {
  const order = topologicalSort(nodes, edges);
  const depths = new Map<string, number>();
  const incoming = buildIncoming(edges);

  for (const id of order) {
    const preds = incoming.get(id);
    if (!preds || preds.size === 0) {
      depths.set(id, 0);
    } else {
      const maxPredDepth = Math.max(...[...preds].map((p) => depths.get(p) ?? 0));
      depths.set(id, maxPredDepth + 1);
    }
  }
  return depths;
}

/**
 * Compute full layout for all nodes.
 * Returns `LayoutNode[]` sorted topologically with `depth` and `rank` filled in.
 */
export function computeLayout(
  nodes: DAGNode[],
  edges: Edge[],
): LayoutNode[] {
  const depths = assignDepths(nodes, edges);

  // Group by depth to assign rank
  const byDepth = new Map<number, string[]>();
  for (const [id, depth] of depths) {
    if (!byDepth.has(depth)) byDepth.set(depth, []);
    byDepth.get(depth)!.push(id);
  }

  const rankOf = new Map<string, number>();
  for (const [, ids] of byDepth) {
    ids.forEach((id, i) => rankOf.set(id, i));
  }

  const nodeMap = new Map<string, DAGNode>(nodes.map((n) => [n.id, n]));

  // Emit in topological order
  const order = topologicalSort(nodes, edges);
  return order.map((id) => ({
    ...nodeMap.get(id)!,
    depth: depths.get(id) ?? 0,
    rank: rankOf.get(id) ?? 0,
  }));
}
