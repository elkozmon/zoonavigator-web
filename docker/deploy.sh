#!/bin/sh

DOCKER_TAG="$1"

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin \
  && docker build -t $DOCKER_USERNAME/$DOCKER_REPOSITORY:$DOCKER_TAG . \
  && docker push $DOCKER_USERNAME/$DOCKER_REPOSITORY:$DOCKER_TAG
