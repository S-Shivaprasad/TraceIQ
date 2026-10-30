
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";

import FunctionNode from "./FunctionNode";

const nodeTypes = { function: FunctionNode };

const baseButton =
  "rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-300 transition hover:border-indigo-400/70 hover:bg-slate-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

export default function GraphPanel({
  nodes,
  edges,
  search,
  setSearch,
  viewMode,
  setViewMode,
  resetKey,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onFind,
  onReset,
}) {
  const filterButton = (mode) =>
    `${baseButton} ${
      viewMode === mode
        ? "border-indigo-400/70 bg-indigo-500/15 text-indigo-200"
        : ""
    }`;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1523]">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Function map
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Caller → dependency
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-400 sm:w-56 sm:flex-none"
            placeholder="Search functions or files..."
            aria-label="Search functions or files"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onFind();
            }}
          />

          <button className={baseButton} onClick={onFind}>
            Find
          </button>

          <button
  type="button"
  className={baseButton}
  onClick={onReset}
>
  Back to home
</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-4 py-3">
        <button
          className={filterButton("all")}
          aria-pressed={viewMode === "all"}
          onClick={() => setViewMode("all")}
        >
          All functions
        </button>

        <button
          className={filterButton("neighborhood")}
          aria-pressed={viewMode === "neighborhood"}
          onClick={() => setViewMode("neighborhood")}
        >
          Direct connections
        </button>

        <button
          className={filterButton("impact")}
          aria-pressed={viewMode === "impact"}
          onClick={() => setViewMode("impact")}
        >
          Impact path
        </button>
      </div>

      <div className="h-[420px] min-w-0 bg-[radial-gradient(ellipse_at_center,_#101b2c_0%,_#0b1320_75%)] sm:h-[520px]">
        <ReactFlowProvider>
          <ReactFlow
            key={resetKey}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onlyRenderVisibleElements
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={0.15}
            maxZoom={1.6}
          >
            <Background color="#263348" gap={22} size={1} />
            <Controls
              className="!overflow-hidden !rounded-lg !border !border-slate-700 !shadow-none"
            />
            <MiniMap
              nodeColor="#7889ff"
              maskColor="rgba(5, 10, 20, 0.7)"
              className="!rounded-lg !border !border-slate-700"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-800 px-4 py-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-2">
          <i className="h-2 w-2 rounded-sm bg-indigo-400" />
          Function
        </span>

        <span className="inline-flex items-center gap-2">
          <i className="h-0.5 w-5 rounded bg-indigo-400" />
          Calls dependency
        </span>

        <span>Click a node to inspect it</span>
      </div>
    </section>
  );
}
