import type { Translate } from "../../app/i18n/I18nContext";
import type { MessageKey } from "../../app/i18n/messages";

type ValidationMessageKey = Extract<MessageKey, `validation.${string}`>;

export function validationMessage(t: Translate, key: ValidationMessageKey) {
  return t(key);
}
