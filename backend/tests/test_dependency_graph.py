
import unittest

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


if __name__ == "__main__":
    unittest.main()
