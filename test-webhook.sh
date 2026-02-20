#!/bin/bash

# Test Webhook Server
# Usage: ./test-webhook.sh [webhook-url] [secret]

WEBHOOK_URL=${1:-"http://localhost:9000/webhook"}
SECRET=${2:-"change-this-webhook-secret-key"}

# Sample GitHub push payload
PAYLOAD='{
  "ref": "refs/heads/main",
  "repository": {
    "full_name": "test/outsystems-exam"
  },
  "pusher": {
    "name": "test-user"
  },
  "commits": [
    {
      "message": "Test deployment"
    }
  ]
}'

echo "Testing webhook..."
echo "URL: $WEBHOOK_URL"
echo "Payload: $PAYLOAD"
echo ""

# Calculate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')
FULL_SIGNATURE="sha256=$SIGNATURE"

echo "Signature: $FULL_SIGNATURE"
echo ""

# Send request
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: $FULL_SIGNATURE" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "SUCCESS: Webhook triggered successfully"
  exit 0
else
  echo "FAILED: Webhook returned HTTP $HTTP_CODE"
  exit 1
fi
