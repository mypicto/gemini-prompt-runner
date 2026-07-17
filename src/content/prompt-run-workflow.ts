import { sleep, waitFor, waitForQuiet } from '../shared/async/wait-for.js';
import { TIMING } from '../shared/config/timing.js';
import type { ModelQuery } from '../shared/core/model-query.js';
import type { QueryParameter } from '../shared/core/query-parameter.js';
import type { IconReporting } from './icon-reporter.js';
import type { LoginLink } from './page/login-link.js';
import type { ModelMenu } from './page/model-menu.js';
import type { PageReady } from './page/page-ready.js';
import type { PromptTextarea } from './page/prompt-textarea.js';
import type { SendButton } from './page/send-button.js';
import { ProgressTracker } from './progress-tracker.js';
import type { PromptAssembler } from './prompt-assembler.js';

/**
 * URL パラメータに従った一連の操作手順:
 * ログイン確認 → モデル選択 → プロンプト投入 → 自動送信 → 応答完了待ち。
 * 進捗はツールバーアイコンに反映する。
 */
export class PromptRunWorkflow {
  constructor(
    private readonly deps: {
      assembler: PromptAssembler;
      pageReady: PageReady;
      textarea: PromptTextarea;
      sendButton: SendButton;
      modelMenu: ModelMenu;
      loginLink: LoginLink;
      iconReporter: IconReporting;
      /** Gem ページにはモデル切替 UI が無いため、モデル選択をスキップする判定 */
      isOnGemPage: () => boolean;
    }
  ) {}

  async run(parameter: QueryParameter): Promise<void> {
    const prompts = await this.deps.assembler.assemble(parameter);
    const detected = parameter.isQueryParameterDetected();

    if (detected) {
      // クエリ形式はサーバに漏れた可能性があるため、進捗ではなく警告を表示し続ける
      this.deps.iconReporter.report({ kind: 'warning' });
    }

    const progress = ProgressTracker.forPrompts(
      this.deps.iconReporter,
      prompts.length,
      detected
    );
    try {
      progress.reportInitial();
      await this.#execute(parameter, prompts, progress);
    } finally {
      if (!detected) {
        await sleep(TIMING.iconResetDelayMs);
        this.deps.iconReporter.report({ kind: 'default' });
      }
    }
  }

  async #execute(
    parameter: QueryParameter,
    prompts: readonly string[],
    progress: ProgressTracker
  ): Promise<void> {
    if (parameter.isRequiredLogin() && (await this.#redirectToLoginIfNeeded())) {
      return; // ログインページへ遷移するので以降の操作は行わない
    }

    const modelQuery = parameter.getModelQuery();
    if (modelQuery !== null && !this.deps.isOnGemPage()) {
      await this.#switchModelIfNeeded(modelQuery);
    }
    progress.increment();

    if (prompts.length > 0) {
      await this.#runPrompts(prompts, parameter.isAutoSend() === true, progress);
    }
  }

  /** @returns ログインページへの遷移を開始したか */
  async #redirectToLoginIfNeeded(): Promise<boolean> {
    if (!this.deps.loginLink.exists()) {
      return false;
    }
    return this.deps.loginLink.click();
  }

  async #switchModelIfNeeded(modelQuery: ModelQuery): Promise<void> {
    const current = await this.deps.modelMenu.getCurrentModelQuery();
    if (modelQuery.matchesCurrent(current)) {
      return; // 既に目的のモデルが選択されている (短縮表記の揺れも考慮済み)
    }
    await this.deps.modelMenu.selectModel(modelQuery);
    await this.deps.pageReady.waitUntilReady();
  }

  async #runPrompts(
    prompts: readonly string[],
    autoSend: boolean,
    progress: ProgressTracker
  ): Promise<void> {
    for (const prompt of prompts) {
      await this.#runPrompt(prompt, autoSend, progress);
      if (!autoSend) {
        break; // 自動送信しない場合は先頭のプロンプトだけ投入してユーザーに委ねる
      }
    }
  }

  async #runPrompt(
    prompt: string,
    autoSend: boolean,
    progress: ProgressTracker
  ): Promise<void> {
    if (prompt.trim() === '') {
      return;
    }
    await this.deps.textarea.setPrompt(prompt);
    if (!autoSend) {
      return;
    }
    await this.deps.pageReady.waitUntilReady();
    progress.increment();
    await this.deps.sendButton.submit();
    await this.#waitForAnswerToComplete();
    progress.increment();
  }

  async #waitForAnswerToComplete(): Promise<void> {
    // 送信ボタンが「応答中」(stop) 表示に変わるまで僅かな遅延があるため、まず出現を待つ。
    // 出現しないまま猶予が切れた場合 (応答が一瞬で完了した等) はそのまま次の判定へ進む
    await waitForQuiet(() => this.deps.sendButton.isAnswering(), {
      timeoutMs: TIMING.answerStateAppearTimeoutMs,
      intervalMs: TIMING.answerPollIntervalMs,
    });
    await waitFor(async () => !(await this.deps.sendButton.isAnswering()), {
      timeoutMs: TIMING.answerCompleteTimeoutMs,
      intervalMs: TIMING.answerPollIntervalMs,
      description: 'answer to complete (send button leaving the answering state)',
    });
  }
}
