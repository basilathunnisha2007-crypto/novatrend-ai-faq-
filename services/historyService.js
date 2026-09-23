// services/historyService.js
// Chat history in MongoDB, with meaning-based search over past turns:
// Gemini embeddings when a key is set, otherwise TF-IDF + character trigrams
// with the query widened by the FAQ it matches, so "money back" finds a
// refund conversation.

import { History } from '../models/History.js';
import { LexicalIndex } from '../lib/retriever.js';
import { getEmbedder } from './gemini.js';
import { searchFaqs } from './faqIndex.js';

/** History belongs to an account, or to a browser for public visitors. */
export function historyScope(user, guestId) {
  if (user?.id) return { userId: user.id };
  return { guestId: guestId || 'anonymous' };
}

export async function addTurn(scope, { question, answer, generator }) {
  const turn = await History.create({ ...scope, question, answer, generator });
  return turn.toPublic();
}

export async function listHistory(scope, limit = 50) {
  const turns = await History.find(scope).sort({ createdAt: -1 }).limit(limit);
  return turns.map((turn) => turn.toPublic());
}

export async function clearHistory(scope) {
  const { deletedCount } = await History.deleteMany(scope);
  return deletedCount ?? 0;
}

export async function deleteTurn(scope, id) {
  const turn = await History.findOneAndDelete({ ...scope, _id: id });
  return turn ? turn.toPublic() : null;
}

export async function countHistory(scope) {
  return History.countDocuments(scope);
}

export async function searchHistory(scope, query, limit = 20) {
  const turns = await listHistory(scope, 200);
  if (!query?.trim() || !turns.length) {
    return { mode: 'recent', turns: turns.slice(0, limit) };
  }

  const documents = turns.map((turn) => ({
    category: turn.generator,
    question: turn.question,
    answer: turn.answer
  }));

  const embedder = getEmbedder();
  let scores;
  let mode = 'keyword';

  if (embedder) {
    try {
      scores = await embedder.scoreAgainst(
        query,
        documents.map((doc) => `${doc.question}\n${doc.answer}`)
      );
      mode = 'embeddings';
    } catch (error) {
      console.error('History embedding search unavailable, using keyword search:', error.message);
    }
  }

  if (!scores) {
    const hits = await searchFaqs(query, 2);
    const expansion = hits.map((hit) => `${hit.question} ${hit.answer}`).join(' ');
    scores = new LexicalIndex(documents).score(`${query} ${query} ${expansion}`);
  }

  const minScore = mode === 'embeddings' ? 0.55 : 0.08;
  const matches = turns
    .map((turn, i) => ({ ...turn, score: scores[i] }))
    .filter((turn) => turn.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { mode, turns: matches };
}
