#!/bin/sh

DOCKER_IMAGE="$DOCKER_USERNAME/$DOCKER_REPOSITORY"
DOCKER_TAG="$1"

docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD" && \
  docker build -t $DOCKER_IMAGE . && \
  docker push $DOCKER_IMAGE && \
  docker tag $DOCKER_IMAGE $DOCKER_IMAGE:$DOCKER_TAG && \
  docker push $DOCKER_IMAGE:$DOCKER_TAG
