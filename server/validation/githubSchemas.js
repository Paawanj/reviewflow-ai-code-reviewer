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

const generateFixSchema = z.object({
  findingDescription: z
    .string()
    .trim()
    .min(5, "Finding description must contain at least 5 characters.")
    .max(1000, "Finding description is too long."),
  suggestion: z
    .string()
    .trim()
    .min(2, "Suggestion must contain at least 2 characters.")
    .max(1000, "Suggestion is too long."),
  filePath: z
    .string()
    .trim()
    .min(1, "File path is required.")
    .max(500, "File path is too long."),
  line: z.number().int().min(0).max(100000).optional().default(0),
  codeContext: z
    .string()
    .trim()
    .min(5, "Code context must contain at least 5 characters.")
    .max(5000, "Code context is too long. Provide only the relevant surrounding code."),
});

const chatMessageSchema = z.object({
  findingDescription: z
    .string()
    .trim()
    .min(5, "Finding description must contain at least 5 characters.")
    .max(1000, "Finding description is too long."),
  suggestion: z
    .string()
    .trim()
    .min(2, "Suggestion must contain at least 2 characters.")
    .max(1000, "Suggestion is too long."),
  filePath: z
    .string()
    .trim()
    .min(1, "File path is required.")
    .max(500, "File path is too long."),
  codeContext: z
    .string()
    .trim()
    .min(5, "Code context must contain at least 5 characters.")
    .max(5000, "Code context is too long."),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z
          .string()
          .trim()
          .min(1, "Message content is required.")
          .max(2000, "Message is too long."),
      })
    )
    .min(1, "At least one message is required.")
    .max(20, "Conversation is too long. Start a new chat."),
});

module.exports = {
  contextQuerySchema,
  pullRequestParamsSchema,
  repositoryParamsSchema,
  reviewIdParamsSchema,
  addRepositorySchema,
  generateFixSchema,
  chatMessageSchema,
};
