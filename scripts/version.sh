#!/usr/bin/env sh

VERSION=$1
VERSION_FILE=src/app/app.version.ts

echo -e "// This file was generated on $(date --iso-8601=seconds)\nexport const APP_VERSION = \"$VERSION\";" > $VERSION_FILE
git add $VERSION_FILE
