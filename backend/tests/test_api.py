import unittest

from fastapi import HTTPException

from backend.api import (
    app,
    detect_languages,
    download_archive,
    extract_python_files,
    parse_github_url,
)
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.api import app
import io
import tempfile
import zipfile
from pathlib import Path
from unittest.mock import patch

from backend.api import extract_python_files

class TestGitHubURLValidation(unittest.TestCase):
    def test_accepts_standard_github_url(self):
        self.assertEqual(
            parse_github_url("https://github.com/psf/requests"),
            ("psf", "requests"),
        )

    def test_accepts_git_suffix_and_trailing_slash(self):
        self.assertEqual(
            parse_github_url("https://github.com/psf/requests.git/"),
            ("psf", "requests"),
        )

    def test_trims_surrounding_whitespace(self):
        self.assertEqual(
            parse_github_url("  https://github.com/psf/requests  "),
            ("psf", "requests"),
        )

    def test_rejects_non_github_host(self):
        with self.assertRaises(HTTPException) as context:
            parse_github_url("https://example.com/psf/requests")

        self.assertEqual(context.exception.status_code, 400)

    def test_rejects_missing_repository(self):
        with self.assertRaises(HTTPException) as context:
            parse_github_url("https://github.com/psf/")

        self.assertEqual(context.exception.status_code, 400)

    def test_rejects_query_string(self):
        with self.assertRaises(HTTPException) as context:
            parse_github_url(
                "https://github.com/psf/requests?tab=readme"
            )

        self.assertEqual(context.exception.status_code, 400)

    def test_rejects_url_with_embedded_credentials(self):
        with self.assertRaises(HTTPException) as context:
            parse_github_url(
                "https://user:password@github.com/psf/requests"
            )

        self.assertEqual(context.exception.status_code, 400)

class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)


    @patch("backend.api.build_dependency_graph")
    @patch("backend.api.download_archive")
    def test_response_reports_detected_and_analyzed_languages(
        self, mock_download, mock_graph
    ):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as archive:
            archive.writestr("repo/main.py", "def main():\n    pass\n")
            archive.writestr("repo/app.js", "function app() {}")

        mock_download.return_value = buffer.getvalue()
        mock_graph.return_value = {
            "nodes": [],
            "edges": [],
        }

        response = self.client.post(
            "/api/analyze",
            json={"repo_url": "https://github.com/example/repo"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["repository"], "example/repo")
        self.assertEqual(data["language"], "Python")
        self.assertEqual(data["python_files"], 1)
        self.assertEqual(
            data["detected_languages"],
            ["JavaScript", "Python"],
        )
        self.assertEqual(data["analyzed_languages"], ["Python"])
        self.assertTrue(
            any("JavaScript" in warning for warning in data["warnings"])
        )


    def test_health_endpoint_returns_ok(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "service": "TraceIQ API"},
        )

    def test_invalid_repository_url_returns_400(self):
        response = self.client.post(
            "/api/analyze",
            json={"repo_url": "https://example.com/user/repo"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())

    def test_missing_repository_url_returns_validation_error(self):
        response = self.client.post("/api/analyze", json={})

        self.assertEqual(response.status_code, 422)

    @patch("backend.api.download_archive")
    def test_github_download_error_is_returned_safely(self, mock_download):
        from fastapi import HTTPException

        mock_download.side_effect = HTTPException(
            status_code=404,
            detail="Repository not found or not publicly accessible.",
        )

        response = self.client.post(
            "/api/analyze",
            json={"repo_url": "https://github.com/example/nonexistent"},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json()["detail"],
            "Repository not found or not publicly accessible.",
        )


class TestArchiveExtraction(unittest.TestCase):
    def make_zip(self, files):
        """Build a small in-memory ZIP with a GitHub-style root folder."""
        buffer = io.BytesIO()

        with zipfile.ZipFile(buffer, "w") as archive:
            for name, content in files.items():
                archive.writestr(f"repo/{name}", content)

        return buffer.getvalue()

    def test_rejects_invalid_zip(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(HTTPException) as context:
                extract_python_files(b"not a zip file", Path(temp_dir))

        self.assertEqual(context.exception.status_code, 502)

    def test_rejects_archive_without_python_files(self):
        archive_data = self.make_zip({"README.md": "Hello"})

        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(HTTPException) as context:
                extract_python_files(archive_data, Path(temp_dir))

        self.assertEqual(context.exception.status_code, 422)

    def test_rejects_too_many_python_files(self):
        archive_data = self.make_zip({
            "one.py": "a = 1",
            "two.py": "b = 2",
            "three.py": "c = 3",
        })

        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.api.MAX_PYTHON_FILES", 2):
                with self.assertRaises(HTTPException) as context:
                    extract_python_files(archive_data, Path(temp_dir))

        self.assertEqual(context.exception.status_code, 413)

    def test_rejects_oversized_python_file(self):
        archive_data = self.make_zip({"large.py": "123456"})

        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.api.MAX_SOURCE_BYTES", 5):
                with self.assertRaises(HTTPException) as context:
                    extract_python_files(archive_data, Path(temp_dir))

        self.assertEqual(context.exception.status_code, 413)

    def test_rejects_total_source_size_over_limit(self):
        archive_data = self.make_zip({
            "one.py": "123",
            "two.py": "456",
        })

        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("backend.api.MAX_SOURCE_BYTES", 5):
                with self.assertRaises(HTTPException) as context:
                    extract_python_files(archive_data, Path(temp_dir))

        self.assertEqual(context.exception.status_code, 413)

    def test_extracts_valid_python_file(self):
        archive_data = self.make_zip({"src/main.py": "print('hello')"})

        with tempfile.TemporaryDirectory() as temp_dir:
            count = extract_python_files(archive_data, Path(temp_dir))
            extracted = Path(temp_dir) / "src" / "main.py"

            self.assertEqual(count, 1)
            self.assertTrue(extracted.exists())
            self.assertEqual(extracted.read_text(encoding="utf-8"), "print('hello')")

class TestArchiveDownload(unittest.TestCase):
    @patch("backend.api.urlopen")
    def test_rejects_archive_over_download_limit(self, mock_urlopen):
        response = mock_urlopen.return_value.__enter__.return_value
        response.read.return_value = b"x" * 6

        with patch("backend.api.MAX_ARCHIVE_BYTES", 5):
            with self.assertRaises(HTTPException) as context:
                from backend.api import download_archive
                download_archive("example", "repo")

        self.assertEqual(context.exception.status_code, 413)
        response.read.assert_called_once_with(6)

    @patch("backend.api.urlopen")
    def test_accepts_archive_within_download_limit(self, mock_urlopen):
        response = mock_urlopen.return_value.__enter__.return_value
        response.read.return_value = b"zip!"

        with patch("backend.api.MAX_ARCHIVE_BYTES", 5):
            from backend.api import download_archive
            result = download_archive("example", "repo")

        self.assertEqual(result, b"zip!")
        response.read.assert_called_once_with(6)

class TestLanguageDetection(unittest.TestCase):
    def make_zip(self, filenames):
        buffer = io.BytesIO()

        with zipfile.ZipFile(buffer, "w") as archive:
            for filename in filenames:
                archive.writestr(f"repo/{filename}", "")

        return buffer.getvalue()

    def test_detects_multiple_languages(self):
        archive_data = self.make_zip([
            "main.py",
            "app.js",
            "component.tsx",
            "README.md",
        ])

        self.assertEqual(
            detect_languages(archive_data),
            ["JavaScript", "Python", "TypeScript"],
        )

    def test_ignores_unknown_extensions(self):
        archive_data = self.make_zip(["main.py", "README.md"])

        self.assertEqual(detect_languages(archive_data), ["Python"])

    def test_rejects_invalid_zip(self):
        with self.assertRaises(HTTPException) as context:
            detect_languages(b"not a zip")

        self.assertEqual(context.exception.status_code, 502)


if __name__ == "__main__":
    unittest.main()
