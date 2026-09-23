// controllers/faqController.js
// FAQ CRUD (managers and admins write, everyone reads) plus FAQ search.

import { Faq } from '../models/Faq.js';
import { invalidateFaqIndex, searchFaqs } from '../services/faqIndex.js';

/** GET /api/faqs?q=&category= - list, filtered by keyword search when q is set. */
export async function listFaqs(req, res) {
  const query = String(req.query.q ?? '').trim();
  const category = String(req.query.category ?? '').trim();

  if (query) {
    const hits = await searchFaqs(query, Number(req.query.limit) || 10);
    const filtered = category ? hits.filter((hit) => hit.category === category) : hits;
    return res.json({ query, count: filtered.length, faqs: filtered });
  }

  const faqs = await Faq.find(category ? { category } : {}).sort({ category: 1, question: 1 });
  res.json({ count: faqs.length, faqs: faqs.map((faq) => faq.toPublic()) });
}

/** GET /api/faqs/categories */
export async function listCategories(_req, res) {
  const categories = await Faq.distinct('category');
  res.json({ categories: categories.sort() });
}

/** GET /api/faqs/:id */
export async function getFaq(req, res) {
  const faq = await Faq.findById(req.params.id);
  if (!faq) return res.status(404).json({ error: 'FAQ not found.' });
  res.json({ faq: faq.toPublic() });
}

/** POST /api/faqs - { question, answer, category? } */
export async function createFaq(req, res) {
  const { question, answer, category } = req.body ?? {};
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required.' });
  }

  const faq = await Faq.create({ question, answer, category: category || 'General' });
  invalidateFaqIndex();
  res.status(201).json({ faq: faq.toPublic() });
}

/** PUT /api/faqs/:id */
export async function updateFaq(req, res) {
  const { question, answer, category } = req.body ?? {};
  const faq = await Faq.findById(req.params.id);
  if (!faq) return res.status(404).json({ error: 'FAQ not found.' });

  if (question) faq.question = question;
  if (answer) faq.answer = answer;
  if (category) faq.category = category;
  await faq.save();
  invalidateFaqIndex();

  res.json({ faq: faq.toPublic() });
}

/** DELETE /api/faqs/:id */
export async function deleteFaq(req, res) {
  const faq = await Faq.findByIdAndDelete(req.params.id);
  if (!faq) return res.status(404).json({ error: 'FAQ not found.' });
  invalidateFaqIndex();
  res.json({ deleted: faq.toPublic() });
}
