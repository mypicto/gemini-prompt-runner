import selectorsJson from '../../extension/res/selectors.json';
import { SelectorService } from '../../extension/js/services/selector-service.js';
import { SelectorDomainService } from '../../extension/js/services/selector-domain-service.js';
import { ModelSelector } from '../../extension/js/components/model-selector.js';
import { SendButton } from '../../extension/js/components/send-button.js';
import { Textarea } from '../../extension/js/components/textarea.js';
import { CopyButton } from '../../extension/js/components/copy-button.js';
import { LoginButton } from '../../extension/js/components/login-button.js';
import { MemorySelectorRepository } from './stubs/memory-selector-repository.js';

export async function bootstrap() {
  const domainService = new SelectorDomainService({
    repository: new MemorySelectorRepository(),
    defaultSelectorsLoader: async () => selectorsJson
  });
  const selectorService = new SelectorService({ domainService });
  await selectorService.init();

  const modelSelector = new ModelSelector(selectorService);
  const sendButton = new SendButton(selectorService);
  const textarea = new Textarea(selectorService);
  const copyButton = new CopyButton(selectorService);
  const loginButton = new LoginButton(selectorService);

  async function probe(id, timeoutMs = 1500) {
    try {
      const el = await selectorService.getElement(id, timeoutMs);
      return {
        id,
        found: true,
        tag: el.tagName,
        visible: !!el.offsetParent,
        selector: selectorsJson[id]?.selector ?? null
      };
    } catch (e) {
      return {
        id,
        found: false,
        error: e.message,
        selector: selectorsJson[id]?.selector ?? null
      };
    }
  }

  async function probeAll(ids = Object.keys(selectorsJson), timeoutMs = 1500) {
    const results = [];
    for (const id of ids) {
      results.push(await probe(id, timeoutMs));
    }
    return results;
  }

  return {
    selectorService,
    selectors: selectorsJson,
    modelSelector,
    sendButton,
    textarea,
    copyButton,
    loginButton,
    probe,
    probeAll
  };
}
