FROM node:9.11.1-alpine as npm
MAINTAINER Lubos Kozmon <lubosh91@gmail.com>

ARG DOCKERIZE_VERSION=0.6.1

# Copy source code
WORKDIR /src
COPY . .

# Install required packages
RUN apk --no-cache add tar curl

# Install dependencies & build
RUN npm install -g @angular/cli \
  && npm install \
  && ng build --prod

# Make scripts executable
RUN chmod +x \
  docker/files/app/run.sh \
  docker/files/app/healthcheck.sh

# Get dockerize
RUN curl \
    -Lo dockerize-alpine-linux-amd64-v$DOCKERIZE_VERSION.tar.gz \
    https://github.com/jwilder/dockerize/releases/download/v$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-v$DOCKERIZE_VERSION.tar.gz \
  && tar xzvf dockerize-alpine-linux-amd64-v$DOCKERIZE_VERSION.tar.gz -C /usr/local/bin

FROM nginx:1.13.12-alpine

# Default config
ENV WEB_HTTP_PORT=8000 \
  API_HOST=api \
  API_PORT=9000 \
  API_REQUEST_TIMEOUT_MILLIS=10000

# Copy app files
COPY --from=npm /usr/local/bin/dockerize /usr/local/bin/dockerize
COPY --from=npm /src/docker/files /
COPY --from=npm /src/dist /app

WORKDIR /app

# Install curl
RUN apk --no-cache add curl

# Add health check
HEALTHCHECK --interval=5m --timeout=3s \
    CMD ./healthcheck.sh

# Expose default HTTP port
EXPOSE 8000

CMD ["./run.sh"]
