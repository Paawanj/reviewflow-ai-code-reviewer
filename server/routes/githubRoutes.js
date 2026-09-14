const express = require("express");
const githubController = require("../controllers/githubController");
const { validateRequest } = require("../middleware/validateRequest");
const {
  contextQuerySchema,
  pullRequestParamsSchema,
  repositoryParamsSchema,
  reviewIdParamsSchema,
  generateFixSchema,
  chatMessageSchema,
} = require("../validation/githubSchemas");
const { asyncHandler } = require("../utils/response");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// Stage 14: every GitHub, saved-review, and analytics request belongs to the
// signed-in user. Controllers use request.user after this middleware runs.
router.use(requireAuth);

router.get("/repos", asyncHandler(githubController.getRepositories));
router.get("/reviews", asyncHandler(githubController.getRecentSavedReviews));
router.get("/analytics/reviews", asyncHandler(githubController.getReviewAnalytics));
router.get(
  "/reviews/:reviewId",
  validateRequest(reviewIdParamsSchema, "params"),
  asyncHandler(githubController.getSavedReview)
);
router.get(
  "/repos/:owner/:repo/pulls",
  validateRequest(repositoryParamsSchema, "params"),
  asyncHandler(githubController.getPullRequests)
);
router.get(
  "/repos/:owner/:repo/pulls/:number/files",
  validateRequest(pullRequestParamsSchema, "params"),
  asyncHandler(githubController.getPullRequestFiles)
);
router.get(
  "/repos/:owner/:repo/pulls/:number/diff",
  validateRequest(pullRequestParamsSchema, "params"),
  asyncHandler(githubController.getPullRequestDiff)
);
router.post(
  "/repos/:owner/:repo/pulls/:number/review",
  validateRequest(pullRequestParamsSchema, "params"),
  asyncHandler(githubController.createPullRequestReview)
);
router.post(
  "/repos/:owner/:repo/index",
  validateRequest(repositoryParamsSchema, "params"),
  asyncHandler(githubController.indexRepository)
);
router.get(
  "/repos/:owner/:repo/context",
  validateRequest(repositoryParamsSchema, "params"),
  validateRequest(contextQuerySchema, "query"),
  asyncHandler(githubController.getRepositoryContext)
);
router.get(
  "/repos/:owner/:repo/pulls/:number/reviews",
  validateRequest(pullRequestParamsSchema, "params"),
  asyncHandler(githubController.getPullRequestReviewHistory)
);
router.post(
  "/fix",
  validateRequest(generateFixSchema, "body"),
  asyncHandler(githubController.generateFindingFix)
);
router.post(
  "/chat",
  validateRequest(chatMessageSchema, "body"),
  asyncHandler(githubController.chatAboutFinding)
);

module.exports = router;
