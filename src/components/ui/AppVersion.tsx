import { useEffect, useState } from "react";
import styles from "./AppVersion.module.scss";

const WEB_VERSION = "1.0.17";

export default function AppVersion() {
  const [apiVersion, setApiVersion] = useState<string | null>(null);

  useEffect(() => {
    if (import.meta.env.MODE === "test") return;
    fetch("/api/version")
      .then(async (r) => {
        if (r.ok) setApiVersion(await r.text());
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
