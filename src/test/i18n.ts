import type { TranslateParams } from "../app/i18n/I18nContext";
import { ptBRMessages, type MessageKey } from "../app/i18n/messages";

export function t(key: MessageKey, params?: TranslateParams) {
  let message: string = ptBRMessages[key];

  if (!params) {
    return message;
  }

  for (const [paramKey, value] of Object.entries(params)) {
    message = message.split(`{{${paramKey}}}`).join(String(value));
  }

  return message;
}
