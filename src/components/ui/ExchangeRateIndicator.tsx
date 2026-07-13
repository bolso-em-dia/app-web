import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getLatestExchangeRate, refreshExchangeRate } from "../../app/api/exchangeRate";
import { useAuth } from "../../app/auth/useAuth";
import { useI18n } from "../../app/i18n/I18nContext";
import { formatCurrency } from "../../lib/formatters/currency";
import Button from "./Button";
import Tooltip from "./Tooltip";
import styles from "./ExchangeRateIndicator.module.scss";

export default function ExchangeRateIndicator() {
  const { accessToken, user } = useAuth();
  const { t } = useI18n();
  const [rate, setRate] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const showForeignCurrency = user?.preferences.showForeignCurrency ?? false;

  const fetchRate = useCallback(async () => {
    if (!accessToken || !showForeignCurrency) return;
    try {
      const data = await getLatestExchangeRate(accessToken);
      setRate(data.rate);
      setStale(data.stale);
      setError(false);
    } catch {
      setError(true);
    }
  }, [accessToken, showForeignCurrency]);

  useEffect(() => {
    if (!showForeignCurrency) return;
    void fetchRate();
  }, [fetchRate, showForeignCurrency]);

  async function handleRefresh() {
    if (!accessToken || !showForeignCurrency || refreshing) return;
    setRefreshing(true);
    try {
      const data = await refreshExchangeRate(accessToken);
      setRate(data.rate);
      setStale(false);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }

  if (!showForeignCurrency || rate == null) return null;

  const tooltipContent = error ? t("exchangeRate.fetchError") : stale ? t("exchangeRate.staleTooltip") : t("exchangeRate.updated");

  return (
    <div className={styles.root}>
      <Tooltip content={tooltipContent}>
        <span className={styles.value}>US$ 1 = {formatCurrency(rate)}</span>
      </Tooltip>
      <Button
        aria-label={t("exchangeRate.refresh")}
        className={styles.refresh}
        disabled={refreshing}
        onClick={() => void handleRefresh()}
        type="button"
        variant="subtle"
      >
        <RefreshCw aria-hidden="true" className={refreshing ? styles.spinning : undefined} size={14} />
      </Button>
    </div>
  );
}
