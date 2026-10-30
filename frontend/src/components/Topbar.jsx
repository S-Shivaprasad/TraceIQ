
export default function Topbar({ repositoryName = "sample_repo" }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        Projects <span>/</span> {repositoryName} <span>/</span> Graph
      </div>

      <div className="topbar-right">
        <span className="local-badge">● Local analysis</span>
        <div className="avatar">TQ</div>
      </div>
    </header>
  );
}
