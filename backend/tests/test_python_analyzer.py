
import unittest

from backend.analyzer.python_analyzer import analyze_python_file


class TestPythonAnalyzer(unittest.TestCase):
    def test_extracts_pricing_functions(self):
        result = analyze_python_file(
            "sample_repo/services/pricing.py"
        )

        names = [function["name"] for function in result["functions"]]

        self.assertEqual(
            names,
            ["calculate_subtotal", "apply_discount"],
        )
        self.assertEqual(result["classes"], [])
        self.assertEqual(result["imports"], [])
        self.assertEqual(result["calls"], [])

    def test_extracts_checkout_imports_and_calls(self):
        result = analyze_python_file(
            "sample_repo/services/checkout.py"
        )

        self.assertEqual(
            [function["name"] for function in result["functions"]],
            ["create_checkout"],
        )

        self.assertEqual(
            result["imports"][0]["module"],
            "services.pricing",
        )
        self.assertEqual(
            result["imports"][0]["names"],
            ["calculate_subtotal", "apply_discount"],
        )

        call_names = [call["name"] for call in result["calls"]]
        self.assertIn("calculate_subtotal", call_names)
        self.assertIn("apply_discount", call_names)

    def test_extracts_main_checkout_dependency(self):
        result = analyze_python_file("sample_repo/main.py")

        self.assertEqual(
            result["imports"][0]["module"],
            "services.checkout",
        )
        self.assertIn(
            "create_checkout",
            [call["name"] for call in result["calls"]],
        )

    
    def test_calls_include_their_enclosing_function(self):
        result = analyze_python_file(
            "sample_repo/services/checkout.py"
        )

        calls = {
            call["name"]: call
            for call in result["calls"]
        }

        self.assertEqual(
            calls["calculate_subtotal"]["enclosing_function"],
            "create_checkout",
        )
        self.assertEqual(
            calls["apply_discount"]["enclosing_function"],
            "create_checkout",
        )
        self.assertIsNone(
            calls["calculate_subtotal"]["enclosing_class"]
        )

    def test_reports_syntax_errors(self):
        result = analyze_python_file(
            "sample_repo/tests/test_checkout.py"
        )

        self.assertNotIn("error", result)

    def test_returns_error_for_invalid_python(self):
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as temp_dir:
            bad_file = Path(temp_dir) / "invalid.py"
            bad_file.write_text("def broken(:\n", encoding="utf-8")

            result = analyze_python_file(str(bad_file))

        self.assertIn("error", result)
        self.assertEqual(result["functions"], [])


if __name__ == "__main__":
    unittest.main()

