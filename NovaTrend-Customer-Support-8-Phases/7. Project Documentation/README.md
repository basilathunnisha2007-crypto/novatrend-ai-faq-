# Phase 7 – Project Documentation

## Project summary
**NovaTrend AI Assistant** is an AI-powered customer support chatbot for NovaTrend Fashion &
Electronics. Customers get instant answers about shipping, returns, payments and products, and
can track their orders; staff maintain the FAQ knowledge base from a role-based dashboard.

## Objectives achieved
1. Automated customer support through a chatbot available to everyone
2. Less repetitive manual work – common questions answered from the FAQ collection
3. Fast FAQ search (keyword + semantic)
4. AI-assisted answers with Google Gemini, with a no-key fallback
5. Secure users and data – bcrypt, JWT and role-based access
6. FAQs organised by category and editable by managers/admins

## User guide

### Guest
1. Open `http://localhost:3000`
2. Type a question (e.g. *"What is your return policy?"*) and press **Send**
3. For order tracking, click **Sign in**

### Customer
1. Go to `/login.html`, keep the **Customer** tab, enter email and password
2. The dashboard shows *Your chats*, *FAQ entries*, *Orders* and *In transit*
3. Ask *"Where is my order?"*, then give the order number (e.g. `NT-123456`)
4. Use the **History** panel to search or clear previous chats

### Manager
1. Log in on the **Manager** tab
2. Add, edit or delete FAQs in **FAQ management**
3. See the latest customer questions across the store

### Admin
1. Log in on the **Admin** tab
2. Everything a manager can do, plus **User management** (create, edit role, delete users)

## Configuration (`.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | secret used to sign tokens (required for real use) |
| `JWT_EXPIRES_IN` | token lifetime, e.g. `1h` |
| `GEMINI_API_KEY` | optional – enables Gemini answers and embeddings |
| `GEMINI_MODEL` | default `gemini-2.0-flash` |
| `GEMINI_EMBEDDING_MODEL` | default `text-embedding-004` |
| `PORT` | default `3000` |

## API reference
The full REST reference (every route, access level and status code) is in the repository
[README](../../README.md#rest-api). A ready-to-import Postman collection is in
[`postman/`](../../postman/).

## Limitations
- Order tracking uses a mock order book; replace `lookupOrder()` in `lib/orders.js` with a real
  order-management or carrier API to go live
- AI-generated FAQ suggestions from a topic are not implemented yet
- Chat replies do not yet use previous turns as context

## Future enhancements
- Gemini-generated FAQ suggestions for managers
- Conversation context for follow-up questions
- Vector database (pgvector / Pinecone / Qdrant) for large FAQ collections
- Rate limiting and response caching before public launch
- Report of low-confidence questions to find knowledge gaps
- Multi-language support

## Conclusion
The AI FAQ Assistant replaces repetitive manual support with an always-available chatbot that
answers from the store's own knowledge base, tracks orders securely and lets staff keep answers
up to date — reducing response time for customers and workload for the support team.
