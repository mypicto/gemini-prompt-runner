import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryParameter } from '../extension/js/utils/query-parameter.js';
import { IdentifierModelQuery, NominalModelQuery } from '../extension/js/models/model-query.js';
import { Model } from '../extension/js/models/model.js';

// URL フラグメントを解析して QueryParameter を生成するテスト

test('generateFromUrl parses fragment parameters', () => {
  const url = 'https://example.com/app#ext-q=Hello%20World&ext-m=1&ext-send=1&ext-clipboard=1&ext-required-login=0';
  const qp = QueryParameter.generateFromUrl(url);
  assert.deepStrictEqual(qp.prompts, ['Hello World']);
  assert.strictEqual(qp.isAutoSend(), true);
  assert.strictEqual(qp.isUseClipboard, true);
  assert.strictEqual(qp.isRequiredLogin(), false);
  const mq = qp.getModelQuery();
  assert.ok(mq instanceof IdentifierModelQuery);
  assert.strictEqual(mq.index, 1);
});

// QueryParameter から URL を構築するテスト

test('buildUrl creates a hash with expected parameters', () => {
  const qp = QueryParameter.generate({
    prompts: ['One', 'Two {{clipboard}}'],
    modelQuery: new IdentifierModelQuery(2),
    isAutoSend: true,
    isUseClipboard: true,
    isRequiredLogin: false
  });
  const result = qp.buildUrl(new URL('https://example.com/app'));
  const resUrl = new URL(result);
  const params = new URLSearchParams(resUrl.hash.slice(1));
  assert.strictEqual(params.get('ext-m'), '2');
  assert.deepStrictEqual(params.getAll('ext-q'), ['One', 'Two {{clipboard}}']);
  assert.strictEqual(params.get('ext-send'), '1');
  assert.strictEqual(params.get('ext-clipboard'), '1');
  assert.strictEqual(params.get('ext-required-login'), '0');
});

// URL から対象パラメータを削除するテスト

test('removeQueryAndFragment cleans target parameters', () => {
  const url = new URL('https://ex.com/app?ext-m=1&foo=bar#ext-q=hi');
  QueryParameter.removeQueryAndFragment(url);
  assert.strictEqual(url.toString(), 'https://ex.com/app?foo=bar');
});

// ModelQuery の比較テスト

test('ModelQuery equality operations', () => {
  const mq1 = new IdentifierModelQuery(1);
  const mq2 = new IdentifierModelQuery(1);
  const nmq = new NominalModelQuery('Gemini Pro');
  const model = new Model(1, 'Gemini Pro');
  assert.ok(mq1.equalsQuery(mq2));
  assert.ok(nmq.equalsModel(model));
});

test('generateFromJson initializes from object', () => {
  const json = {
    prompts: ['Alpha'],
    modelQuery: '3',
    send: true,
    clipboard: false,
    requiredLogin: true,
    queryParameterDetected: true
  };
  const qp = QueryParameter.generateFromJson(json);
  assert.deepStrictEqual(qp.prompts, ['Alpha']);
  assert.ok(qp.getModelQuery() instanceof IdentifierModelQuery);
  assert.strictEqual(qp.getModelQuery().index, 3);
  assert.strictEqual(qp.isAutoSend(), true);
  assert.strictEqual(qp.isUseClipboard, false);
  assert.strictEqual(qp.isRequiredLogin(), true);
  assert.strictEqual(qp.isQueryParameterDetected(), true);
});

test('hasTargetParametersInUrl detects query params', () => {
  const url = new URL('https://ex.com/app?ext-m=2');
  assert.strictEqual(QueryParameter.hasTargetParametersInUrl(url), true);
});

// buildPromptTexts はクリップボードを使用せずに CRLF を LF に変換する

test('buildPromptTexts normalizes line endings', async () => {
  const qp = QueryParameter.generate({
    prompts: ['Line1\r\nLine2'],
    isUseClipboard: false
  });
  const prompts = await qp.buildPromptTexts();
  assert.deepStrictEqual(prompts, ['Line1\nLine2']);
});
