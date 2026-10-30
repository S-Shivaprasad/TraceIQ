
export default function ImpactNotice({ selectedNode, affectedCount }) {
  return (
    <div className="impact-notice">
      <strong>Potential impact detected</strong>
      <span>
        Starting from {selectedNode?.data.name ?? "the selected function"},
        this graph identifies {affectedCount} potentially affected caller(s).
        Review each relationship before concluding that a change causes a
        defect.
      </span>
    </div>
  );
}
