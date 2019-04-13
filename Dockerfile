FROM node:9.11.1-alpine as npm
MAINTAINER Lubos Kozmon <lubosh91@gmail.com>

# Arguments
ARG DOCKERIZE_VERSION=0.6.1
ARG BASE_HREF="/"

# Validate base href
RUN echo ${BASE_HREF} | grep -Eq '^\/(.*\/)?$' || (>&2 echo "BASE_HREF must start and end with a forward slash" && exit 1)

# Copy source code
WORKDIR /src
COPY . .

# Install required packages
RUN apk --no-cache add tar curl gettext python-dev make g++

# Install dependencies & build
RUN npm install -g @angular/cli \
  && npm install \
  && ng build --prod --base-href ${BASE_HREF}

# Update nginx config
RUN envsubst '${BASE_HREF}' \
    < docker/files/etc/nginx/nginx.conf.template \
    > docker/files/etc/nginx/nginx.conf.template.sub \
  && mv -f \
    docker/files/etc/nginx/nginx.conf.template.sub \
    docker/files/etc/nginx/nginx.conf.template

# Make scripts executable
RUN chmod +x \
  docker/files/app/run.sh \
  docker/files/app/healthcheck.sh

# Get dockerize
RUN curl \
    -Lo dockerize-alpine-linux-amd64-v${DOCKERIZE_VERSION}.tar.gz \
    https://github.com/jwilder/dockerize/releases/download/v${DOCKERIZE_VERSION}/dockerize-alpine-linux-amd64-v${DOCKERIZE_VERSION}.tar.gz \
  && tar xzvf dockerize-alpine-linux-amd64-v${DOCKERIZE_VERSION}.tar.gz -C /usr/local/bin

FROM nginxinc/nginx-unprivileged:1.14.2-alpine

# The unprivileged nginx Dockerfile switches to user 1001
# We switch back to root during the build process
USER root

# Default config
ENV WEB_HTTP_PORT=8000 \
  API_HOST=api \
  API_PORT=9000 \
  API_REQUEST_TIMEOUT_MILLIS=10000

# Copy app files
COPY --from=npm /usr/local/bin/dockerize /usr/local/bin/dockerize
COPY --from=npm /src/docker/files /
COPY --from=npm /src/dist /app/public

WORKDIR /app

# Install curl
RUN apk --no-cache add curl

# We need to ensure that user 1001 has read on everything we installed
RUN chown -R 1001 /app/public
RUN chown 1001 /etc/nginx/nginx.conf

# Now that we are done with the image build, we switch back to user 1001
USER 1001

# Add health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD ./healthcheck.sh

# Expose default HTTP port
EXPOSE 8000

CMD ["./run.sh"]
