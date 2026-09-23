// seed.js
// First-run data: the demo accounts and the FAQ collection built from the
// NovaTrend knowledge base. Existing documents are never overwritten, so
// edits made through the admin UI survive restarts.

import { ECOMMERCE_KNOWLEDGE_BASE, parseKnowledgeBase } from './ecommerceData.js';
import { Faq } from './models/Faq.js';
import { ROLES, User } from './models/User.js';
import { invalidateFaqIndex } from './services/faqIndex.js';

const DEMO_USERS = [
  { name: 'Demo Customer', email: 'demo@novatrend.com', password: 'demo1234', role: ROLES.CUSTOMER },
  { name: 'Priya', email: 'priya@example.com', password: 'priya1234', role: ROLES.CUSTOMER },
  { name: 'Store Manager', email: 'manager@novatrend.com', password: 'manager1234', role: ROLES.MANAGER },
  { name: 'Site Admin', email: 'admin@novatrend.com', password: 'admin1234', role: ROLES.ADMIN }
];

export async function seedDatabase() {
  for (const { name, email, password, role } of DEMO_USERS) {
    if (await User.exists({ email })) continue;
    await User.create({ name, email, role, passwordHash: User.hashPassword(password) });
    console.log(`Seeded ${role}: ${email}`);
  }

  if (await Faq.countDocuments()) return;

  const { chunks } = parseKnowledgeBase(ECOMMERCE_KNOWLEDGE_BASE);
  await Faq.insertMany(
    chunks.map((chunk) => ({
      question: `${chunk.category}: ${chunk.answer.split(/[.:(]/)[0].trim()}`,
      answer: chunk.answer,
      category: chunk.category
    }))
  );
  invalidateFaqIndex();
  console.log(`Seeded ${chunks.length} FAQs from the knowledge base`);
}
