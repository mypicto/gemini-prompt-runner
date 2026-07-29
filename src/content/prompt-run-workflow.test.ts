import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IconState } from '../shared/config/icons.js';
import { TIMING } from '../shared/config/timing.js';
import { QueryParameter } from '../shared/core/query-parameter.js';
import type { IconReporting } from './icon-reporter.js';
import { PromptRunWorkflow } from './prompt-run-workflow.js';

/**
 * 送信ボタンのフェイク。answering (stop 状態) をテスト側で任意に制御する。
 * `neverCompletes: true` で「応答が終わらない長時間生成」を再現する。
 */
class FakeSendButton {
  submitCount = 0;
  #answering = false;
  constructor(private readonly opts: { neverCompletes: boolean }) {}

  async submit(): Promise<void> {
    this.submitCount += 1;
    this.#answering = true;
    if (!this.opts.neverCompletes) {
      // 数ポーリングで応答完了 (stop クラスが外れる) するケース
      setTimeout(() => {
        this.#answering = false;
      }, TIMING.answerPollIntervalMs * 2);
    }
  }

  async isAnswering(): Promise<boolean> {
    return this.#answering;
  }
}

function createDeps(sendButton: FakeSendButton) {
  const iconStates: IconState[] = [];
  const iconReporter: IconReporting = { report: (state) => iconStates.push(state) };
  const textarea = { setPrompt: vi.fn(async () => {}) };
  const deps = {
    assembler: { assemble: vi.fn(async (p: QueryParameter) => [...(p.prompts ?? [])]) },
    pageReady: { waitUntilReady: vi.fn(async () => true) },
    textarea,
    sendButton,
    modelMenu: { getCurrentModelQuery: vi.fn(), selectModel: vi.fn() },
    loginLink: { exists: () => false, click: vi.fn(async () => false) },
    iconReporter,
    isOnGemPage: () => false,
  };
  // page オブジェクトの一部メソッドのみ使うため型は緩めて注入する
  return { deps: deps as unknown as ConstructorParameters<typeof PromptRunWorkflow>[0], iconStates, textarea };
}

function autoSendParam(prompts: string[]): QueryParameter {
  return QueryParameter.generate({ prompts, isAutoSend: true });
}

/** 出現待ち + 完了待ち上限 + アイコンリセット遅延をすべて跨いでタイマーを消化する */
async function advancePastEntireRun(): Promise<void> {
  await vi.advanceTimersByTimeAsync(
    TIMING.answerStateAppearTimeoutMs + TIMING.answerCompleteTimeoutMs + TIMING.iconResetDelayMs
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PromptRunWorkflow: 長時間応答でのフェイルオープン', () => {
  it('応答が完了上限を超えても run() は reject せず、アイコンをデフォルトに戻す', async () => {
    const sendButton = new FakeSendButton({ neverCompletes: true });
    const { deps, iconStates } = createDeps(sendButton);
    const workflow = new PromptRunWorkflow(deps);

    const promise = workflow.run(autoSendParam(['long prompt']));
    // 完了待ち上限 + アイコンリセット遅延を跨いで全タイマーを消化する
    await advancePastEntireRun();
    await expect(promise).resolves.toBeUndefined();

    expect(sendButton.submitCount).toBe(1);
    expect(iconStates.at(-1)).toEqual({ kind: 'default' });
  });

  it('自動送信列で 1 つ目の応答が未完了なら 2 つ目は送信しない', async () => {
    const sendButton = new FakeSendButton({ neverCompletes: true });
    const { deps } = createDeps(sendButton);
    const workflow = new PromptRunWorkflow(deps);

    const promise = workflow.run(autoSendParam(['first', 'second']));
    await advancePastEntireRun();
    await promise;

    expect(sendButton.submitCount).toBe(1);
  });
});

describe('PromptRunWorkflow: ハッピーパス', () => {
  it('応答が完了する場合はプロンプトを投入・送信し正常終了する', async () => {
    const sendButton = new FakeSendButton({ neverCompletes: false });
    const { deps, textarea, iconStates } = createDeps(sendButton);
    const workflow = new PromptRunWorkflow(deps);

    const promise = workflow.run(autoSendParam(['hi']));
    await advancePastEntireRun();
    await expect(promise).resolves.toBeUndefined();

    expect(textarea.setPrompt).toHaveBeenCalledWith('hi');
    expect(sendButton.submitCount).toBe(1);
    expect(iconStates.at(-1)).toEqual({ kind: 'default' });
  });
});
