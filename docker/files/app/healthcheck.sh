#!/bin/sh

# TODO Remove 'SERVER_HTTP_PORT' in 1.0.0
curl -f http://localhost:${SERVER_HTTP_PORT:-$WEB_HTTP_PORT}/health || exit 1
