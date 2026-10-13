
from collections import defaultdict, deque
from pathlib import Path

from backend.analyzer.python_analyzer import analyze_python_file


def build_dependency_graph(root_dir: str) -> dict:
    """Build a conservative function-level graph.

    Edge direction: caller -> dependency.
    """
    root = Path(root_dir)
    file_results = {}
    definitions = defaultdict(list)
    nodes = {}

    # PASS 1: Analyze files and register every function definition.
    for path in sorted(root.rglob("*.py")):
        if "__pycache__" in path.parts:
            continue

        result = analyze_python_file(str(path))
        if "error" in result:
            continue

        relative_path = path.relative_to(root).as_posix()
        file_results[relative_path] = result

        for function in result["functions"]:
            qualified_name = function.get(
                "qualified_name", function["name"]
            )

            definition = {
                "file": relative_path,
                "name": function["name"],
                "qualified_name": qualified_name,
                "line": function["line"],
            }
            definitions[function["name"]].append(definition)

            node_id = f"{relative_path}::{qualified_name}"
            nodes[node_id] = {
                "id": node_id,
                "name": qualified_name,
                "file": relative_path,
                "line": function["line"],
                "end_line": function["end_line"],
            }

    # PASS 2: Resolve calls after all nodes are registered.
    edges = []
    edge_keys = set()

    for relative_path, result in file_results.items():
     
        imported_names = set()
        import_aliases = {}

        for item in result["imports"]:
            imported_names.update(
                name for name in item.get("names", []) if name
            )

            for local_name, original_name in item.get("aliases", {}).items():
                if local_name and original_name:
                    import_aliases[local_name] = original_name
                    imported_names.add(original_name)


        for item in result["imports"]:
            imported_names.update(item.get("names", []))
            imported_names.update(item.get("aliases", {}).keys())

        for call in result["calls"]:
            if call.get("is_attribute_call", False):
                continue
            caller_name = call["enclosing_function"]
            if caller_name is None:
                continue

            caller_id = f"{relative_path}::{caller_name}"
            if caller_id not in nodes:
                continue

           
            call_name = call["name"]
            resolved_call_name = import_aliases.get(call_name, call_name)
            candidates = definitions.get(resolved_call_name, [])


            # Prefer a nested function defined inside the current function.
            local_name = f"{caller_name}.{call['name']}"
            local_candidates = [
                item for item in candidates
                if item["file"] == relative_path
                and item["qualified_name"] == local_name
            ]

            if local_candidates:
                candidates = local_candidates
            else:
                # Prefer imported names when they narrow the candidates.
                imported_candidates = [
                    item for item in candidates
                    if item["name"] in imported_names
                ]
                if imported_candidates:
                    candidates = imported_candidates

            # Avoid guessing if the name is ambiguous.
            if len(candidates) != 1:
                continue

            target = candidates[0]
            target_id = (
                f"{target['file']}::{target['qualified_name']}"
            )

            if target_id not in nodes or caller_id == target_id:
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
            key=lambda item: (
                item["source"], item["target"], item["line"]
            ),
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
    """Find transitive callers potentially affected by a change."""
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
