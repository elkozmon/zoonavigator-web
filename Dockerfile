FROM top20/node:8-alpine as npm
MAINTAINER Lubos Kozmon <lubosh91@gmail.com>

# Make dist files
WORKDIR /app
COPY . .
RUN npm install -g @angular/cli \
  && npm install \
  && ng build --prod

FROM nginx:1.13.5

# Copy setup files
COPY ./docker/copy /

RUN chmod +x \
    /app/run.sh \
    /app/healthcheck.sh

# Add health check
RUN apt-get update \
  && apt-get install -y curl wget \
  && apt-get clean

HEALTHCHECK --interval=5m --timeout=3s \
    CMD /app/healthcheck.sh

# Get dockerize
ENV DOCKERIZE_VERSION v0.6.0
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Copy dist files
COPY --from=npm /app/dist /app

# Default config
ENV SERVER_HTTP_PORT=8000 \
    API_HOST=api \
    API_PORT=9000 \
    API_REQUEST_TIMEOUT_MILLIS=10000

# Expose HTTP port
EXPOSE 8000

CMD ["/app/run.sh"]
