const githubService = require("./githubService");
const { splitCodeIntoChunks } = require("../utils/codeChunks");
const { embedDocuments, embedQuery } = require("./embeddingService");
const { queryVectors, upsertVectors } = require("./pineconeService");

function getRepositoryNamespace(owner, repo) {
  return `${owner}--${repo}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

async function indexRepository(accessToken,owner, repo) {
  const repository = await githubService.getRepositorySourceFiles(accessToken,owner, repo);
  const chunks = repository.files.flatMap((file) => splitCodeIntoChunks(file.path, file.content));

  if (chunks.length === 0) {
    const error = new Error("No supported source-code files were found to index.");
    error.status = 400;
    throw error;
  }

 const embeddings = await embedDocuments(chunks);
  const namespace = getRepositoryNamespace(owner, repo);
  const records = chunks.map((chunk, index) => ({
    id: chunk.id,
    values: embeddings[index],
    metadata: {
      filePath: chunk.filePath,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      text: chunk.text,
      branch: repository.branch,
    },
  }));

  await upsertVectors(namespace, records);

  return {
    namespace,
    branch: repository.branch,
    indexedFiles: repository.files.length,
    indexedChunks: records.length,
  };
}

async function searchRepositoryContext(owner, repo, query) {
  const namespace = getRepositoryNamespace(owner, repo);
  const queryVector = await embedQuery(query);
  const matches = await queryVectors(namespace, queryVector);

  return matches.map((match) => ({
    score: match.score,
    filePath: match.metadata?.filePath,
    startLine: match.metadata?.startLine,
    endLine: match.metadata?.endLine,
    text: match.metadata?.text,
    branch: match.metadata?.branch,
  }));
}

module.exports = {
  getRepositoryNamespace,
  indexRepository,
  searchRepositoryContext,
};
