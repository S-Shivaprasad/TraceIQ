
import io
import re
import tempfile
import zipfile
from pathlib import PurePosixPath
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.analyzer.dependency_graph import build_dependency_graph


app = FastAPI(title="TraceIQ API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

MAX_ARCHIVE_BYTES = 15 * 1024 * 1024
MAX_PYTHON_FILES = 150
MAX_SOURCE_BYTES = 2 * 1024 * 1024


LANGUAGE_EXTENSIONS = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".java": "Java",
    ".go": "Go",
    ".rs": "Rust",
    ".c": "C",
    ".h": "C/C++",
    ".cpp": "C++",
    ".cc": "C++",
    ".hpp": "C++",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    ".html": "HTML",
    ".css": "CSS",
    ".sql": "SQL",
}


def detect_languages(archive_data: bytes) -> list[str]:
    """Detect languages by file extension; this does not analyze them."""
    try:
        with zipfile.ZipFile(io.BytesIO(archive_data)) as archive:
            languages = set()

            for item in archive.infolist():
                if item.is_dir():
                    continue

                suffix = PurePosixPath(item.filename).suffix.lower()
                language = LANGUAGE_EXTENSIONS.get(suffix)

                if language:
                    languages.add(language)

            return sorted(languages)

    except zipfile.BadZipFile as exc:
        raise HTTPException(
            status_code=502,
            detail="GitHub returned an invalid repository archive.",
        ) from exc

class AnalyzeRequest(BaseModel):
    repo_url: str = Field(min_length=1, max_length=300)


def parse_github_url(repo_url: str) -> tuple[str, str]:
    match = re.fullmatch(
        r"https?://github\.com/([A-Za-z0-9_.-]+)/"
        r"([A-Za-z0-9_.-]+?)(?:\.git)?/?",
        repo_url.strip(),
    )

    if not match:
        raise HTTPException(
            status_code=400,
            detail="Enter a public GitHub repository URL, "
                   "such as https://github.com/psf/requests",
        )

    owner, repo = match.groups()

    if owner in {".", ".."} or repo in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid repository URL.")

    return owner, repo


def download_archive(owner: str, repo: str) -> bytes:
    url = f"https://api.github.com/repos/{owner}/{repo}/zipball"

    request = Request(
        url,
        headers={
            "User-Agent": "TraceIQ-Repository-Analyzer",
            "Accept": "application/vnd.github+json",
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            data = response.read(MAX_ARCHIVE_BYTES + 1)

    except HTTPError as exc:
        if exc.code == 404:
            raise HTTPException(
                status_code=404,
                detail="Repository not found or not publicly accessible.",
            ) from exc

        if exc.code == 403:
            raise HTTPException(
                status_code=429,
                detail="GitHub rate limit or access restriction. Try again later.",
            ) from exc

        raise HTTPException(
            status_code=502,
            detail=f"GitHub returned HTTP {exc.code}.",
        ) from exc

    except (URLError, TimeoutError, OSError) as exc:
        print(
            f"TraceIQ GitHub download error: "
            f"{type(exc).__name__}: {exc!r}"
        )
        raise HTTPException(
            status_code=502,
            detail="Could not reach GitHub. Check your connection and try again.",
        ) from exc


    if len(data) > MAX_ARCHIVE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Repository archive exceeds the 15 MB download limit.",
        )

    return data


def extract_python_files(archive_data: bytes, destination: Path) -> int:
    try:
        archive = zipfile.ZipFile(io.BytesIO(archive_data))
    except zipfile.BadZipFile as exc:
        raise HTTPException(
            status_code=502,
            detail="GitHub returned an invalid repository archive.",
        ) from exc

    file_count = 0
    total_source_bytes = 0

    with archive:
        for item in archive.infolist():
            if item.is_dir():
                continue

            # GitHub archives have a leading directory for the repository.
            parts = PurePosixPath(item.filename).parts

            if len(parts) < 2 or ".." in parts or "\\" in item.filename:
                continue

            relative_parts = parts[1:]
            relative_path = PurePosixPath(*relative_parts)

            if relative_path.is_absolute():
                continue

            if relative_path.suffix.lower() != ".py":
                continue

            # Ignore symbolic links and other non-regular archive entries.
            unix_mode = item.external_attr >> 16
            if unix_mode and (unix_mode & 0o170000) == 0o120000:
                continue

            file_count += 1
            if file_count > MAX_PYTHON_FILES:
                raise HTTPException(
                    status_code=413,
                    detail="Repository has too many Python files "
                           f"(limit: {MAX_PYTHON_FILES}).",
                )

            if item.file_size > MAX_SOURCE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail="A Python source file exceeds the size limit.",
                )

            total_source_bytes += item.file_size
            if total_source_bytes > MAX_SOURCE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail="Total Python source exceeds the 2 MB limit.",
                )

            content = archive.read(item)
            output_path = destination.joinpath(*relative_path.parts)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(content)

    if file_count == 0:
        raise HTTPException(
            status_code=422,
            detail="No Python source files were found in this repository.",
        )

    return file_count


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "TraceIQ API"}


@app.post("/api/analyze")
def analyze_repository(request: AnalyzeRequest):
    owner, repo = parse_github_url(request.repo_url)
    archive_data = download_archive(owner, repo)
    detected_languages = detect_languages(archive_data)

    with tempfile.TemporaryDirectory(prefix="traceiq-") as temp_dir:
        source_root = Path(temp_dir)
        file_count = extract_python_files(archive_data, source_root)

        try:
            graph = build_dependency_graph(str(source_root))
        except Exception as exc:
            # Log the details in the server terminal, not in the API response.
            print(f"TraceIQ analyzer error: {type(exc).__name__}: {exc}")
            raise HTTPException(
                status_code=500,
                detail="Repository was downloaded, but analysis failed.",
            ) from exc

    unsupported_languages = [
    language
    for language in detected_languages
    if language != "Python"
    ]

    warnings = []

    if unsupported_languages:
        warnings.append(
            "Detected additional languages, but only Python is analyzed: "
             + ", ".join(unsupported_languages)
             + "."
             )
    return {
        "repository": f"{owner}/{repo}",
        "language": "Python",
        "python_files": file_count,
        "graph": graph,
        "detected_languages": detected_languages,
        "analyzed_languages": ["Python"],
        "warnings": warnings,
        "note": (
            "Relationships are static-analysis estimates. "
            "They do not prove runtime behavior or the presence of defects."
        ),
}
