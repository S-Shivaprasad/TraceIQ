
# TraceIQ — Code Dependency & Impact Analyzer

TraceIQ is a static code analysis prototype that helps developers understand function-level dependencies in Python repositories and explore the potential impact of code changes.

Paste a public GitHub repository URL to analyze its Python source code and visualize detected function relationships through an interactive dependency graph.

## Features

- Import public GitHub repositories.
- Detect programming languages present in a repository.
- Analyze Python source files using Python AST.
- Extract function definitions and function-call relationships.
- Visualize dependencies with an interactive graph.
- Search for functions and explore direct connections.
- Trace potential upstream impact when a function changes.
- Inspect function details, source files, and line numbers.
- Validate repository URLs and handle download and archive errors.

## Technology Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- React Flow

**Backend**
- Python
- FastAPI
- Python AST
- Pydantic

## Project Structure

```text
TraceIQ/
├── backend/
│   ├── analyzer/
│   ├── tests/
│   └── api.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── sample_repo/
├── requirements.txt
└── README.md
```

## Requirements

- Python 3.10 or later
- Node.js and npm

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/S-Shivaprasad/TraceIQ.git
cd TraceIQ
```

### 2. Install backend dependencies

```bash
py -m pip install -r requirements.txt
```

### 3. Start the backend

```bash
py -m uvicorn backend.api:app --reload
```

Backend API: http://127.0.0.1:8000

Health endpoint: http://127.0.0.1:8000/api/health

### 4. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

http://localhost:5173

## Run Backend Tests

From the project root:

```bash
py -m unittest discover -s backend/tests -t . -v
```

## Build Frontend

```bash
cd frontend
npm run build
```

## Current Scope and Limitations

- Python is currently the only language analyzed for function-level dependencies.
- Other programming languages may be detected but are not analyzed.
- Dependency relationships are based on static analysis, not runtime execution.
- Dynamic calls, reflection, and complex runtime behavior may not be fully resolved.
- Impact paths indicate potential dependencies and should be reviewed by developers.
- Repository import currently supports public GitHub repositories.

## Project Purpose

TraceIQ aims to make code relationships easier to understand, helping developers navigate unfamiliar codebases and identify functions that may be affected by changes.

---

**TraceIQ — Explore Dependencies. Understand Impact.**
