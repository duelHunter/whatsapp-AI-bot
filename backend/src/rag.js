const { loadKB } = require('./kb');
const { embedText } = require('./gemini');

// Cosine similarity calculation
function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return -1; 

  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

// RAG retrieval — return top K chunks
async function searchKB(query, { topK = 3, waAccountId } = {}) {
  const kb = loadKB();
  const queryEmbedding = await embedText(query);

  const scored = kb.chunks
    .filter(chunk => {
      const okEmbedding = Array.isArray(chunk.embedding) && chunk.embedding.length === queryEmbedding.length;
      const matchesAccount = waAccountId ? chunk.wa_account_id === waAccountId : true;
      return okEmbedding && matchesAccount;
    })
    .map(chunk => ({
      ...chunk,
      score: cosineSim(queryEmbedding, chunk.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

module.exports = {
  cosineSim,
  searchKB,
};
