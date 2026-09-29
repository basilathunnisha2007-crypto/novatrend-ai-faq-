# Phase 4 – Project Planning Phase

## Team roles

| Member | Responsibility |
|--------|----------------|
| Basilath Unnisha J | team lead, backend (Express routes, auth, integration) |
| Alia Fathima S | database design, Mongoose models, seed data |
| Ammu S | frontend pages (homepage, login, dashboard) |
| Anisa Begam A | AI integration (Gemini, FAQ retrieval, chat logic) |
| Syed Ali Fathima Z | testing (Postman, smoke tests) and documentation |

*(Adjust the assignments above if your team split the work differently.)*

## Sprint plan

| Sprint | Goal | Key deliverables |
|--------|------|------------------|
| Sprint 1 | foundation | project setup, Express server, MongoDB connection, User model, JWT login/register |
| Sprint 2 | FAQ & chatbot | Faq model + CRUD, knowledge base seed, retriever, Gemini chat, fallback mode |
| Sprint 3 | orders & history | order tracking flow, chat history + search, dashboard statistics |
| Sprint 4 | UI, testing, docs | homepage, login, dashboard UI, Postman collection, smoke test, documentation, demo |

## Product backlog

| ID | User story / task | Sprint | Priority | Story points |
|----|-------------------|--------|----------|--------------|
| B1 | Set up Node.js + Express project and MongoDB connection | 1 | high | 2 |
| B2 | User model with bcrypt password hashing | 1 | high | 2 |
| B3 | Login / register with JWT and role selection | 1 | high | 3 |
| B4 | Role middleware (requireAuth, requireRole) | 1 | high | 2 |
| B5 | FAQ model and CRUD API | 2 | high | 3 |
| B6 | Seed FAQs from the NovaTrend knowledge base | 2 | medium | 2 |
| B7 | FAQ search (keyword + embeddings) | 2 | high | 5 |
| B8 | Chat endpoint with Gemini and no-key fallback | 2 | high | 5 |
| B9 | Order tracking in chat | 3 | high | 3 |
| B10 | Chat history with search and delete | 3 | medium | 3 |
| B11 | Role-aware dashboard statistics | 3 | medium | 2 |
| B12 | Admin user management API | 3 | medium | 3 |
| B13 | Homepage, login and dashboard UI | 4 | high | 5 |
| B14 | Postman collection and smoke test script | 4 | medium | 3 |
| B15 | Documentation and demo | 4 | medium | 2 |

## Milestones
1. Backend API with authentication working
2. Chatbot answering FAQs and tracking orders
3. Frontend connected to the API for all three roles
4. All 41 API checks passing; documentation and demo ready

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Gemini API key missing or quota exceeded | knowledge-base fallback answers from the FAQ collection |
| AI answers going off-policy | system prompt restricts answers to the NovaTrend knowledge base |
| Customers seeing other customers' orders | order lookup is scoped to the signed-in customer's email |
| Weak demo credentials in production | `JWT_SECRET` and demo passwords must be changed before real use |
