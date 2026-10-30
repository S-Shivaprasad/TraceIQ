
export default function PageHeader({ viewMode, onToggleImpact }) {
  const isImpactView = viewMode === "impact";

  return (
    <section className="page-heading">
      <div>
        <div className="eyebrow">CODEBASE INTELLIGENCE / PYTHON</div>

        <h1>
          {isImpactView ? "Change impact analysis" : "Dependency graph"}
        </h1>

        <p>
          {isImpactView
            ? "Trace upstream callers to understand which functions may be affected by a change."
            : "Explore function relationships and understand what depends on what."}
        </p>
      </div>

      <button
        type="button"
        className="impact-button"
        onClick={onToggleImpact}
        aria-pressed={isImpactView}
      >
        {isImpactView ? "Show full graph" : "↗ Explore change impact"}
      </button>
    </section>
  );
}
