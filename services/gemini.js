// services/gemini.js
// Optional Gemini client. Without GEMINI_API_KEY the app stays fully usable:
// answers come from FAQ retrieval and search falls back to keyword scoring.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ECOMMERCE_KNOWLEDGE_BASE } from '../ecommerceData.js';
import { createEmbedder } from '../lib/embedder.js';

export const MODEL_NAME = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const embedder = createEmbedder(genAI);

const chatModel = genAI?.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: `You are an enthusiastic and helpful E-Commerce Shopping Assistant for "NovaTrend".
      Answer customer queries clearly using the provided store information and product catalog:
      ---
      ${ECOMMERCE_KNOWLEDGE_BASE}
      ---
      Guidelines:
      1. Help customers with policies (shipping, returns, payments) and product recommendations.
      2. Keep responses concise and friendly.
      3. If a product or policy isn't in the knowledge base, politely state that you don't have that detail and invite them to email support@novatrend.com.`
});

export const getEmbedder = () => embedder;
export const getChatModel = () => chatModel;
export const activeGenerator = () => (chatModel ? MODEL_NAME : 'knowledge-base-fallback');
