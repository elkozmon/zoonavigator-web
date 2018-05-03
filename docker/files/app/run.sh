#!/bin/sh

echo "Starting ZooNavigator Web $(cat .version)"

# Generate configs
dockerize \
  -template /app/config.json.template:/app/config.json \
  -template /etc/nginx/nginx.conf.template:/etc/nginx/nginx.conf

# Start nginx
nginx -g 'daemon off;' &

# Trap terminate signals
trap 'nginx -s stop' TERM QUIT

# Wait for nginx to terminate
wait
