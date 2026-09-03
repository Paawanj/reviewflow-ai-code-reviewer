const EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIMENSIONS = 768;

let geminiPromise;

function createGeminiConfigurationError() {
    const error = new Error("Gemini API key is missing. Add GEMINI_API_KEY to server/.env.");
    error.status = 500;
    return error;
}

async function getGeminiClient() {
    if (!process.env.GEMINI_API_KEY) {
        throw createGeminiConfigurationError();
    }

    if (!geminiPromise) {
        geminiPromise = import("@google/genai").then(({ GoogleGenAI }) => {
            return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        });
    }

    return geminiPromise;
}

function formatDocument(filePath, text) {
    return `title: ${filePath} | text: ${text}`;
}

function formatCodeQuery(text) {
    return `task: code retrieval | query: ${text}`;
}

async function embedOneText(text) {
    const ai = await getGeminiClient();
    const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: {
            outputDimensionality: EMBEDDING_DIMENSIONS,
        },
    });

    const [embedding] = response.embeddings || [];

    if (!embedding?.values) {
        const error = new Error("Gemini returned no embedding vector.");
        error.status = 502;
        throw error;
    }

    return embedding.values;
}

async function embedDocuments(chunks) {

    const ai = await getGeminiClient();
    const batchSize = 10;
    const embeddings = [];

    for (let startIndex = 0; startIndex < chunks.length; startIndex += batchSize) {
        const batch = chunks.slice(startIndex, startIndex + batchSize);
        const response = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            // Plain strings in an array are treated by this SDK as parts of
            // one content item. Explicit objects ensure Gemini receives one
            // document per chunk and returns one vector for each document.
            contents: batch.map((chunk) => ({
                role: "user",
                parts: [{ text: formatDocument(chunk.filePath, chunk.text) }],
            })),
            config: { outputDimensionality: EMBEDDING_DIMENSIONS },
        });
        const batchEmbeddings = response.embeddings || [];

        if (batchEmbeddings.length !== batch.length || batchEmbeddings.some((item) => !item?.values)) {
            const error = new Error("Gemini returned incomplete embedding vectors.");
            error.status = 502;
            throw error;
        }

        embeddings.push(...batchEmbeddings.map((item) => item.values));
    }

    return embeddings;
}

async function embedQuery(text) {
    return embedOneText(formatCodeQuery(text));
}

module.exports = {
    EMBEDDING_DIMENSIONS,
    embedDocuments,
    embedQuery,
};
