function splitCodeIntoChunks(filePath, content, linesPerChunk = 40, overlapLines = 8) {
  const lines = content.split("\n");
  const step = linesPerChunk - overlapLines;
  const chunks = [];

  for (let startIndex = 0; startIndex < lines.length; startIndex += step) {
    const chunkLines = lines.slice(startIndex, startIndex + linesPerChunk);
    const text = chunkLines.join("\n").trim();

    if (!text) {
      continue;
    }

    chunks.push({
      id: Buffer.from(`${filePath}:${startIndex + 1}:${startIndex + chunkLines.length}`).toString("base64url"),
      filePath,
      startLine: startIndex + 1,
      endLine: startIndex + chunkLines.length,
      text,
    });
  }

  return chunks;
}

module.exports = {
  splitCodeIntoChunks,
};
