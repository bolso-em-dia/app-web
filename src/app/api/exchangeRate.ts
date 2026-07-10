import { apiRequest } from "./client";

export type ExchangeRateData = {
  rate: number;
  fetchedAt: string;
  stale: boolean;
};

export function getLatestExchangeRate(accessToken: string) {
  return apiRequest<ExchangeRateData>("/api/exchange-rate/latest", {
    method: "GET",
    accessToken,
  });
}

export function refreshExchangeRate(accessToken: string) {
  return apiRequest<ExchangeRateData>("/api/exchange-rate/refresh", {
    method: "POST",
    accessToken,
  });
}
