const sampleFiles = {
  "src/services/userService.js": `
function getUserByEmail(email) {
  return database.user.findUnique({
    where: { email },
  });
}

function createUser(email) {
  return database.user.create({
    data: { email },
  });
}
`,
  "src/middleware/authMiddleware.js": `
async function requireAuthenticatedUser(request, response, next) {
  const token = request.headers.authorization;

  if (!token) {
    return response.status(401).json({ message: "Authentication required." });
  }

  request.user = await verifyToken(token);
  next();
}
`,
  "src/controllers/signupController.js": `
async function signup(request, response) {
  const { email } = request.body;
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return response.status(409).json({ message: "Email already exists." });
  }

  const user = await createUser(email);
  return response.status(201).json(user);
}
`,
};

function splitIntoLineChunks(filePath, content, linesPerChunk = 4, overlapLines = 1) {
  const lines = content.trim().split("\n");
  const step = linesPerChunk - overlapLines;
  const chunks = [];

  for (let startIndex = 0; startIndex < lines.length; startIndex += step) {
    const chunkLines = lines.slice(startIndex, startIndex + linesPerChunk);

    if (chunkLines.length === 0) {
      break;
    }

    chunks.push({
      id: `${filePath}:${startIndex + 1}-${startIndex + chunkLines.length}`,
      filePath,
      startLine: startIndex + 1,
      endLine: startIndex + chunkLines.length,
      text: chunkLines.join("\n"),
    });
  }

  return chunks;
}
function getSearchWords(text) {
  const matches = text
    .toLowerCase()
    .match(/[a-z][a-z0-9_]*/g) || [];

  return matches.filter((word) => word.length > 2);
}
function searchChunks(chunks, query, limit = 3) {
  const queryWords = [...new Set(getSearchWords(query))];

  return chunks
    .map((chunk) => {
      const chunkWords = new Set(getSearchWords(chunk.text));
      const score = queryWords.filter((word) => chunkWords.has(word)).length;

      return {
        ...chunk,
        score,
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);
}

const allChunks = Object.entries(sampleFiles).flatMap(([filePath, content]) => {
  return splitIntoLineChunks(filePath, content);
});

const pullRequestQuestion = `
Find code related to token authentication behaviour.
`;

const retrievedChunks = searchChunks(allChunks, pullRequestQuestion);

console.log("\n--- ALL CHUNKS ---");
for (const chunk of allChunks) {
  console.log(`\n${chunk.id}`);
  console.log(chunk.text);
}

console.log("\n--- RETRIEVED CONTEXT FOR THE PR QUESTION ---");
for (const chunk of retrievedChunks) {
  console.log(`\nScore: ${chunk.score} | ${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`);
  console.log(chunk.text);
}
