
from collections import defaultdict, deque
from pathlib import Path

from backend.analyzer.python_analyzer import analyze_python_file


def build_dependency_graph(root_dir: str) -> dict:
    """Build a conservative function-level dependency graph for Python files.

    Edge direction: caller -> dependency.
    """
    root = Path(root_dir)
    file_results = {}
    definitions = defaultdict(list)

    for path in sorted(root.rglob("*.py")):
        # Ignore generated Python cache files.
        if "__pycache__" in path.parts:
            continue

        result = analyze_python_file(str(path))
        if "error" in result:
            continue

        relative_path = path.relative_to(root).as_posix()
        file_results[relative_path] = result

        for function in result["functions"]:
            definitions[function["name"]].append({
                "file": relative_path,
                "name": function["name"],
                "line": function["line"],
            })

    nodes = {}
    edges = []
    edge_keys = set()

    for relative_path, result in file_results.items():
        # Resolve imported names to definitions in this repository.
        imported_names = set()
        for item in result["imports"]:
            imported_names.update(item.get("names", []))

        # Use name resolution only when there is a unique definition.
        for function in result["functions"]:
            node_id = f"{relative_path}::{function['name']}"
            nodes[node_id] = {
                "id": node_id,
                "name": function["name"],
                "file": relative_path,
                "line": function["line"],
                "end_line": function["end_line"],
            }

        for call in result["calls"]:
            caller_name = call["enclosing_function"]
            if caller_name is None:
                continue

            caller_id = f"{relative_path}::{caller_name}"
            if caller_id not in nodes:
                continue

            candidates = definitions.get(call["name"], [])

            # Avoid ambiguous links. Prefer definitions imported by this file.
            imported_candidates = [
                item for item in candidates
                if item["name"] in imported_names
            ]
            if imported_candidates:
                candidates = imported_candidates

            if len(candidates) != 1:
                continue

            target = candidates[0]
            target_id = f"{target['file']}::{target['name']}"

            # Skip self-calls for this first graph version.
            if caller_id == target_id:
                continue

            edge_key = (caller_id, target_id)
            if edge_key in edge_keys:
                continue
            edge_keys.add(edge_key)

            edges.append({
                "source": caller_id,
                "target": target_id,
                "call": call["name"],
                "line": call["line"],
                "evidence": (
                    f"{relative_path}:{call['line']} calls "
                    f"{call['name']} inside {caller_name}()"
                ),
            })

    return {
        "root": str(root),
        "nodes": sorted(nodes.values(), key=lambda item: item["id"]),
        "edges": sorted(
            edges,
            key=lambda item: (item["source"], item["target"], item["line"]),
        ),
    }


def get_dependencies(graph: dict, function_id: str) -> list[str]:
    """Return direct dependencies of a function."""
    return sorted({
        edge["target"]
        for edge in graph["edges"]
        if edge["source"] == function_id
    })


def get_dependents(graph: dict, function_id: str) -> list[str]:
    """Return direct callers that depend on a function."""
    return sorted({
        edge["source"]
        for edge in graph["edges"]
        if edge["target"] == function_id
    })


def trace_impact(graph: dict, changed_function_id: str) -> list[str]:
    """Find all transitive callers potentially affected by a change."""
    reverse_edges = defaultdict(list)
    for edge in graph["edges"]:
        reverse_edges[edge["target"]].append(edge["source"])

    visited = set()
    queue = deque(reverse_edges[changed_function_id])

    while queue:
        current = queue.popleft()
        if current == changed_function_id or current in visited:
            continue

        visited.add(current)
        queue.extend(reverse_edges[current])

    return sorted(visited)
