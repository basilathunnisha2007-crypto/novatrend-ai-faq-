# NovaTrend AI Assistant

Online shopping AI FAQ chatbot for **NovaTrend Fashion & Electronics**: Express +
MongoDB REST API, Google Gemini answers (with a no-key fallback), JWT role-based
login (customer / manager / admin), chat history with semantic search, order
tracking and a responsive frontend.

## Setup

```bash
# 1. MongoDB (skip if you already run one, or use an Atlas URI)
docker run -d --name novatrend-mongo -p 27017:27017 --restart unless-stopped mongo:7

# 2. App
npm install
cp .env.example .env     # set MONGODB_URI, JWT_SECRET and optionally GEMINI_API_KEY
npm start                # http://localhost:3000
```

On first start the database is seeded with the demo accounts and 19 FAQs parsed
from the knowledge base in `ecommerceData.js`. Existing documents are never
overwritten, so FAQs edited through the dashboard survive restarts.

Without `GEMINI_API_KEY` the app still runs: answers come from keyword retrieval
over the FAQ collection instead of a generated reply, and history search falls
back from embeddings to TF-IDF + trigram scoring.

## Project structure

```
server.js                 Express bootstrap: dotenv, MongoDB, seed, routes, static files
seed.js                   demo users + FAQs from the knowledge base
config/db.js              mongoose connection
models/                   User.js, Faq.js, History.js
middleware/auth.js        JWT signing, requireAuth / optionalAuth / requireRole
routes/index.js           every /api route, mounted once
controllers/              auth, user, faq, chat, history, dashboard handlers
services/                 gemini.js (model + embedder), faqIndex.js, historyService.js
lib/                      retriever.js (keyword search), embedder.js, orders.js (mock orders)
ecommerceData.js          NovaTrend knowledge base
public/                   index.html (homepage), login.html, dashboard.html, css/, js/
postman/                  importable Postman collection
scripts/smoke-test.sh     exercises every route (npm run test:api)
```

## Pages

| Page             | Who        | Contains                                                        |
| ---------------- | ---------- | --------------------------------------------------------------- |
| `/`              | everyone   | the chatbot homepage, no login required                          |
| `/login.html`    | everyone   | Customer / Manager / Admin login tabs                            |
| `/dashboard.html`| signed in  | stats, chat, history + search, FAQ and user management by role      |

## Roles

| Role       | Chat | Order tracking        | FAQs        | Users | Stats            |
| ---------- | ---- | --------------------- | ----------- | ----- | ---------------- |
| `public`   | yes  | asked to sign in      | read        | -     | own chats, FAQs  |
| `customer` | yes  | own orders only       | read        | -     | + own orders     |
| `manager`  | yes  | any order             | read/write  | -     | + all chats      |
| `admin`    | yes  | any order             | read/write  | CRUD  | + users by role  |

Demo logins: `demo@novatrend.com` / `demo1234` and `priya@example.com` /
`priya1234` (customers), `manager@novatrend.com` / `manager1234`,
`admin@novatrend.com` / `admin1234`. Change them before any real use, and set a
real `JWT_SECRET` — the fallback value is for local development only.

## REST API

All responses are JSON. Protected routes need `Authorization: Bearer <token>`;
public visitors are identified by an `x-guest-id` header so their history stays
their own.

| Method | Route                     | Access            | Description                          |
| ------ | ------------------------- | ----------------- | ------------------------------------ |
| GET    | `/api/health`             | public            | status + active generator            |
| POST   | `/api/auth/login`         | public            | `{ email, password, role? }` -> token |
| POST   | `/api/auth/register`      | public            | creates a customer account           |
| GET    | `/api/auth/me`            | signed in         | current user                         |
| GET    | `/api/users`              | admin             | list users                           |
| POST   | `/api/users`              | admin             | create user (201)                    |
| GET    | `/api/users/:id`          | admin             | one user                             |
| PUT    | `/api/users/:id`          | admin             | update name / email / role / password |
| DELETE | `/api/users/:id`          | admin             | delete user                          |
| GET    | `/api/faqs?q=`            | public            | list or search FAQs                  |
| GET    | `/api/faqs/categories`    | public            | distinct categories                  |
| GET    | `/api/faqs/:id`           | public            | one FAQ                              |
| POST   | `/api/faqs`               | manager, admin    | create FAQ (201)                     |
| PUT    | `/api/faqs/:id`           | manager, admin    | update FAQ                           |
| DELETE | `/api/faqs/:id`           | manager, admin    | delete FAQ                           |
| POST   | `/api/chat`               | public            | `{ question }` -> answer + sources   |
| GET    | `/api/history?q=`         | public            | recent turns or semantic search      |
| DELETE | `/api/history`            | public            | clear own history                    |
| DELETE | `/api/history/:id`        | public            | delete one turn                      |
| GET    | `/api/dashboard/stats`    | public            | role-aware statistics                |
| GET    | `/api/dashboard/recent`   | manager, admin    | latest questions across the store    |
| GET    | `/api/orders`             | signed in         | own orders (customer) or all (staff) |
| GET    | `/api/orders/:id`         | signed in         | one order                            |

Status codes: 200 OK, 201 created, 400 validation error, 401 missing/invalid
token, 403 wrong role, 404 unknown id or route, 409 duplicate email, 500 server
error.

```bash
TOKEN=$(curl -s localhost:3000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"demo@novatrend.com","password":"demo1234","role":"customer"}' | jq -r .token)

curl -s localhost:3000/api/chat -H 'content-type: application/json' \
  -H "Authorization: Bearer $TOKEN" -d '{"question":"where is my order NT-123456"}'
```

## Postman

Import `postman/NovaTrend-AI-Assistant.postman_collection.json`. Run any of the
login requests first — the test script stores `{{token}}`, and every protected
request reuses it. `{{baseUrl}}` defaults to `http://localhost:3000`.

`npm run test:api` runs the same coverage from the shell against a running
server (41 checks, including the 401/403/404/409 paths).

## Order tracking

`lib/orders.js` is a **mock** order book, not carrier data: `NT-123456`,
`NT-987654` (demo customer), `NT-555001`, `NT-777888` (Priya). Asking "where is
my order" prompts for the number, then returns status, location, ETA and
progress. Replace `lookupOrder()` with your OMS or carrier API to go live, and
swap `novatrend.com/track` for the real tracking URL.

## Scaling up

- Move retrieval to a vector store (pgvector / Pinecone / Qdrant) once the FAQ
  collection outgrows an in-process index.
- Pass recent turns to `generateContent` so follow-ups like "and express?" keep
  context.
- Add rate limiting (`express-rate-limit`) and a cache keyed by the normalised
  question before exposing this publicly.
- Log questions whose top retrieval score is low — those are the knowledge gaps.
