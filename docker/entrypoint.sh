#!/bin/sh
set -eu

: "${API_BASE_URL:=http://localhost:8080}"

envsubst '${API_BASE_URL}' \
  < /etc/bolso-em-dia/app-config.js.template \
  > /usr/share/nginx/html/app-config.js

exec nginx -g 'daemon off;'
