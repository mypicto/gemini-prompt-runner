import { describe, expect, it } from 'vitest';
import { MessageRouter } from './router.js';

const sender = {} as chrome.runtime.MessageSender;

describe('MessageRouter.dispatch', () => {
  it('登録済みハンドラの戻り値を {ok:true} で包んで返す', async () => {
    const router = new MessageRouter().on('checkQueryParameterDetection', () => ({
      detected: true,
    }));
    const result = await router.dispatch(
      { type: 'checkQueryParameterDetection', payload: undefined },
      sender
    );
    expect(result).toEqual({ ok: true, value: { detected: true } });
  });

  it('ハンドラの例外は {ok:false, error} に変換して送信側へ透過する', async () => {
    const router = new MessageRouter().on('checkQueryParameterDetection', () => {
      throw new Error('handler broke');
    });
    const result = await router.dispatch(
      { type: 'checkQueryParameterDetection', payload: undefined },
      sender
    );
    expect(result).toEqual({ ok: false, error: 'handler broke' });
  });

  it('未登録のメッセージ型は {ok:false} を返す', async () => {
    const result = await new MessageRouter().dispatch(
      { type: 'insertClipboardKeyword', payload: undefined },
      sender
    );
    expect(result.ok).toBe(false);
  });

  it('非同期ハンドラも await して返す', async () => {
    const router = new MessageRouter().on('getGenerateUrl', async () => ({
      url: 'https://example.test/',
    }));
    const result = await router.dispatch(
      {
        type: 'getGenerateUrl',
        payload: { includeModel: true, includePrompt: true, autoSend: false, requiredLogin: false },
      },
      sender
    );
    expect(result).toEqual({ ok: true, value: { url: 'https://example.test/' } });
  });
});
