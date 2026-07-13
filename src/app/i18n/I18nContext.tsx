/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import { enUSMessages } from "./enUSMessages";
import { ptBRMessages, type MessageKey } from "./messages";

export type TranslateParams = Record<string, string | number>;
export type Locale = "pt-BR" | "en-US";
export type Translate = (key: MessageKey, params?: TranslateParams) => string;

type I18nContextValue = {
  locale: Locale;
  t: Translate;
};

function resolveMessages(locale: Locale): Record<MessageKey, string> {
  if (locale === "en-US") {
    return {
      ...ptBRMessages,
      ...enUSMessages,
    };
  }

  return ptBRMessages;
}

function translateMessage(locale: Locale, key: MessageKey, params?: TranslateParams) {
  const messages = resolveMessages(locale);
  let message: string = messages[key];

  if (!params) {
    return message;
  }

  for (const [paramKey, value] of Object.entries(params)) {
    message = message.split(`{{${paramKey}}}`).join(String(value));
  }

  return message;
}

const i18nContext = createContext<I18nContextValue>({
  locale: "pt-BR",
  t: (key, params) => translateMessage("pt-BR", key, params),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const locale = user?.preferences.locale ?? "pt-BR";

  return (
    <i18nContext.Provider
      value={{
        locale,
        t: (key, params) => translateMessage(locale, key, params),
      }}
    >
      {children}
    </i18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(i18nContext);
}
