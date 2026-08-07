#!/bin/sh
set -eu

ENV_ID="twin-start-island-d7dxg7911b0684"
TARGET="${1:---english}"
MODE="${2:---full}"
case "$TARGET" in
  --english) CLOUD_PATH="english" ;;
  --main) CLOUD_PATH="" ;;
  *)
    echo "仅支持 --english（验收路径）或 --main（正式主入口）。" >&2
    exit 2
    ;;
esac
case "$MODE" in
  --full|--code-only) ;;
  *)
    echo "发布模式只支持 --full 或 --code-only。" >&2
    exit 2
    ;;
esac
if [ "$#" -gt 2 ]; then
  echo "发布命令最多接受目标和发布模式两个参数。" >&2
  exit 2
fi
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DEPLOY_DIR=$(mktemp -d "${TMPDIR:-/tmp}/twin-star-cloudbase.XXXXXX")

cleanup() {
  rm -rf "$DEPLOY_DIR"
}
trap cleanup EXIT INT TERM

python3 "$PROJECT_DIR/scripts/generate-course-plan-catalog.py" --check
python3 "$PROJECT_DIR/scripts/generate-summer-plan-content.py" --check
node "$PROJECT_DIR/scripts/generate-learning-module-catalog.mjs" --check
if [ "$MODE" = "--full" ]; then
  node "$PROJECT_DIR/scripts/build-english-course.mjs"
  node "$PROJECT_DIR/scripts/generate-phonics-word-audio.mjs"
  node "$PROJECT_DIR/scripts/apply-phonics-audio-review.mjs" --auto-approve-tts
fi

for file in \
  index.html \
  styles.css \
  app.js \
  learning-modules.js \
  family-task-schedules.js \
  course-releases.js \
  learning-plan-presets.js \
  legacy-learning-plan.js \
  summer-plan-progress.js \
  cloud-store.js \
  state-migration-core.js \
  audio-store.js \
  week1-course-core.js \
  week1-course-ui.js \
  supabase-config.js \
  world-map.svg \
  乌龙头像.png \
  哈小浪.png
do
  cp "$PROJECT_DIR/$file" "$DEPLOY_DIR/$file"
done

if [ "$MODE" = "--full" ]; then
  cp -R "$PROJECT_DIR/course-audio" "$DEPLOY_DIR/course-audio"

  mkdir -p "$DEPLOY_DIR/curriculum"
  for file in \
    learning-module-catalog.js \
    course-plan-catalog.json \
    summer-plan-content.json \
    summer-plan-content.js \
    english-course.json \
    week1-course.json \
    opw-week1-review-queue.json
  do
    cp "$PROJECT_DIR/curriculum/$file" "$DEPLOY_DIR/curriculum/$file"
  done
fi

cd "$DEPLOY_DIR"
if [ -n "$CLOUD_PATH" ]; then
  npx --yes --package=@cloudbase/cli@latest cloudbase hosting deploy . "$CLOUD_PATH" -e "$ENV_ID"
else
  npx --yes --package=@cloudbase/cli@latest cloudbase hosting deploy . -e "$ENV_ID"
fi
