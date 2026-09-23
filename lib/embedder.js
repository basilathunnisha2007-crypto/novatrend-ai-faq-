// lib/embedder.js
// Gemini text embeddings used for semantic (meaning-based) search. Optional:
// without GEMINI_API_KEY the callers fall back to keyword search.

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL ?? 'text-embedding-004';

function cosine(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / Math.sqrt(normA * normB);
}

export function createEmbedder(genAI) {
  if (!genAI) return null;
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const cache = new Map();

  async function embedOne(text) {
    if (cache.has(text)) return cache.get(text);
    const { embedding } = await model.embedContent(text);
    cache.set(text, embedding.values);
    return embedding.values;
  }

  return {
    model: EMBEDDING_MODEL,
    embedOne,
    embedMany: (texts) => Promise.all(texts.map(embedOne)),
    async scoreAgainst(query, texts) {
      const [queryVector, vectors] = await Promise.all([
        embedOne(query),
        Promise.all(texts.map(embedOne))
      ]);
      return vectors.map((vector) => cosine(queryVector, vector));
    }
  };
}
