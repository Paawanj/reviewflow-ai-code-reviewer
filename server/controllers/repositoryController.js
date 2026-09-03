const repositoryIngestionService = require("../services/repositoryIngestionService");
const prisma = require("../lib/prisma");
const { inngest } = require("../inngest/client");
const { sendError, sendJson } = require("../utils/response");

async function list(request, response) {
  const repositories = await repositoryIngestionService.listAddedRepositories(request.user.id);
  return sendJson(response, 200, { repositories });
}

async function add(request, response) {
  const repository = await repositoryIngestionService.addAndQueueRepository({
    userId: request.user.id,
    owner: request.body.owner,
    repo: request.body.repo,
  });

  return sendJson(response, 202, { repository });
}

async function reindex(request, response) {
  const repository = await prisma.repository.findFirst({
    where: { id: request.params.id, userId: request.user.id },
  });

  if (!repository) return sendError(response, 404, "Added repository not found.");

  const queuedRepository = await prisma.repository.update({
    where: { id: repository.id },
    data: { indexStatus: "QUEUED", indexError: null },
  });

  await inngest.send({
    name: "repository/index.requested",
    data: { repositoryId: repository.id, userId: request.user.id },
  });

  return sendJson(response, 202, { repository: queuedRepository });
}

async function remove(request, response) {
  await repositoryIngestionService.removeAddedRepository({
    userId: request.user.id,
    repositoryId: request.params.id,
  });

  return response.status(204).send();
}

module.exports = { add, list, reindex, remove };
