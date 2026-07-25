import { useEffect, useState } from "react";
import { getApiVersion } from "../../app/api/version";
import { useI18n } from "../../app/i18n/I18nContext";
import packageJson from "../../../package.json";
import styles from "./AppVersion.module.scss";

const WEB_VERSION = packageJson.version;

export default function AppVersion() {
  const { t } = useI18n();
  const [apiVersion, setApiVersion] = useState<string | null>(null);

  useEffect(() => {
    getApiVersion()
      .then((response) => setApiVersion(response?.version ?? null))
      .catch(() => setApiVersion(null));
  }, []);

  return (
    <span className={styles.root}>
      {t("appVersion.web", { version: WEB_VERSION })}
      {apiVersion ? ` · ${t("appVersion.api", { version: apiVersion })}` : null}
    </span>
  );
}
