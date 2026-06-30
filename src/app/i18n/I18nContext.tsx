/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import { ptBRMessages, type MessageKey } from "./messages";

type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  locale: "pt-BR";
  t: (key: MessageKey, params?: TranslateParams) => string;
};

function translate(key: MessageKey, params?: TranslateParams) {
  let message: string = ptBRMessages[key];

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
  t: translate,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <i18nContext.Provider
      value={{
        locale: "pt-BR",
        t: translate,
      }}
    >
      {children}
    </i18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(i18nContext);
}
