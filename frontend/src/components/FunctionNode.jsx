
import { Handle, Position } from "@xyflow/react";

export default function FunctionNode({ data, selected }) {
  return (
    <div
      className={`w-[240px] rounded-xl border bg-[#111c30] p-3.5 text-slate-100 shadow-xl transition-colors ${
        selected
          ? "border-indigo-400 ring-1 ring-indigo-400/30 shadow-indigo-950/40"
          : "border-slate-700/80 hover:border-indigo-400/60"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-2 !border-indigo-200 !bg-indigo-400"
      />

      <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.12em] text-slate-400">
        <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
        <span>PYTHON FUNCTION</span>
      </div>

      <div
        className="mt-3 break-words font-mono text-xs font-medium leading-5 text-indigo-100"
        title={data.name}
      >
        {data.name}
      </div>

      <div
        className="mt-2 break-all font-mono text-[10px] leading-4 text-slate-400"
        title={data.file}
      >
        {data.file}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-700/80 pt-2.5 text-[10px] text-slate-400">
        <span className="truncate">{data.role}</span>
        <span className="shrink-0 font-mono">:{data.line}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-2 !border-indigo-200 !bg-indigo-400"
      />
    </div>
  );
}
