#!/bin/bash
PORT=${PORT_OVERRIDE:-3000}
URL="http://localhost:${PORT}/api/public/newsletter"
EMAIL="test_$(date +%s)@example.com"
echo "Testing POST $URL with email=$EMAIL"
set -o pipefail
HTTP_CODE=$(curl -s -o /tmp/newsletter_resp.json -w "%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

echo "HTTP Code: $HTTP_CODE"
cat /tmp/newsletter_resp.json | jq . 2>/dev/null || cat /tmp/newsletter_resp.json

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  grep -q '"success":true' /tmp/newsletter_resp.json && echo "✅ Success" && exit 0
fi

echo "❌ Failure" >&2
exit 1
