// controllers/historyController.js

import {
  clearHistory,
  deleteTurn,
  historyScope,
  listHistory,
  searchHistory
} from '../services/historyService.js';

const scopeOf = (req) => historyScope(req.user, req.get('x-guest-id'));

/** GET /api/history?q= - recent turns, or semantic search over them. */
export async function getHistory(req, res) {
  const query = String(req.query.q ?? '').trim();
  const limit = Number(req.query.limit) || 50;

  if (!query) {
    const turns = await listHistory(scopeOf(req), limit);
    return res.json({ query: '', search: 'recent', count: turns.length, turns });
  }

  const { mode, turns } = await searchHistory(scopeOf(req), query, limit);
  res.json({ query, search: mode, count: turns.length, turns });
}

/** DELETE /api/history */
export async function removeHistory(req, res) {
  const deleted = await clearHistory(scopeOf(req));
  res.json({ deleted });
}

/** DELETE /api/history/:id */
export async function removeTurn(req, res) {
  const turn = await deleteTurn(scopeOf(req), req.params.id);
  if (!turn) return res.status(404).json({ error: 'History entry not found.' });
  res.json({ deleted: turn });
}
