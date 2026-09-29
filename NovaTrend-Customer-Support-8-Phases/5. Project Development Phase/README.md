# Phase 5 – Project Development Phase

## Folder structure (repository root)

```
server.js                 Express bootstrap: dotenv, MongoDB, seed, routes, static files
seed.js                   demo users + FAQs from the knowledge base
config/db.js              mongoose connection
models/                   User.js, Faq.js, History.js
middleware/auth.js        JWT signing, requireAuth / optionalAuth / requireRole
routes/index.js           every /api route
controllers/              auth, user, faq, chat, history, dashboard
services/                 gemini.js, faqIndex.js, historyService.js
lib/                      retriever.js, embedder.js, orders.js
ecommerceData.js          NovaTrend knowledge base
public/                   index.html, login.html, dashboard.html, css/, js/api.js
postman/                  Postman collection
scripts/smoke-test.sh     API smoke test (npm run test:api)
```

## Modules implemented

### 1. Login & authentication module
- `controllers/authController.js` – login (with role check), register, `me`
- `middleware/auth.js` – signs JWTs, verifies `Authorization: Bearer <token>`, enforces roles
- `models/User.js` – bcrypt hashing (`hashPassword`, `checkPassword`)

### 2. AI chatbot module
- `controllers/chatController.js` – routes each question to order tracking or FAQ answering
- `services/gemini.js` – Gemini chat model with a NovaTrend system prompt
- Without `GEMINI_API_KEY` the answer is built from the top FAQ matches (`knowledge-base-fallback`)

### 3. FAQ management module
- `controllers/faqController.js` + `models/Faq.js` – full CRUD, keyword search, categories
- `services/faqIndex.js` – search index rebuilt whenever an FAQ changes

### 4. Search module
- `lib/retriever.js` – tokenising, stemming, TF-IDF + trigram scoring
- `lib/embedder.js` – Gemini `text-embedding-004` embeddings for semantic search when a key is set

### 5. Order tracking module
- `lib/orders.js` – detects tracking intent and order numbers (`NT-######`), returns status,
  location, ETA and progress; customers only see their own orders

### 6. Chat history module
- `services/historyService.js`, `controllers/historyController.js` – stores every turn per user
  (or per guest id), semantic search over past chats, delete one / clear all

### 7. Dashboard module
- `controllers/dashboardController.js` – role-aware stats: chats, FAQ entries, orders, in transit,
  all chats (staff), users by role (admin)

### 8. Frontend
- `public/index.html` – public chatbot homepage
- `public/login.html` – Customer / Manager / Admin login tabs
- `public/dashboard.html` – stats, history, chat, FAQ and user management by role
- `public/js/api.js` – shared REST client (JWT + guest id)

## Key code – chat decision logic

```js
const orderId = extractOrderId(question);
const tracking = orderId || isTrackingIntent(question);

if (tracking && req.user.role === ROLES.PUBLIC) return reply(askToSignIn(), 'order-tracking', {}, 401);
if (orderId) return reply(formatOrderStatus(lookupOrder(orderId, req.user)), 'order-tracking');
if (tracking) return reply(askForOrderId(req.user), 'order-tracking');

const hits = await searchFaqs(question, 3);
// Gemini answers with the FAQs as context, or fall back to the best FAQ answers
```

## Running the project

```bash
docker run -d --name novatrend-mongo -p 27017:27017 mongo:7   # or use MongoDB Atlas
npm install
cp .env.example .env      # set MONGODB_URI, JWT_SECRET, optionally GEMINI_API_KEY
npm start                 # http://localhost:3000
```

On first start the database is seeded with the demo accounts and 19 FAQs.

| Role | Email | Password |
|------|-------|----------|
| customer | demo@novatrend.com | demo1234 |
| customer | priya@example.com | priya1234 |
| manager | manager@novatrend.com | manager1234 |
| admin | admin@novatrend.com | admin1234 |
