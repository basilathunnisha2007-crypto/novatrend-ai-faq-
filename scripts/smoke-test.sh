#!/usr/bin/env bash
# Exercises every REST route against a running server: ./scripts/smoke-test.sh
set -u
BASE="${BASE:-http://localhost:3000}"
PASS=0
FAIL=0

check() { # check <label> <expected-status> <curl args...>
  local label=$1 expect=$2; shift 2
  local code
  code=$(curl -s -o /tmp/smoke-body -w '%{http_code}' "$@")
  if [ "$code" = "$expect" ]; then
    PASS=$((PASS + 1)); printf 'ok   %-46s %s\n' "$label" "$code"
  else
    FAIL=$((FAIL + 1)); printf 'FAIL %-46s got %s want %s\n  %s\n' "$label" "$code" "$expect" "$(head -c 200 /tmp/smoke-body)"
  fi
}

json() { python3 -c "import sys,json;print(json.load(sys.stdin)$1)"; }
login() {
  curl -s "$BASE/api/auth/login" -H 'content-type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\",\"role\":\"$3\"}" | json "['token']"
}

CUSTOMER=$(login demo@novatrend.com demo1234 customer)
MANAGER=$(login manager@novatrend.com manager1234 manager)
ADMIN=$(login admin@novatrend.com admin1234 admin)

check "GET  /api/health" 200 "$BASE/api/health"
check "POST /api/auth/login bad password" 401 "$BASE/api/auth/login" -H 'content-type: application/json' -d '{"email":"demo@novatrend.com","password":"wrong"}'
check "POST /api/auth/login role mismatch" 403 "$BASE/api/auth/login" -H 'content-type: application/json' -d '{"email":"demo@novatrend.com","password":"demo1234","role":"admin"}'
check "GET  /api/auth/me" 200 "$BASE/api/auth/me" -H "Authorization: Bearer $CUSTOMER"
check "GET  /api/auth/me no token" 401 "$BASE/api/auth/me"

check "GET  /api/faqs" 200 "$BASE/api/faqs"
check "GET  /api/faqs?q=refund" 200 "$BASE/api/faqs?q=refund"
check "GET  /api/faqs/categories" 200 "$BASE/api/faqs/categories"
check "POST /api/faqs as customer" 403 "$BASE/api/faqs" -H "Authorization: Bearer $CUSTOMER" -H 'content-type: application/json' -d '{"question":"q","answer":"a"}'
check "POST /api/faqs as manager" 201 "$BASE/api/faqs" -H "Authorization: Bearer $MANAGER" -H 'content-type: application/json' -d '{"question":"Do you gift wrap?","answer":"Yes, free at checkout.","category":"Orders"}'
FAQ_ID=$(json "['faq']['id']" < /tmp/smoke-body)
check "GET  /api/faqs/:id" 200 "$BASE/api/faqs/$FAQ_ID"
check "PUT  /api/faqs/:id" 200 -X PUT "$BASE/api/faqs/$FAQ_ID" -H "Authorization: Bearer $MANAGER" -H 'content-type: application/json' -d '{"answer":"Yes, gift wrapping is free."}'
check "DELETE /api/faqs/:id" 200 -X DELETE "$BASE/api/faqs/$FAQ_ID" -H "Authorization: Bearer $ADMIN"
check "GET  /api/faqs/:id deleted" 404 "$BASE/api/faqs/$FAQ_ID"

check "POST /api/chat public" 200 "$BASE/api/chat" -H 'content-type: application/json' -H 'x-guest-id: smoke' -d '{"question":"how long does express shipping take"}'
check "POST /api/chat no question" 400 "$BASE/api/chat" -H 'content-type: application/json' -d '{}'
check "POST /api/chat tracking, public" 401 "$BASE/api/chat" -H 'content-type: application/json' -H 'x-guest-id: smoke' -d '{"question":"where is my order"}'
check "POST /api/chat tracking, customer" 200 "$BASE/api/chat" -H 'content-type: application/json' -H "Authorization: Bearer $CUSTOMER" -d '{"question":"where is my order NT-123456"}'

check "GET  /api/history" 200 "$BASE/api/history" -H "Authorization: Bearer $CUSTOMER"
check "GET  /api/history?q=" 200 "$BASE/api/history?q=delivery" -H "Authorization: Bearer $CUSTOMER"
check "GET  /api/history guest" 200 "$BASE/api/history" -H 'x-guest-id: smoke'
check "DELETE /api/history/:id unknown" 404 -X DELETE "$BASE/api/history/000000000000000000000000" -H "Authorization: Bearer $CUSTOMER"
check "DELETE /api/history guest" 200 -X DELETE "$BASE/api/history" -H 'x-guest-id: smoke'

check "GET  /api/dashboard/stats public" 200 "$BASE/api/dashboard/stats" -H 'x-guest-id: smoke'
check "GET  /api/dashboard/stats admin" 200 "$BASE/api/dashboard/stats" -H "Authorization: Bearer $ADMIN"
check "GET  /api/dashboard/recent customer" 403 "$BASE/api/dashboard/recent" -H "Authorization: Bearer $CUSTOMER"
check "GET  /api/dashboard/recent manager" 200 "$BASE/api/dashboard/recent" -H "Authorization: Bearer $MANAGER"

check "GET  /api/users as manager" 403 "$BASE/api/users" -H "Authorization: Bearer $MANAGER"
check "GET  /api/users as admin" 200 "$BASE/api/users" -H "Authorization: Bearer $ADMIN"
check "POST /api/users" 201 "$BASE/api/users" -H "Authorization: Bearer $ADMIN" -H 'content-type: application/json' -d '{"name":"Smoke Agent","email":"smoke.agent@novatrend.com","password":"smoke1234","role":"manager"}'
USER_ID=$(json "['user']['id']" < /tmp/smoke-body)
check "POST /api/users duplicate email" 409 "$BASE/api/users" -H "Authorization: Bearer $ADMIN" -H 'content-type: application/json' -d '{"name":"Smoke Agent","email":"smoke.agent@novatrend.com","password":"smoke1234","role":"manager"}'
check "GET  /api/users/:id" 200 "$BASE/api/users/$USER_ID" -H "Authorization: Bearer $ADMIN"
check "PUT  /api/users/:id" 200 -X PUT "$BASE/api/users/$USER_ID" -H "Authorization: Bearer $ADMIN" -H 'content-type: application/json' -d '{"name":"Smoke Agent Senior"}'
check "DELETE /api/users/:id" 200 -X DELETE "$BASE/api/users/$USER_ID" -H "Authorization: Bearer $ADMIN"

check "GET  /api/orders customer" 200 "$BASE/api/orders" -H "Authorization: Bearer $CUSTOMER"
check "GET  /api/orders/:id other customer" 404 "$BASE/api/orders/NT-555001" -H "Authorization: Bearer $CUSTOMER"
check "GET  /api/orders/:id manager" 200 "$BASE/api/orders/NT-555001" -H "Authorization: Bearer $MANAGER"
check "GET  /api/nope" 404 "$BASE/api/nope"

check "GET  / homepage" 200 "$BASE/"
check "GET  /login.html" 200 "$BASE/login.html"
check "GET  /dashboard.html" 200 "$BASE/dashboard.html"

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
