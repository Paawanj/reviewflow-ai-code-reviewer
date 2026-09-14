import api from "@/lib/api";

export async function getRepositories() {
  const response = await api.get("/github/repos");
  return response.data;
}

export async function getPullRequests(owner, repo) {
  const response = await api.get(`/github/repos/${owner}/${repo}/pulls`);
  return response.data;
}

export async function getPullRequestFiles(owner, repo, pullNumber) {
  const response = await api.get(`/github/repos/${owner}/${repo}/pulls/${pullNumber}/files`);
  return response.data;
}

export async function createPullRequestReview(owner, repo, pullNumber) {
  const response = await api.post(`/github/repos/${owner}/${repo}/pulls/${pullNumber}/review`);
  return response.data;
}

export async function getPullRequestReviewHistory(owner, repo, pullNumber) {
  const response = await api.get(`/github/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`);
  return response.data.reviews;
}

export async function getRecentSavedReviews() {
  const response = await api.get("/github/reviews");
  return response.data.reviews;
}
export async function getReviewAnalytics() {
  const response = await api.get("/github/analytics/reviews");
  return response.data;
}

export async function getAddedRepositories() {
  const response = await api.get("/repositories");
  return response.data.repositories;
}

export async function addRepository(values) {
  const response = await api.post("/repositories", values);
  return response.data.repository;
}

export async function reindexRepository(repositoryId) {
  const response = await api.post(`/repositories/${repositoryId}/reindex`);
  return response.data.repository;
}

export async function deleteAddedRepository(repositoryId) {
  await api.delete(`/repositories/${repositoryId}`);
}

export async function getPullRequestDiff(owner, repo, pullNumber) {
  const response = await api.get(`/github/repos/${owner}/${repo}/pulls/${pullNumber}/diff`);
  return response.data.diff;
}

export async function generateFindingFix({ findingDescription, suggestion, filePath, line, codeContext }) {
  const response = await api.post("/github/fix", {
    findingDescription,
    suggestion,
    filePath,
    line,
    codeContext,
  });
  return response.data.fix;
}

export async function chatAboutFinding({ findingDescription, suggestion, filePath, codeContext, messages }) {
  const response = await api.post("/github/chat", {
    findingDescription,
    suggestion,
    filePath,
    codeContext,
    messages,
  });
  return response.data.reply;
}
