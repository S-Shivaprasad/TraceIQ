
export default function Sidebar({ repositoryName = "sample_repo" }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-600 text-lg font-bold tracking-tight text-white shadow-lg shadow-indigo-950/40"
          role="img"
          aria-label="TraceIQ logo"
        >
          T<span className="text-indigo-200">Q</span>
        </div>

        <div>
          <div className="brand-name">TraceIQ</div>
          <div className="brand-caption">CODE INTELLIGENCE</div>
        </div>
      </div>

      <div className="sidebar-label">WORKSPACE</div>

      <div className="project-card">
        <div className="project-icon">PY</div>

        <div>
          <div className="project-name">{repositoryName}</div>
          <div className="project-caption">Analyzed repository</div>
        </div>

        <span className="status-dot" />
      </div>

      <div className="sidebar-label">ANALYSIS</div>

      <div className="nav-item active">
        <span>◈</span> Dependency graph
      </div>

      <div className="sidebar-bottom">
        <div className="online-dot" />
        <span>Local analysis workspace</span>
      </div>
    </aside>
  );
}
