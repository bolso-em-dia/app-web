import { ApiError } from "../app/api/client";
import type { Translate } from "../app/i18n/I18nContext";
import type { MessageKey } from "../app/i18n/messages";

export const ERROR_CODE_MAP: Record<number, MessageKey> = {
  40001: "error.validationFailed",
  40002: "error.invalidRequestBody",
  40003: "error.unrecognizedField",
  40004: "error.invalidParameter",
  40005: "error.invalidPageSize",
  40006: "error.dueDayRequired",
  40007: "error.fieldCannotBeEmpty",
  40101: "error.notAuthenticated",
  40102: "error.invalidCredentials",
  40103: "error.sessionExpired",
  40104: "error.sessionExpired",
  40105: "error.accountDeactivated",
  40106: "error.authenticationRequired",
  40301: "error.accessDenied",
  40302: "error.accessDenied",
  40401: "error.accountNotFound",
  40402: "error.budgetNotFound",
  40403: "error.categoryNotFound",
  40404: "error.memberNotFound",
  40405: "error.fixedTransactionNotFound",
  40406: "error.transactionNotFound",
  40407: "error.noExchangeRateData",
  40901: "error.emailInUse",
  40902: "error.duplicateAllowance",
  40903: "error.concurrentModification",
  42201: "error.archiveBeforeAccountCreation",
  42202: "error.creditCardRequiresDays",
  42203: "error.nonCreditCardDays",
  42204: "error.replacementCategorySame",
  42205: "error.replacementCategoryInactive",
  42206: "error.archiveBeforeCategoryCreation",
  42207: "error.archiveBeforeBudgetCreation",
  42208: "error.allowanceRequiresOwner",
  42209: "error.globalBudgetRequiresCategory",
  42210: "error.individualRequiresMember",
  42211: "error.individualRequiresAllowance",
  42212: "error.installmentCountRange",
  42213: "error.installmentPlanTooLong",
  42214: "error.exchangeRateUnavailable",
  42215: "error.foreignCurrencyDisabled",
  42216: "error.incorrectCurrentPassword",
  42217: "error.passwordConfirmationMismatch",
  42218: "error.unsupportedLocale",
  42219: "error.defaultAccountInactive",
  42220: "error.dayOutOfRange",
  50001: "error.unexpected",
  50201: "error.exchangeRateFetchFailed",
  50202: "error.exchangeRateServiceDown",
};

const FALLBACK_MAP: Partial<Record<ApiError["status"], MessageKey>> = {
  400: "error.validationFallback",
  401: "error.authFallback",
  403: "error.forbiddenFallback",
  404: "error.notFoundFallback",
  409: "error.conflictFallback",
  422: "error.businessRuleFallback",
  500: "error.internalFallback",
  502: "error.externalServiceFallback",
};

export function formErrorFrom(exception: unknown, genericKey: MessageKey, t: Translate) {
  if (!(exception instanceof ApiError)) {
    return t(genericKey);
  }

  if (exception.code !== null) {
    const mappedKey = ERROR_CODE_MAP[exception.code];
    if (mappedKey) {
      return t(mappedKey);
    }
  }

  const fallbackKey = FALLBACK_MAP[exception.status];
  if (fallbackKey) {
    return t(fallbackKey);
  }

  return t(genericKey);
}
