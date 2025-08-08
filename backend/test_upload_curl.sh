#!/bin/bash
PORT=${PORT_OVERRIDE:-3000}
URL="http://localhost:${PORT}/api/public/upload"
TMPFILE=$(mktemp /tmp/ugo_test_img_XXXXXX.png)
# Create a small dummy png file
printf '\211PNG\r\n\032\n' > "$TMPFILE"
# Add minimal IHDR + IEND (fake small file)
printf '\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xDE\x00\x00\x00\x00IEND\xAEB`\x82' >> "$TMPFILE"

HTTP_CODE=$(curl -s -o /tmp/upload_resp.json -w "%{http_code}" -X POST "$URL" \
  -F "file=@${TMPFILE};type=image/png")

echo "Testing POST $URL (file=$TMPFILE)" 
echo "HTTP Code: $HTTP_CODE"
cat /tmp/upload_resp.json | jq . 2>/dev/null || cat /tmp/upload_resp.json
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ] && grep -q '"success":true' /tmp/upload_resp.json; then
  echo "✅ Upload Success"; exit 0
else
  echo "❌ Upload Failure" >&2; exit 1
fi
