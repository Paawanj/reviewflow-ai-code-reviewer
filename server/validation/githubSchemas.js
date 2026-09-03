const { z } = require("zod");

const ownerSchema = z
  .string()
  .trim()
  .min(1, "Repository owner is required.")
  .max(39, "Repository owner is too long.")
  .regex(/^[A-Za-z0-9-]+$/, "Repository owner may use letters, numbers, and hyphens only.");

const repoSchema = z
  .string()
  .trim()
  .min(1, "Repository name is required.")
  .max(100, "Repository name is too long.")
  .regex(/^[A-Za-z0-9._-]+$/, "Repository name contains unsupported characters.");

const repositoryParamsSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
});

const pullRequestParamsSchema = repositoryParamsSchema.extend({
  number: z.string().regex(/^[1-9]\d*$/, "Pull request number must be a positive whole number."),
});

const contextQuerySchema = z.object({
  q: z.string().trim().min(2, "Search query must contain at least 2 characters.").max(500, "Search query is too long."),
});

const reviewIdParamsSchema = z.object({
  reviewId: z.string().trim().min(1, "Review ID is required.").max(100, "Review ID is invalid."),
});

// Stage 15: validate the explicit owner/repository submitted by the codebase
// form before the ingestion service calls GitHub.
const addRepositorySchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
});

module.exports = {
  contextQuerySchema,
  pullRequestParamsSchema,
  repositoryParamsSchema,
  reviewIdParamsSchema,
  addRepositorySchema,
};
