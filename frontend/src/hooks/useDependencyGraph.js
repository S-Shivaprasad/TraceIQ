
import { useCallback, useMemo, useState } from "react";
import {
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import { analyzeRepository } from "../services/api";
import { transformGraphToFlow } from "../utils/graphTransform";

const initialNodes = [
  {
    id: "main.py::main",
    type: "function",
    position: { x: 80, y: 180 },
    data: {
      name: "main()",
      file: "main.py",
      line: 4,
      role: "Application entry",
      description: "Starts the sample checkout workflow.",
      language: "Python",
    },
  },
  {
    id: "services/checkout.py::create_checkout",
    type: "function",
    position: { x: 400, y: 180 },
    data: {
      name: "create_checkout()",
      file: "services/checkout.py",
      line: 4,
      role: "Business logic",
      description: "Calculates the subtotal and applies the discount.",
      language: "Python",
    },
  },
  {
    id: "services/pricing.py::calculate_subtotal",
    type: "function",
    position: { x: 760, y: 70 },
    data: {
      name: "calculate_subtotal()",
      file: "services/pricing.py",
      line: 1,
      role: "Pricing function",
      description: "Calculates the subtotal.",
      language: "Python",
    },
  },
  {
    id: "services/pricing.py::apply_discount",
    type: "function",
    position: { x: 760, y: 300 },
    data: {
      name: "apply_discount()",
      file: "services/pricing.py",
      line: 5,
      role: "Pricing function",
      description: "Applies a discount.",
      language: "Python",
    },
  },
];

const initialEdges = [
  {
    id: "main-checkout",
    source: "main.py::main",
    target: "services/checkout.py::create_checkout",
    label: "calls",
    animated: true,
  },
  {
    id: "checkout-subtotal",
    source: "services/checkout.py::create_checkout",
    target: "services/pricing.py::calculate_subtotal",
    label: "calls",
  },
  {
    id: "checkout-discount",
    source: "services/checkout.py::create_checkout",
    target: "services/pricing.py::apply_discount",
    label: "calls",
  },
];

const DEFAULT_NODE_ID = "services/checkout.py::create_checkout";

export default function useDependencyGraph() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  const [selectedNodeId, setSelectedNodeId] =
    useState(DEFAULT_NODE_ID);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("neighborhood");
  const [resetKey, setResetKey] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [repositoryInfo, setRepositoryInfo] = useState(null);

  const selectedNode = nodes.find(
    (node) => node.id === selectedNodeId
  );

  const loadRepository = useCallback(async (repoUrl) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await analyzeRepository(repoUrl);
      const converted = transformGraphToFlow(result.graph);
      console.log("TraceIQ graph nodes:", converted.nodes);
console.log("TraceIQ graph edges:", converted.edges);
console.log("Selected first node:", converted.nodes[0]);
const selectedId = converted.nodes[0]?.id;

const connectedEdges = converted.edges.filter(
  (edge) =>
    edge.source === selectedId ||
    edge.target === selectedId
);

console.log("Selected node ID:", selectedId);
console.log("Edges connected to selected node:", connectedEdges);
console.log(
  "Total nodes and edges:",
  converted.nodes.length,
  converted.edges.length
);

      if (converted.nodes.length === 0) {
        throw new Error(
          "Analysis completed, but no graph nodes were returned."
        );
      }

      setNodes(converted.nodes);
      setEdges(converted.edges);
      const degreeByNode = new Map(
  converted.nodes.map((node) => [node.id, 0])
);

for (const edge of converted.edges) {
  degreeByNode.set(
    edge.source,
    (degreeByNode.get(edge.source) ?? 0) + 1
  );

  degreeByNode.set(
    edge.target,
    (degreeByNode.get(edge.target) ?? 0) + 1
  );
}

const bestNode = converted.nodes.reduce((best, node) => {
  if (!best) return node;

  return degreeByNode.get(node.id) > degreeByNode.get(best.id)
    ? node
    : best;
}, null);

setSelectedNodeId(bestNode?.id ?? converted.nodes[0].id);
      setSearch("");
      setViewMode("neighborhood");
      setResetKey((value) => value + 1);

      setRepositoryInfo({
        name: result.repository,
        language: result.language,
        pythonFiles: result.python_files,
        note: result.note,
        warnings: result.warnings ?? [],
      });

      return true;
    } catch (err) {
      setError(err.message || "Repository analysis failed.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  const impactIds = useMemo(() => {
    const affected = new Set([selectedNodeId]);
    const queue = [selectedNodeId];

    while (queue.length > 0) {
      const current = queue.shift();

      for (const edge of edges) {
        if (
          edge.target === current &&
          !affected.has(edge.source)
        ) {
          affected.add(edge.source);
          queue.push(edge.source);
        }
      }
    }

    return affected;
  }, [edges, selectedNodeId]);

  const visibleIds = useMemo(() => {
    if (viewMode === "impact") {
      return impactIds;
    }

    if (viewMode === "neighborhood") {
      const related = new Set([selectedNodeId]);

      for (const edge of edges) {
        if (edge.source === selectedNodeId) {
          related.add(edge.target);
        }

        if (edge.target === selectedNodeId) {
          related.add(edge.source);
        }
      }

      return related;
    }

    return new Set(nodes.map((node) => node.id));
  }, [viewMode, impactIds, selectedNodeId, edges, nodes]);

  const visibleNodes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return nodes.map((node) => {
      const name = node.data.name ?? "";
      const file = node.data.file ?? "";

      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        file.toLowerCase().includes(query);

      return {
        ...node,
        hidden: !visibleIds.has(node.id),
        style: {
          ...node.style,
          opacity: matchesSearch ? 1 : 0.15,
        },
      };
    });
  }, [nodes, search, visibleIds]);

  const visibleEdges = useMemo(() => {
    return edges.map((edge) => {
      const included =
        visibleIds.has(edge.source) &&
        visibleIds.has(edge.target);

      const highlighted =
        viewMode === "impact" &&
        included &&
        impactIds.has(edge.source);

      return {
        ...edge,
        hidden: !included,
        animated: highlighted,
        style: {
          stroke: highlighted ? "#91a0ff" : "#526684",
          strokeWidth: highlighted ? 2.5 : 1.5,
          opacity: included ? 1 : 0.15,
        },
        labelStyle: {
          fill: "#aab7ce",
          fontSize: 10,
        },
      };
    });
  }, [edges, visibleIds, viewMode, impactIds]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const focusSearchResult = useCallback(() => {
    const query = search.trim().toLowerCase();
    if (!query) return;

    const match = nodes.find(
      (node) =>
        (node.data.name ?? "").toLowerCase().includes(query) ||
        (node.data.file ?? "").toLowerCase().includes(query)
    );

    if (match) {
      setSelectedNodeId(match.id);
      setViewMode("neighborhood");
    }
  }, [search, nodes]);

  const toggleImpact = useCallback(() => {
    setViewMode((current) =>
      current === "impact" ? "all" : "impact"
    );
  }, []);

  const resetGraph = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(DEFAULT_NODE_ID);
    setSearch("");
    setViewMode("all");
    setRepositoryInfo(null);
    setError("");
    setResetKey((value) => value + 1);
  }, [setNodes, setEdges]);

  return {
    nodes,
    edges,
    visibleNodes,
    visibleEdges,
    selectedNode,
    selectedNodeId,
    search,
    setSearch,
    viewMode,
    setViewMode,
    resetKey,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    focusSearchResult,
    toggleImpact,
    resetGraph,
    loadRepository,
    isLoading,
    error,
    repositoryInfo,
    affectedCount: Math.max(0, impactIds.size - 1),
  };
}
