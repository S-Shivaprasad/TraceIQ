
const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeRepository(repoUrl) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ repo_url: repoUrl }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.detail ?? `Analysis failed with status ${response.status}.`
    );
  }

  return result;
}
