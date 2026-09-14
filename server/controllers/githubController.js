const githubService = require("../services/githubService");
const reviewService = require("../services/reviewService");
const { sendError, sendJson } = require("../utils/response");
const repositoryIndexService = require("../services/repositoryIndexService");
const reviewPersistenceService = require("../services/reviewPersistenceService");
const authService = require("../services/authService");
const fixService = require("../services/fixService");
const chatService = require("../services/chatService");

const reviewsInProgress = new Set();

async function getRequestGitHubToken(request) {
  return authService.getGitHubAccessToken(request.user.id);
}

async function getOptionalRequestGitHubToken(request) {
  try {
    return await getRequestGitHubToken(request);
  } catch (error) {
    if (error.status === 409) return null;
    throw error;
  }
}

async function usePublicFallback(accessToken, requestToGitHub) {
  try {
    return await requestToGitHub(accessToken);
  } catch (error) {
    // A revoked/expired saved credential must not block public repositories.
    // Retry only without the token; private repositories still remain private.
    if (accessToken && error.status === 401) {
      return requestToGitHub(null);
    }
    throw error;
  }
}

function getRepositoryParams(request, response) {
  const { owner, repo } = request.params;

  if (!owner || !repo) {
    sendError(response, 400, "Repository owner and name are required.");
    return null;
  }

  return { owner, repo };
}

function getPullNumber(request, response) {
  const pullNumber = Number(request.params.number);

  if (!Number.isInteger(pullNumber) || pullNumber < 1) {
    sendError(response, 400, "Pull request number must be a positive whole number.");
    return null;
  }

  return pullNumber;
}

async function getRepositories(request, response) {
  const accessToken = await getRequestGitHubToken(request);
  const repositories = await githubService.listRepositories(accessToken);
  return sendJson(response, 200, repositories);
}


async function getPullRequests(request, response) {
  const accessToken = await getOptionalRequestGitHubToken(request);
  const repository = getRepositoryParams(request, response);

  if (!repository) {
    return;
  }

  const pullRequests = await usePublicFallback(accessToken, (token) =>
    githubService.listPullRequests(token, repository.owner, repository.repo)
  );
  return sendJson(response, 200, pullRequests);
}

async function getPullRequestFiles(request, response) {
  const accessToken = await getOptionalRequestGitHubToken(request);
  const repository = getRepositoryParams(request, response);
  const pullNumber = getPullNumber(request, response);

  if (!repository || !pullNumber) {
    return;
  }

  const files = await usePublicFallback(accessToken, (token) =>
    githubService.getPullRequestFiles(token, repository.owner, repository.repo, pullNumber)
  );
  return sendJson(response, 200, files);
}

async function getPullRequestDiff(request, response) {
  const accessToken = await getOptionalRequestGitHubToken(request);
  const repository = getRepositoryParams(request, response);
  const pullNumber = getPullNumber(request, response);

  if (!repository || !pullNumber) {
    return;
  }

  const diff = await usePublicFallback(accessToken, (token) =>
    githubService.getPullRequestDiff(token, repository.owner, repository.repo, pullNumber)
  );
  return sendJson(response, 200, { diff });
}

async function createPullRequestReview(request, response) {
  const accessToken = await getOptionalRequestGitHubToken(request);
  const repository = getRepositoryParams(request, response);
  const pullNumber = getPullNumber(request, response);

  if (!repository || !pullNumber) {
    return;
  }

  const reviewKey = `${request.user.id}:${repository.owner}:${repository.repo}:${pullNumber}`;

  if (reviewsInProgress.has(reviewKey)) {
    return sendError(response, 409, "A review for this pull request is already being generated. Please wait.");
  }

  reviewsInProgress.add(reviewKey);
  const reviewStartedAt = Date.now();

  try {

  const [diff, pullRequest, repositoryDetails] = await usePublicFallback(
    accessToken,
    (token) => Promise.all([
      githubService.getPullRequestDiff(token, repository.owner, repository.repo, pullNumber),
      githubService.getPullRequestDetails(token, repository.owner, repository.repo, pullNumber),
      githubService.getRepositoryDetails(token, repository.owner, repository.repo),
    ])
  );

  let context = [];

  try {
    const retrievalQuery = reviewService.buildReviewRetrievalQuery(diff);
    context = await repositoryIndexService.searchRepositoryContext(
      repository.owner,
      repository.repo,
      retrievalQuery
    );
  } catch (error) {
    console.warn("RAG context was unavailable; continuing with a diff-only review.", error.message);
  }
  const generatedResult = await reviewService.reviewPullRequest({
    owner: repository.owner,
    repo: repository.repo,
    pullNumber,
    diff,
    context,
  });

  const savedReview = await reviewPersistenceService.saveReview({
    userId: request.user.id,
    repository: {
      owner: repository.owner,
      repo: repository.repo,
      githubId: repositoryDetails.id,
      defaultBranch: repositoryDetails.defaultBranch,
    },
    pullRequest,
    generatedReview: generatedResult.review,
    contextUsed: generatedResult.contextUsed,
  });

  console.log(`AI review generated for ${repository.owner}/${repository.repo}#${pullNumber} in ${Date.now() - reviewStartedAt}ms.`);

  return sendJson(response, 201, {
    repository: `${repository.owner}/${repository.repo}`,
    pullRequestNumber: pullNumber,
    review: savedReview,
    contextUsed: generatedResult.contextUsed,
  });

  } finally {
    reviewsInProgress.delete(reviewKey);
  }
}



async function indexRepository(request, response) {
  const accessToken = await getOptionalRequestGitHubToken(request);
  const repository = getRepositoryParams(request, response);

  if (!repository) {
    return;
  }

  const result = await repositoryIndexService.indexRepository(accessToken,repository.owner, repository.repo);
  return sendJson(response, 201, result);
}

async function getRepositoryContext(request, response) {
  const repository = getRepositoryParams(request, response);
  const query = request.query.q;

  if (!repository) {
    return;
  }

  if (typeof query !== "string" || !query.trim()) {
    return sendError(response, 400, "Query parameter q is required.");
  }

  const context = await repositoryIndexService.searchRepositoryContext(
    repository.owner,
    repository.repo,
    query.trim()
  );

  return sendJson(response, 200, { context });
}
async function getPullRequestReviewHistory(request, response) {
  const repository = getRepositoryParams(request, response);
  const pullNumber = getPullNumber(request, response);

  if (!repository || !pullNumber) {
    return;
  }

  const reviews = await reviewPersistenceService.getPullRequestReviews(
    request.user.id,
    repository.owner,
    repository.repo,
    pullNumber
  );

  return sendJson(response, 200, { reviews });
}

async function getSavedReview(request, response) {
  const review = await reviewPersistenceService.getReviewById(
    request.user.id,
    request.params.reviewId
  );

  if (!review) {
    return sendError(response, 404, "Saved review not found.");
  }

  return sendJson(response, 200, { review });
}
async function getRecentSavedReviews(request, response) {
  const reviews = await reviewPersistenceService.getRecentSavedReviews(request.user.id);
  return sendJson(response, 200, { reviews });
}
async function getReviewAnalytics(request, response) {
  const analytics = await reviewPersistenceService.getReviewAnalytics(request.user.id);
  return sendJson(response, 200, analytics);
}

async function generateFindingFix(request, response) {
  const { findingDescription, suggestion, filePath, line, codeContext } = request.body;

  const fix = await fixService.generateFix({
    findingDescription,
    suggestion,
    filePath,
    line,
    codeContext,
  });

  return sendJson(response, 200, { fix });
}

async function chatAboutFinding(request, response) {
  const { findingDescription, suggestion, filePath, codeContext, messages } = request.body;

  const result = await chatService.chat({
    findingDescription,
    suggestion,
    filePath,
    codeContext,
    messages,
  });

  return sendJson(response, 200, { reply: result.reply });
}

module.exports = {
  getRepositories,
  getPullRequests,
  getPullRequestFiles,
  getPullRequestDiff,
  createPullRequestReview,
  indexRepository,
  getRepositoryContext,
  getPullRequestReviewHistory,
  getSavedReview,
  getRecentSavedReviews,
  getReviewAnalytics,
  generateFindingFix,
  chatAboutFinding,
  getRequestGitHubToken,
  getOptionalRequestGitHubToken,
  usePublicFallback,
};
