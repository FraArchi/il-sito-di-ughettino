#!/bin/bash
PORT=${PORT_OVERRIDE:-3000}
URL="http://localhost:${PORT}/api/public/contact"
STAMP=$(date +%s)
cat <<EOF > /tmp/contact_payload.json
{
  "name": "Tester ${STAMP}",
  "email": "tester_${STAMP}@example.com",
  "message": "Messaggio di test ${STAMP}"
}
EOF

echo "Testing POST $URL"
HTTP_CODE=$(curl -s -o /tmp/contact_resp.json -w "%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d @/tmp/contact_payload.json)

echo "HTTP Code: $HTTP_CODE"
cat /tmp/contact_resp.json | jq . 2>/dev/null || cat /tmp/contact_resp.json
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ] && grep -q '"success":true' /tmp/contact_resp.json; then
  echo "✅ Contact Success"; exit 0
else
  echo "❌ Contact Failure" >&2; exit 1
fi
