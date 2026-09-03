const prisma = require("../lib/prisma");

async function getAllTasks() {
  return prisma.task.findMany({
    orderBy: {
      id: "asc",
    },
  });
}

async function createTask(title) {
  return prisma.task.create({
    data: {
      title: title.trim(),
    },
  });
}

async function toggleTask(taskId) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    return null;
  }

  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      completed: !task.completed,
    },
  });
}

async function deleteTask(taskId) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!task) {
    return false;
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });

  return true;
}

module.exports = {
  getAllTasks,
  createTask,
  toggleTask,
  deleteTask,
};
