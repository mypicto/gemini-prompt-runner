import { describe, expect, it } from 'vitest';
import { QueryParameter } from '../shared/core/query-parameter.js';
import type { ClipboardPort } from '../shared/platform/clipboard.js';
import { PromptAssembler } from './prompt-assembler.js';

function clipboardWith(text: string | Error): ClipboardPort {
  return {
    read: async () => {
      if (text instanceof Error) {
        throw text;
      }
      return text;
    },
    write: async () => {},
  };
}

describe('PromptAssembler', () => {
  it('prompts が null なら空配列', async () => {
    const assembler = new PromptAssembler(clipboardWith(''));
    expect(await assembler.assemble(QueryParameter.generate())).toEqual([]);
  });

  it('CRLF/CR を LF に正規化する', async () => {
    const assembler = new PromptAssembler(clipboardWith(''));
    const parameter = QueryParameter.generate({ prompts: ['a\r\nb\rc'] });
    expect(await assembler.assemble(parameter)).toEqual(['a\nb\nc']);
  });

  it('isUseClipboard 時に {{clipboard}} をクリップボード内容へ置換する', async () => {
    const assembler = new PromptAssembler(clipboardWith('CLIP'));
    const parameter = QueryParameter.generate({
      prompts: ['before {{clipboard}} after'],
      isUseClipboard: true,
    });
    expect(await assembler.assemble(parameter)).toEqual(['before CLIP after']);
  });

  it('isUseClipboard でなければ {{clipboard}} をそのまま残す', async () => {
    const assembler = new PromptAssembler(clipboardWith('CLIP'));
    const parameter = QueryParameter.generate({ prompts: ['keep {{clipboard}}'] });
    expect(await assembler.assemble(parameter)).toEqual(['keep {{clipboard}}']);
  });

  it('クリップボード読み取り失敗時は空文字で置換する', async () => {
    const assembler = new PromptAssembler(clipboardWith(new Error('denied')));
    const parameter = QueryParameter.generate({
      prompts: ['x{{clipboard}}y'],
      isUseClipboard: true,
    });
    expect(await assembler.assemble(parameter)).toEqual(['xy']);
  });
});
