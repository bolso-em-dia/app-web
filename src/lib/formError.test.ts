import { describe, expect, it } from "vitest";
import { ApiError } from "../app/api/client";
import { t } from "../test/i18n";
import { formErrorFrom, ERROR_CODE_MAP } from "./formError";

describe("formErrorFrom", () => {
  it("maps known backend error codes to translated messages", () => {
    const error = new ApiError(404, 40403, "Category not found.", "Not Found");

    expect(ERROR_CODE_MAP[40403]).toBe("error.categoryNotFound");
    expect(formErrorFrom(error, "categories.saveError", t)).toBe(t("error.categoryNotFound"));
  });

  it("falls back by status when the backend code is unknown", () => {
    const error = new ApiError(422, 42999, "Unknown rule violation.", "Unprocessable Entity");

    expect(formErrorFrom(error, "categories.saveError", t)).toBe(t("error.businessRuleFallback"));
  });

  it("falls back to the generic form message when the error is not an ApiError", () => {
    expect(formErrorFrom(new Error("boom"), "categories.saveError", t)).toBe(t("categories.saveError"));
  });
});
