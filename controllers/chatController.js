// controllers/chatController.js
// The chatbot: order tracking is answered deterministically from the order
// book, everything else from the FAQ collection (Gemini phrases the reply when
// a key is configured). Every turn is stored in the caller's history.

import { ROLES } from '../models/User.js';
import {
  askForOrderId,
  askToSignIn,
  extractOrderId,
  formatOrderNotFound,
  formatOrderStatus,
  isTrackingIntent,
  lookupOrder
} from '../lib/orders.js';
import { searchFaqs } from '../services/faqIndex.js';
import { getChatModel, activeGenerator } from '../services/gemini.js';
import { addTurn, historyScope } from '../services/historyService.js';

const NO_ANSWER =
  "I don't have that detail yet. Please email support@novatrend.com and our team will help.";

/** POST /api/chat - { question } -> { question, answer, generator, sources } */
export async function chat(req, res) {
  const question = String(req.body?.question ?? '').trim();
  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const scope = historyScope(req.user, req.get('x-guest-id'));
  const reply = async (answer, generator, extra = {}, status = 200) => {
    const turn = await addTurn(scope, { question, answer, generator });
    return res.status(status).json({ id: turn.id, question, answer, generator, ...extra });
  };

  try {
    const orderId = extractOrderId(question);
    const tracking = orderId || isTrackingIntent(question);

    if (tracking && req.user.role === ROLES.PUBLIC) {
      return reply(askToSignIn(), 'order-tracking', {}, 401);
    }
    if (orderId) {
      const order = lookupOrder(orderId, req.user);
      const answer = order ? formatOrderStatus(order, req.user) : formatOrderNotFound(orderId);
      return reply(answer, 'order-tracking', { order: order ?? null });
    }
    if (tracking) {
      return reply(askForOrderId(req.user), 'order-tracking');
    }

    const hits = await searchFaqs(question, 3);
    const sources = hits.map((hit) => ({ id: hit.id, question: hit.question, category: hit.category }));
    const model = getChatModel();

    if (!model) {
      const answer = hits.length
        ? `${hits[0].category}: ${hits.map((hit) => hit.answer).join(' ')}`
        : NO_ANSWER;
      return reply(answer, 'knowledge-base-fallback', { sources });
    }

    const context = hits.map((hit) => `Q: ${hit.question}\nA: ${hit.answer}`).join('\n\n');
    const prompt = context ? `${question}\n\nRelevant store FAQs:\n${context}` : question;
    const result = await model.generateContent(prompt);
    return reply(result.response.text(), activeGenerator(), { sources });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
}
