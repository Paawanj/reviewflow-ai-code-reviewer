
const ALLOWED_FILE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".md"]);
const IGNORED_PATH_PARTS = new Set(["node_modules", "dist", "build", ".git", "coverage"]);
const MAX_SOURCE_FILES = 40;
const MAX_FILE_SIZE_BYTES = 100000;
const SOURCE_FILE_CONCURRENCY = 5;

async function getOctokit(accessToken) {
  const { Octokit } = await import("@octokit/rest");

  if (accessToken) {
    return new Octokit({
      auth: accessToken,
    });
  }

  return new Octokit();
}

async function listRepositories(accessToken) {
  const octokit = await getOctokit(accessToken);
  const response = await octokit.rest.repos.listForAuthenticatedUser({
    affiliation: "owner,collaborator,organization_member",
    sort: "updated",
    per_page: 100,
  });

  return response.data.map((repository) => ({
    id: repository.id,
    owner: repository.owner.login,
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    isPrivate: repository.private,
    defaultBranch: repository.default_branch,
    updatedAt: repository.updated_at,
    htmlUrl: repository.html_url,
  }));
}

async function listPullRequests(accessToken,owner, repo) {
  const octokit = await getOctokit(accessToken);
  const response = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 100,
  });

  return response.data.map((pullRequest) => ({
    id: pullRequest.id,
    number: pullRequest.number,
    title: pullRequest.title,
    state: pullRequest.state,
    isDraft: pullRequest.draft,
    author: pullRequest.user?.login ?? "Unknown",
    createdAt: pullRequest.created_at,
    updatedAt: pullRequest.updated_at,
    htmlUrl: pullRequest.html_url,
  }));
}

async function getPullRequestFiles(accessToken,owner, repo, pullNumber) {
  const octokit = await getOctokit(accessToken);
  const response = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  return response.data.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch ?? null,
  }));
}

async function getPullRequestDiff(accessToken,owner, repo, pullNumber) {
  const octokit = await getOctokit(accessToken);
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: {
        format: "diff",
      },
    }
  );

  return response.data;
}
function isAllowedSourceFile(file) {
  if (file.type !== "blob" || !file.path || !file.size || file.size > MAX_FILE_SIZE_BYTES) {
    return false;
  }

  const pathParts = file.path.split("/");
  const hasIgnoredPart = pathParts.some((part) => IGNORED_PATH_PARTS.has(part));
  const extension = file.path.slice(file.path.lastIndexOf(".")).toLowerCase();

  return !hasIgnoredPart && ALLOWED_FILE_EXTENSIONS.has(extension);
}

async function getRepositorySourceFiles(accessToken, owner, repo) {
  const octokit = await getOctokit(accessToken);

  const repositoryResponse = await octokit.rest.repos.get({
    owner,
    repo,
  });

  const branch = repositoryResponse.data.default_branch;

  const treeResponse = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "1",
  });

  if (treeResponse.data.truncated) {
    const error = new Error(
      "Repository tree is too large for this first indexing version."
    );
    error.status = 400;
    throw error;
  }

  const sourceEntries = treeResponse.data.tree
    .filter(isAllowedSourceFile)
    .slice(0, MAX_SOURCE_FILES);

  const files = [];
  let nextEntryIndex = 0;

  // Fetching every file serially made a 40-file private repository look stuck
  // for a long time. A small worker pool is much faster while remaining well
  // below GitHub's normal API rate limit.
  async function fetchSourceWorker() {
    while (nextEntryIndex < sourceEntries.length) {
      const entry = sourceEntries[nextEntryIndex];
      nextEntryIndex += 1;
      const contentResponse = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: entry.path,
        ref: branch,
      });

      const file = contentResponse.data;
      if (Array.isArray(file) || file.encoding !== "base64" || !file.content) {
        continue;
      }

      files.push({
        path: entry.path,
        content: Buffer.from(file.content, "base64").toString("utf8"),
      });
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(SOURCE_FILE_CONCURRENCY, sourceEntries.length) },
      fetchSourceWorker
    )
  );

  return {
    branch,
    files,
  };
}

async function getPullRequestDetails(accessToken,owner, repo, pullNumber) {
  const octokit = await getOctokit(accessToken);
  const response = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const pullRequest = response.data;

  return {
    number: pullRequest.number,
    title: pullRequest.title,
    state: pullRequest.state,
    author: pullRequest.user?.login ?? null,
  };
}
async function getRepositoryDetails(accessToken,owner, repo) {
  const octokit = await getOctokit(accessToken);
  const response = await octokit.rest.repos.get({ owner, repo });

  return {
    id: response.data.id,
    defaultBranch: response.data.default_branch,
  };
}
async function getPublicRepositoryDetails(owner, repo) {
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit();
  const response = await octokit.rest.repos.get({ owner, repo });
  return {
    id: response.data.id,
    defaultBranch: response.data.default_branch,
    isPrivate: response.data.private,
  };
}

module.exports = {
  listRepositories,
  listPullRequests,
  getPullRequestFiles,
  getPullRequestDiff,
  getRepositorySourceFiles,
  getPullRequestDetails,
  getRepositoryDetails,
getPublicRepositoryDetails,
};
