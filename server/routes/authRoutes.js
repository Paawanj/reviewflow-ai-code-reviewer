const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/requireAuth");
const { validateRequest } = require("../middleware/validateRequest");
const { credentialsSchema, loginSchema } = require("../validation/authSchemas");
const { asyncHandler } = require("../utils/response");
const {githubTokenSchema}=require("../validation/authSchemas");
const router = express.Router();

router.get("/github", asyncHandler(authController.startGitHubLogin));
router.get("/github/callback", asyncHandler(authController.completeGitHubLogin));
router.post("/register", validateRequest(credentialsSchema, "body"), asyncHandler(authController.register));
router.post("/login", validateRequest(loginSchema, "body"), asyncHandler(authController.login));
router.get("/me", requireAuth, asyncHandler(authController.getCurrentUser));
router.post(
  "/github-token",
  requireAuth,
  validateRequest(githubTokenSchema, "body"),
  asyncHandler(authController.connectGitHub)
);
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));

module.exports = router;
