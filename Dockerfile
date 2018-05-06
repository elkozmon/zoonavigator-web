FROM node:9.11.1-alpine as npm
MAINTAINER Lubos Kozmon <lubosh91@gmail.com>

# Copy source code
WORKDIR /src
COPY . .

# Install dependencies & build
RUN apk --no-cache add tar \
  && npm install -g @angular/cli \
  && npm install \
  && ng build --prod

FROM nginx:1.13.12-alpine

# Default config
ENV DOCKERIZE_VERSION=v0.6.0 \
  SERVER_HTTP_PORT=8000 \
  API_HOST=api \
  API_PORT=9000 \
  API_REQUEST_TIMEOUT_MILLIS=10000

# Copy app files
COPY --from=npm /src/docker/files /
COPY --from=npm /src/dist /app

WORKDIR /app

RUN apk --no-cache add curl tar \
  # Get dockerize
  && curl \
    -Lo dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && tar xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz -C /usr/local/bin \
  && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  # Make scripts executable
  && chmod +x \
    run.sh \
    healthcheck.sh \
  # Clean up
  && apk del tar

# Add health check
HEALTHCHECK --interval=5m --timeout=3s \
    CMD ./healthcheck.sh

# Expose HTTP port
EXPOSE 8000

CMD ["./run.sh"]
