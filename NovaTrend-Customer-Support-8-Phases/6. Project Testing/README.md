# Phase 6 – Project Testing

## Test approach

| Type | Tool | Scope |
|------|------|-------|
| API / integration | `scripts/smoke-test.sh` (`npm run test:api`) | every REST route, including error paths |
| Manual API | Postman (`postman/NovaTrend-AI-Assistant.postman_collection.json`) | same routes, token stored automatically |
| Functional (UI) | browser | homepage chat, login per role, dashboard, FAQ / user management |
| Chatbot | chat UI + `POST /api/chat` | FAQ answers, order tracking, guest restrictions |

**Environment:** Node.js 20, MongoDB 7, no `GEMINI_API_KEY` (knowledge-base fallback mode),
server at `http://localhost:3000`.

## API test results – 41 / 41 passed

Full output: [`api-test-results.txt`](api-test-results.txt)

| # | Test case | Expected | Result |
|---|-----------|----------|--------|
| 1 | `GET /api/health` | 200 | pass |
| 2 | login with wrong password | 401 | pass |
| 3 | customer logs in on the admin tab (role mismatch) | 403 | pass |
| 4 | `GET /api/auth/me` with / without token | 200 / 401 | pass |
| 5 | list, search (`?q=refund`) and categories of FAQs | 200 | pass |
| 6 | customer tries to create an FAQ | 403 | pass |
| 7 | manager creates, reads, updates, deletes an FAQ | 201 / 200 / 200 / 200 | pass |
| 8 | read a deleted FAQ | 404 | pass |
| 9 | chat as guest / empty question | 200 / 400 | pass |
| 10 | order tracking as guest / as customer | 401 / 200 | pass |
| 11 | history list, search, delete unknown id, clear | 200 / 200 / 404 / 200 | pass |
| 12 | dashboard stats (public, admin) | 200 | pass |
| 13 | recent conversations as customer / manager | 403 / 200 | pass |
| 14 | list users as manager / admin | 403 / 200 | pass |
| 15 | admin creates user / duplicate email | 201 / 409 | pass |
| 16 | admin reads, updates, deletes user | 200 | pass |
| 17 | customer reads another customer's order | 404 | pass |
| 18 | manager reads any order | 200 | pass |
| 19 | unknown API route | 404 | pass |
| 20 | `/`, `/login.html`, `/dashboard.html` served | 200 | pass |

## Chatbot test cases

| # | User | Question | Expected answer | Result |
|---|------|----------|-----------------|--------|
| C1 | guest | What payment methods are available? | Visa, MasterCard, Amex, PayPal, Apple Pay, Klarna | pass |
| C2 | guest | Do you ship internationally? | select countries, 7-14 business days | pass |
| C3 | guest | How can I track my order? | asks the guest to sign in | pass |
| C4 | customer | Where is my order? | asks for the order number, lists own orders | pass |
| C5 | customer | NT-123456 | "Out for Delivery", Chennai hub, ETA today before 8 PM, tracking number | pass |
| C6 | customer | an order that belongs to another customer | "order not found" | pass |

## Observations
- In fallback mode, "How can I cancel my order?" returns the whole *Order Tracking & Status*
  section; the cancellation rule ("only while the order is in Processing status") is included but
  not highlighted. With a Gemini key the answer is phrased more precisely.
- Order data is a mock order book (`lib/orders.js`), not a live carrier integration.
