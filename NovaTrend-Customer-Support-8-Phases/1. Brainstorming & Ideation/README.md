# Phase 1 – Brainstorming & Ideation

## Problem statement
Online shoppers at NovaTrend repeatedly ask the same questions — *Where is my order? How do I
return an item? Which payment methods do you accept?* — and wait for a support agent to answer.

- Repeated customer queries take up most of the support team's time
- Manual responses are slow and inconsistent
- A growing list of FAQs is hard to organise, search and keep up to date
- Customers cannot get help outside office hours

## Brainstormed ideas

| Idea | Pros | Cons | Selected |
|------|------|------|----------|
| Static FAQ web page | simple, cheap | customers must read/scroll; no order status | no |
| Email / ticket system | full audit trail | slow, still manual | no |
| Rule-based chatbot | predictable | brittle, breaks on new wording | partly (order tracking) |
| **AI chatbot grounded on the store FAQ + order data** | instant, natural language, 24x7, answers stay on-policy | needs an AI key (fallback required) | **yes** |

## Selected solution
An **AI FAQ Assistant** web app where customers type a question and get an instant answer:

- FAQ answers are retrieved from a MongoDB FAQ collection and phrased by **Google Gemini**
  (keyword/TF-IDF retrieval is used when no Gemini key is configured)
- Order tracking questions are answered from the order book for signed-in customers
- Managers and admins keep the FAQ list up to date from a dashboard
- JWT login with three roles: customer, manager, admin

## Empathy map (customer)

| Says | Thinks | Does | Feels |
|------|--------|------|-------|
| "Where is my order?" | "Why is nobody replying?" | refreshes email, searches the site | anxious, impatient |
| "Can I return this?" | "What is the policy for electronics?" | scrolls through long policy pages | confused |

## Idea prioritisation

| Feature | Value | Effort | Priority |
|---------|-------|--------|----------|
| Chatbot answering FAQs | high | medium | P1 |
| Order tracking in chat | high | medium | P1 |
| Login with roles | high | low | P1 |
| FAQ management (CRUD) | high | low | P1 |
| Chat history + search | medium | medium | P2 |
| Dashboard statistics | medium | low | P2 |
| AI-generated FAQ suggestions | medium | medium | P3 (future) |
