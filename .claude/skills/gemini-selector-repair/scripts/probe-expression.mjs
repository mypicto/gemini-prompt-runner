#!/usr/bin/env node
// selectors.json の全 ID を一括プローブする 1 行の JS 式を出力する。
// 出力を `orca eval --expression '<出力>' --json` にそのまま貼って使う
// ($(...) で渡すとサンドボックス除外が効かず EPERM になるため、貼り付け前提)。
//
// 使い方:
//   node .claude/skills/gemini-selector-repair/scripts/probe-expression.mjs [id ...]
//   引数なしで全 ID、ID を並べるとその ID だけ。
//
// 各 ID の結果: { n: 一致件数, first: 先頭要素の tag.class, text: 先頭のテキスト冒頭 }
// modelListLabel は modelListButton の各項目内で引いた一覧 (items) も返す。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const selectorsPath = resolve(here, '../../../../src/shared/config/selectors.json');
const all = JSON.parse(readFileSync(selectorsPath, 'utf8'));

const wanted = process.argv.slice(2);
const ids = wanted.length > 0 ? wanted : Object.keys(all);
for (const id of ids) {
  if (!all[id]) {
    console.error(`unknown selector id: ${id}`);
    process.exit(1);
  }
}
const table = Object.fromEntries(ids.map((id) => [id, all[id].selector]));

const body = `(()=>{const S=${JSON.stringify(table)};const d=e=>e?(e.tagName.toLowerCase()+"."+String(e.className).trim().split(/\\s+/).slice(0,3).join(".")):null;const t=e=>e?e.textContent.trim().replace(/\\s+/g," ").slice(0,40):null;const r={};for(const[k,s]of Object.entries(S)){const l=[...document.querySelectorAll(s)];r[k]={n:l.length,first:d(l[0]),text:t(l[0])};}if(S.modelListLabel){const b=[...document.querySelectorAll(${JSON.stringify(all.modelListButton.selector)})];r.modelListLabel.items=b.map((e,i)=>i+":"+t(e.querySelector(S.modelListLabel)));}return JSON.stringify({url:location.href,r});})()`;

// シェルのシングルクォートで囲んで貼る想定なので、式にシングルクォートが入ってはいけない
if (body.includes("'")) {
  console.error("error: generated expression contains a single quote (does a selector use ' ?). Rewrite that selector with double quotes first.");
  process.exit(1);
}
process.stdout.write(body + '\n');
