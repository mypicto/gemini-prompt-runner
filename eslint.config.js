import tseslint from 'typescript-eslint';

/**
 * アーキテクチャ規約を機械的に強制するための最小構成。
 * コードスタイルは扱わない (型チェックは tsc、テストは vitest が担当)。
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'tests/dist/**', 'node_modules/**', 'docs/**', 'public/**'],
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // fire-and-forget async の禁止 (旧 copy-service の未 await バグの再発防止)。
      // 意図的な非待機は `void promise` と書く
      '@typescript-eslint/no-floating-promises': 'error',

      // chrome.* へ直接触れてよいのは shared/platform/** と各 main.ts のみ (下の override 参照)。
      // それ以外は Port インターフェースをコンストラクタ注入で受け取る
      'no-restricted-globals': [
        'error',
        {
          name: 'chrome',
          message:
            'chrome.* は shared/platform/** と main.ts のみ。Port を注入すること (型参照のみの場合はこのファイルを eslint.config.js の許可リストへ)',
        },
      ],

      // sleep() の直値禁止 — 待機時間は TIMING の命名定数で根拠を残す
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='sleep'] > Literal.arguments",
          message: 'sleep() に直値を渡さない。shared/config/timing.ts の命名定数を使うこと',
        },
      ],
    },
  },
  {
    // chrome グローバルの許可リスト: platform 境界・composition root・
    // chrome API の「型」だけを参照するファイル・テスト
    files: [
      'src/shared/platform/**',
      'src/*/main.ts',
      'src/background/external-ping.ts',
      'src/shared/protocol/messages.ts',
      'src/shared/protocol/router.ts',
      '**/*.test.ts',
    ],
    rules: { 'no-restricted-globals': 'off' },
  }
);
