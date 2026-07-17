import { CLIPBOARD_KEYWORD } from '../shared/config/ext-params.js';
import { QueryParameter } from '../shared/core/query-parameter.js';
import type { MessageHandler } from '../shared/protocol/router.js';
import type { DetectionState } from './detection-state.js';
import type { ModelMenu } from './page/model-menu.js';
import type { PromptTextarea } from './page/prompt-textarea.js';

/** popup の「共有 URL を生成」: 現在のプロンプト/モデルから URL を組み立てる */
export function createGenerateUrlHandler(deps: {
  textarea: PromptTextarea;
  modelMenu: ModelMenu;
  location: Location;
}): MessageHandler<'getGenerateUrl'> {
  return async (request) => {
    const prompt = request.includePrompt ? await deps.textarea.getPrompt() : null;
    const modelQuery = request.includeModel
      ? await deps.modelMenu.getCurrentModelQuery()
      : null;
    const parameter = QueryParameter.generate({
      prompts: prompt ? [prompt] : null,
      modelQuery,
      isAutoSend: request.autoSend,
      isUseClipboard: null,
      isRequiredLogin: request.requiredLogin ? true : null,
    });
    return { url: parameter.buildUrl(deps.location) };
  };
}

/** popup の「クリップボード挿入」: カーソル位置にプレースホルダを挿入する */
export function createInsertClipboardKeywordHandler(
  textarea: PromptTextarea
): MessageHandler<'insertClipboardKeyword'> {
  return async () => {
    await textarea.insertTextAtCursor(CLIPBOARD_KEYWORD);
  };
}

/** popup の警告表示: クエリ形式パラメータを検出したかを返す */
export function createDetectionHandler(
  state: DetectionState
): MessageHandler<'checkQueryParameterDetection'> {
  return () => ({ detected: state.detected });
}
