
import { useState } from "react";
import "@xyflow/react/dist/style.css";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import PageHeader from "./components/PageHeader";
import Metrics from "./components/Metrics";
import GraphPanel from "./components/GraphPanel";
import Inspector from "./components/Inspector";
import useDependencyGraph from "./hooks/useDependencyGraph";

function TraceIQMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 via-violet-500 to-blue-600 shadow-lg shadow-indigo-500/25">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6 text-white"
        aria-hidden="true"
      >
        <circle cx="5" cy="5" r="2.5" fill="currentColor" />
        <circle cx="19" cy="6" r="2.5" fill="currentColor" />
        <circle cx="12" cy="19" r="2.5" fill="currentColor" />
        <path
          d="M7.3 6.1 16.6 6M6.3 7.3l4.5 9.3m6.8-8.4-4.5 8.4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function DependencyPreview() {
  const nodes = [
    {
      label: "main()",
      detail: "Entry point",
      position: "left-[5%] top-[35%]",
      color: "border-blue-400/40 bg-blue-500/10",
    },
    {
      label: "checkout()",
      detail: "Business logic",
      position: "left-[37%] top-[18%]",
      color: "border-violet-400/40 bg-violet-500/10",
    },
    {
      label: "pricing()",
      detail: "Calculation",
      position: "right-[4%] top-[9%]",
      color: "border-cyan-400/40 bg-cyan-500/10",
    },
    {
      label: "discount()",
      detail: "Pricing rule",
      position: "right-[4%] bottom-[9%]",
      color: "border-indigo-400/40 bg-indigo-500/10",
    },
  ];

  return (
    <div className="relative mx-auto h-[290px] w-full max-w-[550px] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b1020]/90 sm:h-[340px]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#6677a5 0.8px, transparent 0.8px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        DEPENDENCY PREVIEW
      </div>

      <svg
        viewBox="0 0 550 340"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="traceiq-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <path
          d="M110 170 C155 170 160 125 225 110"
          stroke="url(#traceiq-line)"
          strokeWidth="1.8"
          fill="none"
        />
        <path
          d="M300 105 C355 100 380 80 435 78"
          stroke="url(#traceiq-line)"
          strokeWidth="1.8"
          fill="none"
        />
        <path
          d="M300 120 C360 145 370 235 435 255"
          stroke="url(#traceiq-line)"
          strokeWidth="1.8"
          fill="none"
        />
        <circle cx="166" cy="151" r="3" fill="#60a5fa" />
        <circle cx="367" cy="91" r="3" fill="#a78bfa" />
        <circle cx="359" cy="176" r="3" fill="#818cf8" />
      </svg>

      {nodes.map((node) => (
        <div
          key={node.label}
          className={`absolute z-10 w-[112px] rounded-xl border p-2.5 shadow-xl backdrop-blur-xl sm:w-[135px] sm:p-3 ${node.position} ${node.color}`}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
            <span className="truncate text-[10px] text-slate-400 sm:text-xs">
              {node.detail}
            </span>
          </div>
          <div className="truncate font-mono text-[11px] font-semibold text-slate-100 sm:text-sm">
            {node.label}
          </div>
        </div>
      ))}

      <div className="absolute bottom-3 left-3 z-10 text-[10px] text-slate-500 sm:bottom-4 sm:left-4 sm:text-xs">
        Illustrative graph · Sample relationships
      </div>
    </div>
  );
}

function FeatureCard({ number, title, description }) {
  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-white/[0.045]">
      <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-400/10 font-mono text-sm text-indigo-300">
        {number}
      </span>
      <h3 className="mb-2 font-semibold text-slate-100">{title}</h3>
      <p className="text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function LandingPage({ graph, repoUrl, setRepoUrl, onAnalyze }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080b14] text-white selection:bg-indigo-500/30">
      <div
        className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 top-72 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-white/[0.07]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <a href="#" className="flex items-center gap-3">
            <TraceIQMark />
            <span className="text-xl font-bold tracking-tight">
              Trace<span className="text-indigo-300">IQ</span>
            </span>
          </a>

          <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-400 sm:inline-flex">
            Developer intelligence platform
          </span>

          <a
            href="#analyze"
            className="rounded-lg border border-indigo-400/25 bg-indigo-400/10 px-4 py-2.5 text-sm font-medium text-indigo-200 transition hover:bg-indigo-400/20"
          >
            Get started <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <section className="grid items-center gap-12 pb-16 pt-16 sm:pb-20 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-28 lg:pt-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-3.5 py-2 text-[10px] font-semibold tracking-[0.18em] text-indigo-200 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_12px_#818cf8]" />
              PYTHON CODE INTELLIGENCE
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Understand your code.
              <span className="mt-2 block bg-gradient-to-r from-indigo-300 via-violet-300 to-blue-300 bg-clip-text text-transparent">
                Trace the impact.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              Explore how your Python functions connect. Map dependencies
              and discover which parts of your code may be affected by a
              change—all from a GitHub repository.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <span className="text-indigo-300">✳</span>
                Dependency mapping
              </span>
              <span className="flex items-center gap-2">
                <span className="text-indigo-300">↗</span>
                Impact tracing
              </span>
              <span className="flex items-center gap-2">
                <span className="text-indigo-300">⌘</span>
                Evidence-backed links
              </span>
            </div>

            <form
              id="analyze"
              onSubmit={onAnalyze}
              className="mt-10 scroll-mt-8 rounded-2xl border border-white/10 bg-[#111625]/90 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-4"
            >
              <label
                htmlFor="landing-repository-url"
                className="mb-3 block px-1 text-sm font-medium text-slate-200"
              >
                Start with a public GitHub repository
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3.5 transition focus-within:border-indigo-400/60 sm:px-4">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 shrink-0 text-slate-500"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 19c-4.2 1.3-4.2-2.1-5.9-2.5M15 21v-3.2a2.8 2.8 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6A4.7 4.7 0 0 0 18.4 6a4.4 4.4 0 0 0-.1-3.4S17.2 2.3 15 4a12 12 0 0 0-6 0C6.8 2.3 5.7 2.6 5.7 2.6A4.4 4.4 0 0 0 5.6 6a4.7 4.7 0 0 0-1.3 3.6c0 4.7 2.8 5.7 5.5 6A2.8 2.8 0 0 0 9 17.8V21"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <input
                    id="landing-repository-url"
                    type="url"
                    value={repoUrl}
                    onChange={(event) => setRepoUrl(event.target.value)}
                    placeholder="https://github.com/owner/repo"
                    required
                    className="h-12 min-w-0 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={graph.isLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:from-indigo-400 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/70 disabled:cursor-not-allowed disabled:opacity-60 sm:shrink-0"
                >
                  {graph.isLoading ? "Analyzing..." : "Analyze repository"}
                  {!graph.isLoading && <span aria-hidden="true">→</span>}
                </button>
              </div>

              <p className="mt-3 px-1 text-xs leading-5 text-slate-500">
                Public repositories only · Python analysis · Repository
                source code is not executed
              </p>
            </form>

            {graph.isLoading && (
              <p role="status" className="mt-4 text-sm text-indigo-200">
                Downloading and analyzing the repository. Please wait...
              </p>
            )}

            {graph.error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm leading-6 text-rose-200"
              >
                {graph.error}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-transparent to-blue-500/10 blur-2xl" />
            <div className="relative">
              <DependencyPreview />
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              An illustration of how TraceIQ visualizes code relationships
            </p>
          </div>
        </section>

        <section className="border-t border-white/[0.07] py-16 sm:py-20">
          <div className="mb-9 max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-indigo-300">
              BUILT FOR CODE EXPLORATION
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              See the connections behind your code.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
              Understand relationships and investigate potential impact
              without manually following every function call.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              number="01"
              title="Dependency mapping"
              description="Visualize supported relationships between Python functions and explore how your code is connected."
            />
            <FeatureCard
              number="02"
              title="Impact analysis"
              description="Select a function and trace upstream callers to investigate which parts may depend on it."
            />
            <FeatureCard
              number="03"
              title="Evidence first"
              description="Inspect the relationships identified by static analysis. Dependencies are estimates, not proof of runtime behavior."
            />
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/[0.07] py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} TraceIQ. Code relationships, made visible.
          </span>
          <span>Built for developers who want to understand their code.</span>
        </footer>
      </main>
    </div>
  );
}

function ResultsPage({ graph, repoUrl, setRepoUrl, onAnalyze, onBackHome }) {
  const repositoryName =
    graph.repositoryInfo?.name ||
    repoUrl.split("/").filter(Boolean).slice(-2).join("/") ||
    "sample_repo";
  return (
    <div className="app-shell">
      <Sidebar repositoryName={repositoryName} />

      <main className="main-content">
        <Topbar repositoryName={repositoryName} />

        <PageHeader
          viewMode={graph.viewMode}
          onToggleImpact={graph.toggleImpact}
        />

        <section className="repository-import">
          <form onSubmit={onAnalyze} className="repository-form">
            <label htmlFor="repository-url">
              GitHub repository URL
            </label>

            <div className="repository-input-row">
              <input
                id="repository-url"
                type="url"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/psf/requests"
                required
              />

              <button type="submit" disabled={graph.isLoading}>
                {graph.isLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </form>

          {graph.isLoading && (
            <p className="repository-status" role="status">
              Downloading repository and analyzing dependencies.
              Please wait...
            </p>
          )}

          {graph.error && (
            <p className="repository-error" role="alert">
              {graph.error}
            </p>
          )}

          {graph.repositoryInfo && (
            <div className="repository-result">
              <strong>{graph.repositoryInfo.name}</strong>
              <span>Language: {graph.repositoryInfo.language}</span>
              <span>Python files: {graph.repositoryInfo.pythonFiles}</span>
              <p>{graph.repositoryInfo.note}</p>

              {graph.repositoryInfo.warnings?.map((warning) => (
                <p key={warning} className="repository-status">
                  {warning}
                </p>
              ))}
            </div>
          )}
        </section>

        <Metrics nodes={graph.nodes} edges={graph.edges} />

        <GraphPanel
          nodes={graph.visibleNodes}
          edges={graph.visibleEdges}
          search={graph.search}
          setSearch={graph.setSearch}
          viewMode={graph.viewMode}
          setViewMode={graph.setViewMode}
          resetKey={graph.resetKey}
          onNodesChange={graph.onNodesChange}
          onEdgesChange={graph.onEdgesChange}
          onNodeClick={graph.onNodeClick}
          onFind={graph.focusSearchResult}
          onReset={onBackHome}
        />

        <Inspector
          selectedNode={graph.selectedNode}
          viewMode={graph.viewMode}
          affectedCount={graph.affectedCount}
        />

        <footer className="app-footer">
          <span>TraceIQ · Code relationships, made visible.</span>
          <button type="button" onClick={onBackHome}>
            ← Back to home
          </button>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  const graph = useDependencyGraph();
  const [repoUrl, setRepoUrl] = useState("");
  const [showResults, setShowResults] = useState(false);

  async function handleAnalyze(event) {
    event.preventDefault();

    if (!repoUrl.trim() || graph.isLoading) return;

    const success = await graph.loadRepository(repoUrl.trim());

    if (success) {
      setShowResults(true);
    }
  }

  function handleBackHome() {
    setShowResults(false);
    graph.resetGraph();
    setRepoUrl("");
  }

  if (showResults) {
    return (
      <ResultsPage
        graph={graph}
        repoUrl={repoUrl}
        setRepoUrl={setRepoUrl}
        onAnalyze={handleAnalyze}
        onBackHome={handleBackHome}
      />
    );
  }

  return (
    <LandingPage
      graph={graph}
      repoUrl={repoUrl}
      setRepoUrl={setRepoUrl}
      onAnalyze={handleAnalyze}
    />
  );
}
