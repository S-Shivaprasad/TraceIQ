
import ast
from pathlib import Path


class PythonStructureVisitor(ast.NodeVisitor):
    """Collect Python definitions, imports, and calls with their context."""

    def __init__(self):
        self.functions = []
        self.classes = []
        self.imports = []
        self.calls = []
        self.function_stack = []
        self.class_stack = []

    def visit_FunctionDef(self, node):
        self._visit_function(node)

    def visit_AsyncFunctionDef(self, node):
        self._visit_function(node)

    def _visit_function(self, node):
        self.functions.append({
            "name": node.name,
            "line": node.lineno,
            "end_line": node.end_lineno,
        })

        self.function_stack.append(node.name)
        self.generic_visit(node)
        self.function_stack.pop()

    def visit_ClassDef(self, node):
        self.classes.append({
            "name": node.name,
            "line": node.lineno,
            "end_line": node.end_lineno,
        })

        self.class_stack.append(node.name)
        self.generic_visit(node)
        self.class_stack.pop()

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append({
                "module": alias.name,
                "line": node.lineno,
            })

    def visit_ImportFrom(self, node):
        self.imports.append({
            "module": node.module or "",
            "names": [alias.name for alias in node.names],
            "line": node.lineno,
        })

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            call_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            call_name = node.func.attr
        else:
            call_name = None

        if call_name:
            self.calls.append({
                "name": call_name,
                "line": node.lineno,
                "enclosing_function": (
                    self.function_stack[-1]
                    if self.function_stack else None
                ),
                "enclosing_class": (
                    self.class_stack[-1]
                    if self.class_stack else None
                ),
            })

        self.generic_visit(node)


def analyze_python_file(file_path: str) -> dict:
    """Extract Python structure without executing the source code."""
    path = Path(file_path)
    source = path.read_text(encoding="utf-8")

    try:
        tree = ast.parse(source, filename=str(path))
    except SyntaxError as exc:
        return {
            "file": str(path),
            "error": f"Syntax error on line {exc.lineno}: {exc.msg}",
            "functions": [],
            "classes": [],
            "imports": [],
            "calls": [],
        }

    visitor = PythonStructureVisitor()
    visitor.visit(tree)

    return {
        "file": str(path),
        "functions": sorted(
            visitor.functions, key=lambda item: item["line"]
        ),
        "classes": sorted(
            visitor.classes, key=lambda item: item["line"]
        ),
        "imports": sorted(
            visitor.imports, key=lambda item: item["line"]
        ),
        "calls": sorted(
            visitor.calls, key=lambda item: item["line"]
        ),
    }
