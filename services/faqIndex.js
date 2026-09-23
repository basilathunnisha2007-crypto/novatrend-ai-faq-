// services/faqIndex.js
// Search index over the FAQ collection. Rebuilt lazily whenever a FAQ is
// created, updated or deleted, so search always reflects the database.

import { Faq } from '../models/Faq.js';
import { FaqRetriever } from '../lib/retriever.js';
import { getEmbedder } from './gemini.js';

let retrieverPromise = null;

async function build() {
  const faqs = await Faq.find().lean();
  const entries = faqs.map((faq) => ({
    id: faq._id.toString(),
    question: faq.question,
    answer: faq.answer,
    category: faq.category
  }));
  return FaqRetriever.create(entries, getEmbedder());
}

export function invalidateFaqIndex() {
  retrieverPromise = null;
}

export function getFaqRetriever() {
  if (!retrieverPromise) retrieverPromise = build();
  return retrieverPromise;
}

export async function searchFaqs(query, topK = 3) {
  const retriever = await getFaqRetriever();
  return retriever.search(query, topK);
}
