const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'i', 'you',
  'my', 'your', 'me', 'we', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'it',
  'can', 'how', 'what', 'when', 'where', 'why', 'with', 'be', 'get', 'got',
  'will', 'have', 'has', 'there', 'that', 'this', 'am', 'if', 'at', 'from',
  'take', 'takes', 'need', 'want', 'use', 'about', 'much', 'many', 'please'
]);

/** Crude suffix stripper: "shipping" -> "ship", "refunds" -> "refund". */
function stem(token) {
  const stripped = token.replace(/(ing|ed|es|s)$/, '');
  if (stripped.length < 3) return token;
  return stripped.replace(/([bdfglmnprt])\1$/, '$1');
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

function trigrams(text) {
  const normalized = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const grams = [];
  for (let i = 0; i + 3 <= normalized.length; i += 1) grams.push(normalized.slice(i, i + 3));
  return grams;
}

function counts(items) {
  const map = new Map();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return map;
}

function sparseCosine(a, b) {
  let dot = 0;
  for (const [key, weight] of a) dot += weight * (b.get(key) ?? 0);
  let normA = 0;
  for (const w of a.values()) normA += w * w;
  let normB = 0;
  for (const w of b.values()) normB += w * w;
  if (!normA || !normB) return 0;
  return dot / Math.sqrt(normA * normB);
}

function denseCosine(a, b) {
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

/**
 * Keyword index: TF-IDF over words blended with character-trigram similarity,
 * so near-misses ("cancelling" vs "cancel") still match. Runs with no API key.
 */
export class LexicalIndex {
  constructor(entries) {
    this.entries = entries;
    this.docFreq = new Map();
    const docTokens = entries.map((e) => tokenize(`${e.question} ${e.answer} ${e.category}`));
    for (const tokens of docTokens) {
      for (const term of new Set(tokens)) this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
    }
    this.tfidf = docTokens.map((tokens) => this.vectorize(tokens));
    this.trigrams = entries.map((e) => counts(trigrams(e.question)));
  }

  vectorize(tokens) {
    const tf = counts(tokens);
    const total = tokens.length || 1;
    const vector = new Map();
    for (const [term, count] of tf) {
      const idf = Math.log((this.entries.length + 1) / ((this.docFreq.get(term) ?? 0) + 1)) + 1;
      vector.set(term, (count / total) * idf);
    }
    return vector;
  }

  score(query) {
    const queryTfidf = this.vectorize(tokenize(query));
    const queryTrigrams = counts(trigrams(query));
    return this.entries.map((_entry, i) =>
      0.7 * sparseCosine(queryTfidf, this.tfidf[i]) + 0.3 * sparseCosine(queryTrigrams, this.trigrams[i]));
  }
}

/** Semantic index built from Gemini text embeddings. */
class EmbeddingIndex {
  constructor(entries, vectors, embedOne) {
    this.entries = entries;
    this.vectors = vectors;
    this.embedOne = embedOne;
  }

  async score(query) {
    const queryVector = await this.embedOne(query);
    return this.vectors.map((vector) => denseCosine(queryVector, vector));
  }
}

export class FaqRetriever {
  constructor(entries, index, mode) {
    this.entries = entries;
    this.index = index;
    this.mode = mode;
  }

  /**
   * Builds a semantic index when an embedder is available, and falls back to
   * keyword search so the API still answers without credentials.
   */
  static async create(entries, embedder) {
    if (embedder) {
      try {
        const vectors = await embedder.embedMany(
          entries.map((e) => `${e.category}: ${e.question}\n${e.answer}`)
        );
        return new FaqRetriever(
          entries,
          new EmbeddingIndex(entries, vectors, (text) => embedder.embedOne(text)),
          'embeddings'
        );
      } catch (error) {
        console.error('Embedding index unavailable, using keyword search:', error.message);
      }
    }
    return new FaqRetriever(entries, new LexicalIndex(entries), 'keyword');
  }

  async search(query, topK = 3) {
    const minScore = this.mode === 'embeddings' ? 0.55 : 0.12;
    const scores = await this.index.score(query);
    return this.entries
      .map((entry, i) => ({ ...entry, score: scores[i] }))
      .filter((hit) => hit.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
