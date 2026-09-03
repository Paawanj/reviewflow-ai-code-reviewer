const express = require("express");
const repositoryController = require("../controllers/repositoryController");
const { requireAuth } = require("../middleware/requireAuth");
const { validateRequest } = require("../middleware/validateRequest");
const { addRepositorySchema } = require("../validation/githubSchemas");
const { asyncHandler } = require("../utils/response");

const router = express.Router();

router.use(requireAuth);
router.get("/", asyncHandler(repositoryController.list));
router.post("/", validateRequest(addRepositorySchema, "body"), asyncHandler(repositoryController.add));
router.post("/:id/reindex", asyncHandler(repositoryController.reindex));
router.delete("/:id", asyncHandler(repositoryController.remove));

module.exports = router;
