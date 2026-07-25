import { resolveApiBaseUrl } from "./client";

export type VersionResponse = {
  version: string;
};

export async function getApiVersion() {
  const response = await fetch(`${resolveApiBaseUrl()}/api/version`, {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const bodyText = (await response.text()).trim();

  if (!bodyText || contentType.includes("text/html") || looksLikeHtml(bodyText)) {
    return null;
  }

  return parseVersionResponse(bodyText);
}

function looksLikeHtml(value: string) {
  return /^<!doctype html>|^<html[\s>]/i.test(value);
}

function parseVersionResponse(bodyText: string): VersionResponse | null {
  try {
    const parsed = JSON.parse(bodyText) as unknown;

    if (typeof parsed === "object" && parsed !== null && typeof (parsed as { version?: unknown }).version === "string") {
      const version = (parsed as { version: string }).version.trim();
      return version ? { version } : null;
    }
  } catch {
    return null;
  }

  return null;
}
