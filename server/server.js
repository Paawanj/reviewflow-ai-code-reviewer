require("dotenv").config();

const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const systemRoutes = require("./routes/systemRoutes");
const taskRoutes = require("./routes/taskRoutes");
const githubRoutes = require("./routes/githubRoutes");
const repositoryRoutes = require("./routes/repositoryRoutes");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const { serve } = require("inngest/express");
const { inngest } = require("./inngest/client");
const { functions } = require("./inngest/functions");



const app = express();
const PORT = 5000;


app.use(express.json());
app.use(requestLogger);
app.use(cookieParser());
app.use("/api/inngest", serve({ client: inngest, functions }));
app.get("/", (request, response) => {
  response.json({
    message: "ReviewFlow API is running.",
    healthCheck: "/api/hello",
  });
});
app.use("/api", systemRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/repositories", repositoryRoutes);
app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
