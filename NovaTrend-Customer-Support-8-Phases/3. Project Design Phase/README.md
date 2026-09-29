# Phase 3 – Project Design Phase

## System architecture
Layered server with an MVC structure.

```
User (browser)
   │  HTML / CSS / JS  (public/index.html, login.html, dashboard.html)
   ▼
Express.js server (server.js)  ── static files + JSON body parsing
   ▼
Routes (routes/index.js)  ── every /api route
   ▼
Auth middleware (middleware/auth.js)  ── JWT verify, requireAuth / optionalAuth / requireRole
   ▼
Controllers (controllers/*)  ── auth, user, faq, chat, history, dashboard
   ▼
Services / lib
   ├── faqIndex.js + lib/retriever.js   FAQ search (keyword / embeddings)
   ├── gemini.js + lib/embedder.js      Google Gemini chat model + embeddings
   ├── historyService.js                chat history + semantic search
   └── lib/orders.js                    order tracking (mock order book)
   ▼
Models (Mongoose)  ── User, Faq, History
   ▼
MongoDB
```

## Chat request flow

```
POST /api/chat { question }
  ├─ contains an order number or tracking intent?
  │     ├─ guest            → "please sign in" (401)
  │     ├─ order number     → look up order → status, location, ETA, progress
  │     └─ no number        → ask for the order number
  └─ otherwise
        ├─ search top-3 FAQs
        ├─ Gemini key set   → Gemini answers using the FAQs as context
        └─ no key           → answer built from the best FAQ matches
  → save turn to History → JSON response { answer, generator, sources }
```

## Data model

**User** – `name`, `email` (unique), `passwordHash`, `role` (`customer` | `manager` | `admin`), timestamps

**Faq** – `question`, `answer`, `category` (default `General`), timestamps; text index on all three fields

**History** – `userId` (or `guestId` for guests), `question`, `answer`, `generator`, timestamps

```
User 1 ──── * History        Faq (independent collection)
```

## API design (summary)

| Resource | Endpoints | Access |
|----------|-----------|--------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` | public / signed in |
| Users | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id` | admin |
| FAQs | `GET /api/faqs?q=`, `GET /api/faqs/categories`, `GET /api/faqs/:id`, `POST/PUT/DELETE` | read: public, write: manager/admin |
| Chat | `POST /api/chat` | public |
| History | `GET /api/history?q=`, `DELETE /api/history`, `DELETE /api/history/:id` | public (own history) |
| Dashboard | `GET /api/dashboard/stats`, `GET /api/dashboard/recent` | public / manager+admin |
| Orders | `GET /api/orders`, `GET /api/orders/:id` | signed in |

## Role access matrix

| Role | Chat | Order tracking | FAQs | Users | Stats |
|------|------|----------------|------|-------|-------|
| public | yes | asked to sign in | read | – | own chats, FAQs |
| customer | yes | own orders | read | – | + own orders |
| manager | yes | any order | read / write | – | + all chats |
| admin | yes | any order | read / write | CRUD | + users by role |

## User flow

```
Open website → chat as guest ─────────────┐
      │                                    │
      └→ Login (select role) → Dashboard → Ask a question → Answer displayed
                                   │                            │
                                   ├→ FAQ management (staff)    └→ continue chat / search history
                                   └→ User management (admin)
```

## UI design
- **Homepage (`/`)** – "AI Assistant – Your Shopping Support" chat card, open to everyone
- **Login (`/login.html`)** – Customer / Manager / Admin tabs, email + password
- **Dashboard (`/dashboard.html`)** – stat cards, history panel with search, chat panel,
  FAQ management table (staff), user management table (admin)
