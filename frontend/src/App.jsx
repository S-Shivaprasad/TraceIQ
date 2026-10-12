
import { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";

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
      description: "Calculates price multiplied by quantity.",
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
      description: "Applies a percentage discount to the subtotal.",
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

function FunctionNode({ data, selected }) {
  return (
    <div className={`function-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-topline">
        <span className="node-dot" />
        <span>PYTHON FUNCTION</span>
      </div>
      <div className="node-name">{data.name}</div>
      <div className="node-file">{data.file}</div>
      <div className="node-footer">
        <span>{data.role}</span>
        <span>:{data.line}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { function: FunctionNode };

function GraphExplorer() {

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(
    "services/checkout.py::create_checkout"
  );
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [resetKey, setResetKey] = useState(0);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  // If apply_discount changes, trace callers backward through the graph.
  const impactIds = useMemo(() => {
    const affected = new Set([selectedNodeId]);
    const queue = [selectedNodeId];

    while (queue.length > 0) {
      const current = queue.shift();

      for (const edge of edges) {
        if (edge.target === current && !affected.has(edge.source)) {
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
      const matchesSearch =
        !query ||
        node.data.name.toLowerCase().includes(query) ||
        node.data.file.toLowerCase().includes(query);

      const included = visibleIds.has(node.id);

      return {
        ...node,
        hidden: !included,
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
        visibleIds.has(edge.source) && visibleIds.has(edge.target);

      const highlighted =
        viewMode === "impact" &&
        included &&
        (edge.source === selectedNodeId ||
          edge.target === selectedNodeId ||
          impactIds.has(edge.source));

      return {
        ...edge,
        hidden: !included,
        animated: highlighted,
        style: {
          stroke: highlighted ? "#91a0ff" : "#526684",
          strokeWidth: highlighted ? 2.5 : 1.5,
          opacity: included ? 1 : 0.15,
        },
        labelStyle: { fill: "#aab7ce", fontSize: 10 },
      };
    });
  }, [edges, visibleIds, viewMode, selectedNodeId, impactIds]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const focusSearchResult = () => {
    const query = search.trim().toLowerCase();
    if (!query) return;

    const match = nodes.find(
      (node) =>
        node.data.name.toLowerCase().includes(query) ||
        node.data.file.toLowerCase().includes(query)
    );

    if (match) {
      setSelectedNodeId(match.id);
      setViewMode("neighborhood");
    }
  };

  const resetGraph = () => {
    setNodes(initialNodes);
    setSelectedNodeId("services/checkout.py::create_checkout");
    setSearch("");
    setViewMode("all");
    setResetKey((value) => value + 1);
  };


  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div>
            <div className="brand-name">TraceIQ</div>
            <div className="brand-caption">CODE INTELLIGENCE</div>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <div className="project-card">
          <div className="project-icon">PY</div>
          <div>
            <div className="project-name">sample_repo</div>
            <div className="project-caption">Python project</div>
          </div>
          <span className="status-dot" />
        </div>

        <div className="sidebar-label">ANALYSIS</div>
        <div className="nav-item active"><span>◈</span> Dependency graph</div>
        <div className="nav-item"><span>⌁</span> Change impact</div>
        <div className="nav-item"><span>✓</span> Test coverage</div>

        <div className="sidebar-bottom">
          <div className="online-dot" />
          <span>Local analysis workspace</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Projects <span>/</span> sample_repo <span>/</span> Graph</div>
          <div className="topbar-right">
            <span className="local-badge">● Local demo</span>
            <div className="avatar">TQ</div>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">CODEBASE INTELLIGENCE / PYTHON</div>
            <h1>Dependency graph</h1>
            <p>Explore function relationships and understand what depends on what.</p>
          </div>
          <button
  className="impact-button"
  onClick={() => {
    if (viewMode === "impact") {
      setViewMode("all");
    } else {
      setSelectedNodeId("services/pricing.py::apply_discount");
      setViewMode("impact");
    }
  }}
>
  {viewMode === "impact" ? "Show full graph" : "↗ Explore change impact"}
</button>
        </section>

        <section className="metrics">
          <div className="metric-card">
            <span className="metric-label">FUNCTIONS</span>
            <strong>{nodes.length}</strong>
            <span className="metric-note">Detected in sample graph</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">DEPENDENCIES</span>
            <strong>{edges.length}</strong>
            <span className="metric-note">Resolved call relationships</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">LANGUAGE</span>
            <strong className="language-value">Python</strong>
            <span className="metric-note">AST-based analysis</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">ANALYSIS STATUS</span>
            <strong className="status-value">Ready</strong>
            <span className="metric-note">Sample data loaded</span>
          </div>
        </section>

        <section className="graph-panel">
          <div className="graph-toolbar">
            <div>
              <strong>Function map</strong>
              <span className="graph-subtitle">Caller → dependency</span>
            </div>
            <div className="graph-actions">
  <input
    className="search-input"
    placeholder="Search functions or files..."
    value={search}
    onChange={(event) => setSearch(event.target.value)}
    onKeyDown={(event) => {
      if (event.key === "Enter") focusSearchResult();
    }}
  />
  <button className="small-button" onClick={focusSearchResult}>
    Find
  </button>
  <button className="small-button" onClick={resetGraph}>
    Reset
  </button>
</div>
          </div>
          <div className="filter-toolbar">
  <button
    className={viewMode === "all" ? "filter-button active" : "filter-button"}
    onClick={() => setViewMode("all")}
  >
    All functions
  </button>
  <button
    className={viewMode === "neighborhood" ? "filter-button active" : "filter-button"}
    onClick={() => setViewMode("neighborhood")}
  >
    Direct connections
  </button>
  <button
    className={viewMode === "impact" ? "filter-button active" : "filter-button"}
    onClick={() => setViewMode("impact")}
  >
    Impact path
  </button>
</div>

          <div className="graph-canvas">
            <ReactFlowProvider>
             <ReactFlow
  key={resetKey}
  nodes={visibleNodes}
  edges={visibleEdges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onNodeClick={onNodeClick}
  fitView
  fitViewOptions={{ padding: 0.25 }}
  minZoom={0.3}
  maxZoom={1.6}
>
                <Background color="#263348" gap={22} size={1} />
                <Controls />
                <MiniMap
                  nodeColor="#5f7cff"
                  maskColor="rgba(5, 10, 20, 0.7)"
                />
              </ReactFlow>
            </ReactFlowProvider>
          </div>

          <div className="graph-legend">
            <span><i className="legend-node" /> Function</span>
            <span><i className="legend-line" /> Calls dependency</span>
            <span>Click a node to inspect it</span>
          </div>
        </section>

        <section className="details-panel">
          <div className="details-heading">
            <div>
              <div className="eyebrow">INSPECTOR</div>
              <h2>{selectedNode?.data.name ?? "Select a function"}</h2>
            </div>
            <span className="function-tag">FUNCTION</span>
          </div>

          {selectedNode && (
            <div className="details-grid">
              <div className="detail-item">
                <span>Source file</span>
                <strong>{selectedNode.data.file}</strong>
              </div>
              <div className="detail-item">
                <span>Start line</span>
                <strong>{selectedNode.data.line}</strong>
              </div>
              <div className="detail-item">
                <span>Function role</span>
                <strong>{selectedNode.data.role}</strong>
              </div>
              <div className="detail-item">
                <span>Description</span>
                <strong>{selectedNode.data.description}</strong>
              </div>
            </div>
          )}

          {viewMode === "impact" && (
  <div className="impact-notice">
    <strong>Potential impact detected</strong>
    <span>
      Starting from {selectedNode?.data.name}, this graph identifies{" "}
      {Math.max(0, impactIds.size - 1)} potentially affected caller(s).
      Review each relationship before concluding that a change causes a defect.
    </span>
  </div>
)}
        </section>

        <footer className="app-footer">
          <span>TraceIQ · Code relationships, made visible.</span>
          <span>Prototype · Sample repository</span>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return <GraphExplorer />;
}
