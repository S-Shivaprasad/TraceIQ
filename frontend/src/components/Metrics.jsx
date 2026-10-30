
export default function Metrics({ nodes = [], edges = [], status = "Ready" }) {
  const statusNote = {
    Ready: "Graph data available",
    Analyzing: "Analysis in progress",
    Error: "Analysis failed",
    Failed: "Analysis failed",
    Idle: "Waiting for analysis",
  }[status] ?? "Analysis status unavailable";

  return (
    <section className="metrics">
      <div className="metric-card">
        <span className="metric-label">FUNCTIONS</span>
        <strong>{nodes.length}</strong>
        <span className="metric-note">Detected in current graph</span>
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
        <strong className="status-value">{status}</strong>
        <span className="metric-note">{statusNote}</span>
      </div>
    </section>
  );
}
