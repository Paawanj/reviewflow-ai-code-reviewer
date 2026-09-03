const taskService = require("../services/taskService");
const { sendError, sendJson } = require("../utils/response");

async function getTasks(request, response) {
  const tasks = await taskService.getAllTasks();
  return sendJson(response, 200, tasks);
}

async function createTask(request, response) {
  const { title } = request.body;

  if (typeof title !== "string" || !title.trim()) {
    return sendError(response, 400, "A task title is required.");
  }

  const newTask = await taskService.createTask(title);
  return sendJson(response, 201, newTask);
}

async function toggleTask(request, response) {
  const taskId = Number(request.params.id);
  const task = await taskService.toggleTask(taskId);

  if (!task) {
    return sendError(response, 404, "Task not found.");
  }

  return sendJson(response, 200, task);
}

async function deleteTask(request, response) {
  const taskId = Number(request.params.id);
  const wasDeleted = await taskService.deleteTask(taskId);

  if (!wasDeleted) {
    return sendError(response, 404, "Task not found.");
  }

  return response.status(204).send();
}

module.exports = {
  getTasks,
  createTask,
  toggleTask,
  deleteTask,
};
