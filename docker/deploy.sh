#!/bin/sh

DOCKER_IMAGE="$DOCKER_USERNAME/$DOCKER_REPOSITORY:$1"

docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD" && \
  docker build -t $DOCKER_IMAGE . && \
  docker push $DOCKER_IMAGE
