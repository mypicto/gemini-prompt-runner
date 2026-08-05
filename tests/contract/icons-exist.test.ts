import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_ICON, WARNING_ICON, iconPathFor } from '../../src/shared/config/icons.js';

// icons.ts の root 相対パスが public/ の実ファイルと一致することを検証する
// (パスの typo は実行時にしか気付けないため)。

function assertExists(iconPath: string): void {
  const file = join('public', iconPath);
  expect(existsSync(file), `${file} が存在しない`).toBe(true);
}

describe('アイコンパスの実在', () => {
  it('default / warning アイコンが public/images に実在する', () => {
    assertExists(DEFAULT_ICON);
    assertExists(WARNING_ICON);
  });

  it('progress アイコン (10..100%) がすべて実在する', () => {
    for (let percent = 10; percent <= 100; percent += 10) {
      assertExists(iconPathFor({ kind: 'progress', percent }));
    }
  });
});
