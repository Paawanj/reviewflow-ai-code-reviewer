const prisma = require("../lib/prisma");
const authService = require("../services/authService");
const repositoryIndexService = require("../services/repositoryIndexService");
const { inngest } = require("./client");

function getSafeIndexingMessage(error) {
  const rawMessage = String(error?.message || "");
  const errorDetails = [
    error?.status,
    error?.code,
    rawMessage,
    error?.response?.status,
    error?.response?.data?.error?.status,
  ].join(" ");

  if (/(^|\D)429(\D|$)|resource_exhausted|rate.?limit|quota/i.test(errorDetails)) {
    return "Gemini's embedding quota is temporarily unavailable. Wait for the quota to reset or use an API key with available quota, then add this repository again.";
  }

  return rawMessage
    .replace(/AIza[\w-]{20,}/g, "[redacted]")
    .slice(0, 240) || "Indexing failed. Check the Inngest dashboard and try again.";
}

const indexRepository = inngest.createFunction(
  {
    id: "index-repository",
    retries: 2,
    concurrency: [{ limit: 1, key: "event.data.repositoryId" }],
    triggers: { event: "repository/index.requested" },
  },
  async ({ event, step }) => {
    const repository = await step.run("load-repository", () =>
      prisma.repository.findFirst({
        where: { id: event.data.repositoryId, userId: event.data.userId },
      })
    );

    if (!repository) return { skipped: true };

    await step.run("mark-indexing", () =>
      prisma.repository.update({
        where: { id: repository.id },
        data: { indexStatus: "INDEXING", indexError: null },
      })
    );

    try {
      // A connected user may add a public repository too. Use only that same
      // user's credential when available; it avoids anonymous GitHub rate
      // limits without ever sharing another user's token.
      let accessToken = null;
      try {
        accessToken = await authService.getGitHubAccessToken(repository.userId);
      } catch (error) {
        if (error.status !== 409) throw error;
      }

      const result = await step.run("index-source-code", () =>
        repositoryIndexService.indexRepository(
          accessToken,
          repository.owner,
          repository.name
        )
      );

      await step.run("mark-ready", () =>
        prisma.repository.update({
          where: { id: repository.id },
          data: { indexStatus: "READY", lastIndexedAt: new Date(), indexError: null },
        })
      );

      return result;
    } catch (error) {
      const safeMessage = getSafeIndexingMessage(error);

      await prisma.repository.update({
        where: { id: repository.id },
        data: {
          indexStatus: "FAILED",
          indexError: safeMessage,
        },
      });
      throw error;
    }
  }
);

module.exports = { functions: [indexRepository] };
