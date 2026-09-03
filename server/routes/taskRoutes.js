const express = require("express");
const taskController = require("../controllers/taskController");
const { asyncHandler } = require("../utils/response");

const router = express.Router();

router
  .route("/")
  .get(asyncHandler(taskController.getTasks))
  .post(asyncHandler(taskController.createTask));

router
  .route("/:id")
  .put(asyncHandler(taskController.toggleTask))
  .delete(asyncHandler(taskController.deleteTask));

module.exports = router;
