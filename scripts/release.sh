#!/usr/bin/env sh

read -p "Enter new release version:" NEW_VERSION \
  && read -p "Enter new development version:" DEV_VERSION \
  && npm version ${NEW_VERSION} -m "Set version to %s" \
  && npm --no-git-tag-version version ${DEV_VERSION} \
  && git add "package*.json" \
  && git commit -m "Set version to $DEV_VERSION" \
  && git push \
  && git push --tags
