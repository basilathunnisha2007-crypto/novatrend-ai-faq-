# Phase 2 – Requirement Analysis

## Stakeholders
- **Customer** – asks questions, tracks own orders
- **Manager** – maintains FAQs, monitors recent customer questions
- **Admin** – everything a manager can do, plus user management
- **Guest (public)** – uses the chatbot without logging in

## Functional requirements

| ID | Requirement |
|----|-------------|
| FR1 | Users can log in with email, password and role (customer / manager / admin) |
| FR2 | New customers can register |
| FR3 | Anyone can ask the chatbot a question and get an answer from the store FAQs |
| FR4 | Signed-in customers can track their own orders by order number (e.g. `NT-123456`) |
| FR5 | Guests asking about an order are asked to sign in |
| FR6 | Managers and admins can create, view, edit, delete and search FAQs |
| FR7 | FAQs are organised by category |
| FR8 | Every chat turn is saved to the user's history; history can be searched and cleared |
| FR9 | Dashboard shows role-specific statistics (chats, FAQs, orders, orders in transit) |
| FR10 | Admins can create, list, update and delete users |

## Non-functional requirements

| Category | Requirement |
|----------|-------------|
| Security | passwords hashed with bcrypt; JWT bearer tokens; role checks on every protected route |
| Availability | the app keeps working without a Gemini key (knowledge-base fallback) |
| Performance | chatbot replies within a few seconds; FAQ index cached in memory |
| Usability | responsive UI that works on desktop and mobile |
| Maintainability | layered MVC structure (routes → controllers → services → models) |
| Correct status codes | 200 / 201 / 400 / 401 / 403 / 404 / 409 / 500 |

## User stories

| As a… | I want to… | So that… |
|-------|-----------|----------|
| customer | ask "where is my order NT-123456" | I know when it will arrive |
| customer | ask about returns and payment methods | I don't have to wait for an agent |
| guest | use the chatbot without an account | I can get quick answers before buying |
| manager | add or edit an FAQ | the assistant gives up-to-date answers |
| admin | manage user accounts and roles | the right people have the right access |

## Technology stack

| Technology | Purpose |
|------------|---------|
| HTML / CSS / JavaScript | frontend (homepage, login, dashboard) |
| Node.js + Express.js | REST API and static file server |
| MongoDB + Mongoose | users, FAQs and chat history |
| Google Gemini (`@google/generative-ai`) | AI answers and text embeddings |
| JSON Web Tokens (`jsonwebtoken`) | authentication |
| bcryptjs | password hashing |
| Postman + `scripts/smoke-test.sh` | API testing |

## Hardware / software requirements
- Node.js 18+ and npm
- MongoDB 7 (local, Docker or Atlas)
- Optional: Gemini API key from https://aistudio.google.com/app/apikey
- Any modern browser
