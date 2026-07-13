import type { ReactNode } from "react";

export type FilterOption<TValue extends string = string, TRaw = unknown> = {
  value: TValue;
  label: string;
  raw?: TRaw;
};

type FilterFieldBase = {
  label: string;
  placement: "visible" | "expanded";
  element: ReactNode;
};

type TextFilterField = FilterFieldBase & {
  kind: "text";
  value: string;
  defaultValue: string;
};

type SelectFilterField<TValue extends string = string, TRaw = unknown> = FilterFieldBase & {
  kind: "select";
  value: TValue | "";
  defaultValue: TValue | "";
  options: FilterOption<TValue, TRaw>[];
};

type MultiSelectFilterField<TValue extends string = string, TRaw = unknown> = FilterFieldBase & {
  kind: "multi-select";
  value: TValue[];
  defaultValue: TValue[];
  options: FilterOption<TValue, TRaw>[];
};

type FilterFieldDefinition = TextFilterField | SelectFilterField | MultiSelectFilterField;

export type FilterFields = Record<string, FilterFieldDefinition>;
