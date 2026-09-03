let pineconeIndexPromise;

function createPineconeConfigurationError() {
  const error = new Error("Pinecone configuration is missing. Add PINECONE_API_KEY and PINECONE_INDEX_HOST to server/.env.");
  error.status = 500;
  return error;
}

async function getPineconeIndex() {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_HOST) {
    throw createPineconeConfigurationError();
  }

  if (!pineconeIndexPromise) {
    pineconeIndexPromise = import("@pinecone-database/pinecone").then(({ Pinecone }) => {
      const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
      return pinecone.index({ host: process.env.PINECONE_INDEX_HOST });
    });
  }

  return pineconeIndexPromise;
}

async function upsertVectors(namespace, records) {
  const index = await getPineconeIndex();
  const batchSize = 50;

  for (let startIndex = 0; startIndex < records.length; startIndex += batchSize) {
    const batch = records.slice(startIndex, startIndex + batchSize);
    await index.upsert({ namespace, records: batch });
  }
}

async function queryVectors(namespace, vector, topK = 5) {
  const index = await getPineconeIndex();
  const response = await index.query({
    namespace,
    vector,
    topK,
    includeMetadata: true,
  });

  return response.matches || [];
}

async function deleteNamespaceVectors(namespace) {
  const index = await getPineconeIndex();

  try {
    await index.namespace(namespace).deleteAll();
  } catch (error) {
    // Deleting a namespace that does not exist yet (or is already empty)
    // returns HTTP 404 from Pinecone. There is nothing to remove, so treat it
    // as success and let anything else bubble up.
    const isNamespaceMissing =
      error?.name === "PineconeNotFoundError" ||
      error?.status === 404 ||
      /\b404\b/.test(String(error?.message || ""));
    if (isNamespaceMissing) return;
    throw error;
  }
}

module.exports = {
  upsertVectors,
  queryVectors,
  deleteNamespaceVectors,
};
