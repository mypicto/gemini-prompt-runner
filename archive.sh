#!/bin/bash
# Chrome Web Store 提出用 zip を生成する。
# 事前に `npm run build` 済みであること (`npm run package` が build → 本スクリプトを保証する)。
set -euo pipefail

current_dir_name="$(basename "$(pwd)")"
zip_name="${current_dir_name}.zip"
staging="tmp/${current_dir_name}"

if [ ! -f dist/manifest.json ]; then
  echo "error: dist/ がありません。先に npm run build を実行してください" >&2
  exit 1
fi

rm -rf tmp "$zip_name"
mkdir -p "$staging"
cp -r dist/* "$staging/"
cp LICENSE "$staging/"

(cd tmp && zip -r -X "../$zip_name" . -x "*.DS_Store")
rm -rf tmp
