
import ImpactNotice from "./ImpactNotice";

export default function Inspector({
  selectedNode,
  viewMode,
  affectedCount,
}) {
  return (
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
        <ImpactNotice
          selectedNode={selectedNode}
          affectedCount={affectedCount}
        />
      )}
    </section>
  );
}
