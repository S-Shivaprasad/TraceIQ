
import unittest
import tempfile
from pathlib import Path

from backend.analyzer.dependency_graph import (
    build_dependency_graph,
    get_dependencies,
    get_dependents,
    trace_impact,
)


class TestDependencyGraph(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.graph = build_dependency_graph("sample_repo")

    def test_checkout_depends_on_pricing_functions(self):
        checkout_id = "services/checkout.py::create_checkout"

        dependencies = get_dependencies(self.graph, checkout_id)

        self.assertIn(
            "services/pricing.py::calculate_subtotal",
            dependencies,
        )
        self.assertIn(
            "services/pricing.py::apply_discount",
            dependencies,
        )

    def test_main_depends_on_checkout(self):
        main_id = "main.py::main"

        self.assertIn(
            "services/checkout.py::create_checkout",
            get_dependencies(self.graph, main_id),
        )

    def test_pricing_function_has_checkout_as_dependent(self):
        target = "services/pricing.py::apply_discount"

        self.assertIn(
            "services/checkout.py::create_checkout",
            get_dependents(self.graph, target),
        )

    def test_impact_traces_indirect_callers(self):
        changed_id = "services/pricing.py::apply_discount"

        affected = trace_impact(self.graph, changed_id)

        self.assertIn(
            "services/checkout.py::create_checkout",
            affected,
        )
        self.assertIn("main.py::main", affected)

    def test_graph_has_nodes_and_evidence(self):
        self.assertTrue(self.graph["nodes"])
        self.assertTrue(self.graph["edges"])

        for edge in self.graph["edges"]:
            self.assertTrue(edge["evidence"])
            self.assertIn("line", edge)
    
    def test_same_named_nested_functions_keep_unique_nodes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "example.py"

            source.write_text(
                "def helper():\n"
                "    return 1\n"
                "\n"
                "def outer():\n"
                "    def helper():\n"
                "        return 2\n"
                "    return helper()\n",
                encoding="utf-8",
            )

            graph = build_dependency_graph(str(root))

            helper_nodes = [
                node for node in graph["nodes"]
                if node["name"].split(".")[-1] == "helper"
            ]

            self.assertEqual(
                len(helper_nodes),
                2,
                "Both helper definitions should appear in the graph.",
            )

            helper_ids = {node["id"] for node in helper_nodes}

            self.assertEqual(
                len(helper_ids),
                2,
                "Different definitions must have unique node IDs.",
            )

    def test_resolves_imported_function_alias(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            services_dir = root / "services"
            services_dir.mkdir()

            (services_dir / "pricing.py").write_text(
                "def calculate_subtotal():\n"
                "    return 1\n",
                encoding="utf-8",
            )

            (services_dir / "checkout.py").write_text(
                "from services.pricing import "
                "calculate_subtotal as subtotal\n"
                "\n"
                "def checkout():\n"
                "    return subtotal()\n",
                encoding="utf-8",
            )

            graph = build_dependency_graph(str(root))

            checkout_id = "services/checkout.py::checkout"
            pricing_id = "services/pricing.py::calculate_subtotal"

            dependencies = get_dependencies(graph, checkout_id)

            self.assertIn(
                pricing_id,
                dependencies,
                "An imported alias should resolve to its original function.",
            )


    def test_ambiguous_same_named_functions_are_not_guessed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)

            (root / "first.py").write_text(
                "def helper():\n"
                "    return 1\n",
                encoding="utf-8",
            )

            (root / "second.py").write_text(
                "def helper():\n"
                "    return 2\n",
                encoding="utf-8",
            )

            (root / "caller.py").write_text(
                "def run():\n"
                "    return helper()\n",
                encoding="utf-8",
            )

            graph = build_dependency_graph(str(root))
            dependencies = get_dependencies(graph, "caller.py::run")

            self.assertEqual(
                dependencies,
                [],
                "An ambiguous call should not be linked to an arbitrary helper.",
            )


    def test_does_not_guess_object_method_from_name_alone(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)

            (root / "database.py").write_text(
                "class Database:\n"
                "    def save(self):\n"
                "        return True\n",
                encoding="utf-8",
            )

            (root / "cache.py").write_text(
                "class Cache:\n"
                "    def run(self, db):\n"
                "        return db.save()\n",
                encoding="utf-8",
            )

            graph = build_dependency_graph(str(root))
            dependencies = get_dependencies(graph, "cache.py::Cache.run")

            self.assertEqual(
                dependencies,
                [],
                "db.save() should not be linked to Database.save() "
                "without evidence that db is a Database instance.",
            )


if __name__ == "__main__":
    unittest.main()
