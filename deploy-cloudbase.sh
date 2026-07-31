#!/bin/sh
set -eu

ENV_ID="${1:-twin-start-island-d7dxg7911b0684}"
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DEPLOY_DIR=$(mktemp -d "${TMPDIR:-/tmp}/twin-star-cloudbase.XXXXXX")

cleanup() {
  rm -rf "$DEPLOY_DIR"
}
trap cleanup EXIT INT TERM

for file in \
  index.html \
  styles.css \
  app.js \
  cloud-store.js \
  supabase-config.js \
  world-map.svg \
  乌龙头像.png \
  哈小浪.png
do
  cp "$PROJECT_DIR/$file" "$DEPLOY_DIR/$file"
done

cd "$DEPLOY_DIR"
npx --yes --package=@cloudbase/cli@latest cloudbase hosting deploy . -e "$ENV_ID"
