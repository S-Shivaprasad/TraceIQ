
export function transformGraphToFlow(graph) {
  const rawNodes = graph.nodes ?? [];

  const edges = (graph.edges ?? [])
    .filter((edge) => edge.source && edge.target)
    .map((edge, index) => ({
      id: edge.id ?? `dependency-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.call ?? edge.label ?? "calls",
    }));

  // Build adjacency for graph-aware ordering.
  const nodeIds = rawNodes.map((node) => node.id);
  const nodeIdSet = new Set(nodeIds);
  const neighbors = new Map(nodeIds.map((id) => [id, new Set()]));

  for (const edge of edges) {
    if (!nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target)) {
      continue;
    }

    neighbors.get(edge.source).add(edge.target);
    neighbors.get(edge.target).add(edge.source);
  }

  // Spread nodes across columns, grouping nearby functions together.
  const columns = Math.max(1, Math.ceil(Math.sqrt(rawNodes.length)));
  const rows = Math.ceil(rawNodes.length / columns);
  const ordered = [...rawNodes].sort((a, b) => {
    const degreeDifference =
      neighbors.get(b.id).size - neighbors.get(a.id).size;

    return degreeDifference || a.id.localeCompare(b.id);
  });

  const positions = new Map();

  ordered.forEach((node, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;

    positions.set(node.id, {
      x: column * 340 + (row % 2) * 18,
      y: row * 190,
    });
  });

  const nodes = rawNodes.map((item) => ({
    id: item.id,
    type: "function",
    position: positions.get(item.id) ?? { x: 0, y: 0 },
    data: {
      name: item.name?.endsWith("()")
        ? item.name
        : `${item.name ?? "Unknown"}()`,
      file: item.file ?? "Unknown file",
      line: item.line ?? 1,
      role: "Detected function",
      description: `Function defined in ${
        item.file ?? "an unknown file"
      }.`,
      language: "Python",
    },
  }));

  return { nodes, edges };
}
