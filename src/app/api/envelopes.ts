import { apiRequest } from "./client";
import type { CategoryOption } from "./categories";
import type { TransactionType } from "./transactions";

export type EnvelopeType = "GLOBAL" | "ALLOWANCE";

export type EnvelopeCategory = {
  id: string;
  name: string;
  color: string | null;
};

export type EnvelopeTransaction = {
  id: string;
  type: TransactionType;
  ownershipType: string;
  sourceType: string;
  description: string;
  amount: number;
  transactionDate: string;
  referenceMonth: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  memberId: string | null;
  memberName: string | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Envelope = {
  id: string;
  name: string;
  type: EnvelopeType;
  ownerMemberId: string | null;
  ownerMemberName: string | null;
  monthlyLimit: number;
  consumedAmount: number;
  remainingAmount: number;
  createdInMonth: string;
  archivedFromMonth: string | null;
  active: boolean;
  categories: EnvelopeCategory[];
  transactions: EnvelopeTransaction[];
};

export type EnvelopeCategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  amount: number;
};

export type EnvelopePayload = {
  name: string;
  type: EnvelopeType;
  ownerMemberId?: string;
  categoryIds?: string[];
  monthlyLimit: number;
};

export type ArchiveEnvelopePayload = {
  archivedFromMonth: string;
};

export function listEnvelopes(referenceMonth: string, accessToken: string) {
  return apiRequest<Envelope[]>(
    `/api/envelopes?referenceMonth=${referenceMonth}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function getEnvelope(
  id: string,
  referenceMonth: string,
  accessToken: string,
) {
  return apiRequest<Envelope>(
    `/api/envelopes/${id}?referenceMonth=${referenceMonth}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function createEnvelope(payload: EnvelopePayload, accessToken: string) {
  return apiRequest<Envelope>("/api/envelopes", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateEnvelope(
  id: string,
  payload: EnvelopePayload,
  accessToken: string,
) {
  return apiRequest<Envelope>(`/api/envelopes/${id}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function archiveEnvelope(
  id: string,
  payload: ArchiveEnvelopePayload,
  accessToken: string,
) {
  return apiRequest<Envelope>(`/api/envelopes/${id}/archive`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function listEnvelopeCategoryBreakdown(
  id: string,
  referenceMonth: string,
  accessToken: string,
) {
  return apiRequest<EnvelopeCategoryBreakdown[]>(
    `/api/envelopes/${id}/category-breakdown?referenceMonth=${referenceMonth}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export type EnvelopeCategoryOption = CategoryOption;
