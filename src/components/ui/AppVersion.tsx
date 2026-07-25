import { useEffect, useState } from "react";
import { resolveApiBaseUrl } from "../../app/api/client";
import packageJson from "../../../package.json";
import styles from "./AppVersion.module.scss";

const WEB_VERSION = packageJson.version;

export default function AppVersion() {
  const [apiVersion, setApiVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${resolveApiBaseUrl()}/api/version`)
      .then(async (r) => {
        if (!r.ok) {
          return;
        }

        const contentType = r.headers.get("content-type")?.toLowerCase() ?? "";
        const bodyText = (await r.text()).trim();

        if (!bodyText || contentType.includes("text/html") || looksLikeHtml(bodyText)) {
          return;
        }

        const version = parseVersion(bodyText);

        if (!version) {
          return;
        }

        setApiVersion(version);
      })
      .catch(() => setApiVersion(null));
  }, []);

  return (
    <span className={styles.root}>
      web {WEB_VERSION}
      {apiVersion ? ` · api ${apiVersion}` : null}
    </span>
  );
}

function looksLikeHtml(value: string) {
  return /^<!doctype html>|^<html[\s>]/i.test(value);
}

function parseVersion(bodyText: string) {
  try {
    const parsed = JSON.parse(bodyText) as unknown;

    if (typeof parsed === "object" && parsed !== null && typeof (parsed as { version?: unknown }).version === "string") {
      return (parsed as { version: string }).version.trim() || null;
    }
  } catch {
    return null;
  }

  return null;
}
