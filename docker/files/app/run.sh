#!/bin/sh

# Handle deprecated config
# TODO Remove in 1.0.0
[ -n "$SERVER_HTTP_PORT" ] \
  && echo "'SERVER_HTTP_PORT' configuration variable is deprecated. It will be removed in version 1.0.0. Use 'WEB_HTTP_PORT' instead." \
  && WEB_HTTP_PORT=$SERVER_HTTP_PORT

# Generate configs
dockerize \
  -template /app/config.json.template:/app/public/config.json \
  -template /etc/nginx/nginx.conf.template:/etc/nginx/nginx.conf

# Start nginx
nginx -g 'daemon off;' &

# Trap terminate signals
trap 'nginx -s stop' TERM QUIT

# Wait for nginx to terminate
wait
