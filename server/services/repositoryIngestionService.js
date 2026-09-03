const prisma = require("../lib/prisma");
const authService = require("./authService");
const githubService = require("./githubService");
const { inngest } = require("../inngest/client");
const { deleteNamespaceVectors } = require("./pineconeService");
const { getRepositoryNamespace } = require("./repositoryIndexService");

async function getRepositoryForIngestion(userId, owner, repo) {
  let accessToken = null;

  // Prefer the current user's own GitHub credential when it exists. This gives
  // that person their normal GitHub rate limit and can also read private repos.
  try {
    accessToken = await authService.getGitHubAccessToken(userId);
  } catch (error) {
    if (error.status !== 409) throw error;
  }

  if (accessToken) {
    try {
      const details = await githubService.getRepositoryDetails(accessToken, owner, repo);
      return { details, sourceType: "CONNECTED_GITHUB" };
    } catch (error) {
      // Try anonymous access once too: a fine-grained token can be restricted
      // even though the requested repository is public.
      if (error.status !== 403 && error.status !== 404) throw error;
    }
  }

  try {
    const details = await githubService.getPublicRepositoryDetails(owner, repo);
    return { details, sourceType: "PUBLIC_URL" };
  } catch (error) {
    if (error.status === 404) {
      const notFoundError = new Error(
        `Repository ${owner}/${repo} was not found or your GitHub account cannot access it.`
      );
      notFoundError.status = 404;
      throw notFoundError;
    }

    if (error.status === 403 && !accessToken) {
      const connectionError = new Error(
        "GitHub temporarily limited anonymous public lookups. Connect GitHub, then try again."
      );
      connectionError.status = 409;
      throw connectionError;
    }

    throw error;
  }
}

async function addAndQueueRepository({ userId, owner, repo }) {
  const { details, sourceType } = await getRepositoryForIngestion(userId, owner, repo);

  
  const repository = await prisma.repository.upsert({
    where: { userId_owner_name: { userId, owner, name: repo } },
    create: {
      userId, owner, name: repo, fullName: `${owner}/${repo}`,
      githubId: String(details.id), defaultBranch: details.defaultBranch,
      sourceType, indexStatus: "QUEUED", indexError: null, isArchived: false,
    },
    update: {
      githubId: String(details.id), defaultBranch: details.defaultBranch,
      sourceType, indexStatus: "QUEUED", indexError: null, isArchived: false,
    },
  });

  await inngest.send({
    name: "repository/index.requested",
    data: { repositoryId: repository.id, userId },
  });
  return repository;
}

async function listAddedRepositories(userId) {
  return prisma.repository.findMany({
    where: { userId, isArchived: false }, orderBy: { updatedAt: "desc" },
  });
}

async function removeAddedRepository({ userId, repositoryId }) {
  const repository = await prisma.repository.findFirst({
    where: { id: repositoryId, userId },
  });

  if (!repository) {
    const error = new Error("Added repository not found.");
    error.status = 404;
    throw error;
  }

  const otherOwners = await prisma.repository.count({
    where: {
      owner: repository.owner,
      name: repository.name,
      id: { not: repository.id },
    },
  });

  // Hide the repository without deleting its pull requests, reviews, or
  // findings. Dashboard analytics must remain available after removal.
  await prisma.repository.update({
    where: { id: repository.id },
    data: { isArchived: true, indexStatus: "NOT_INDEXED", indexError: null },
  });

  // The current beginner namespace format is shared by owner/repo. Do not
  // erase vectors if another ReviewFlow user still has this repository added.
  if (otherOwners === 0) {
    try {
      await deleteNamespaceVectors(getRepositoryNamespace(repository.owner, repository.name));
    } catch (error) {
      // The repository is already removed from this user's workspace. A stale
      // vector namespace is safe and will be replaced if it is added again.
      console.warn(`Could not clean Pinecone vectors for ${repository.fullName}:`, error.message);
    }
  }

  return repository;
}

module.exports = { addAndQueueRepository, listAddedRepositories, removeAddedRepository };
