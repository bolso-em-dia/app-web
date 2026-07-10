import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../app/i18n/I18nContext";
import Button from "./ui/Button";
import Card from "./ui/Card";
import styles from "./ErrorBoundary.module.scss";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <FallbackUI
          error={this.state.error}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function FallbackUI({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { t } = useI18n();

  return (
    <main className={styles.fallback}>
      <Card className={styles.fallbackCard}>
        <h1 className={styles.fallbackTitle}>
          {t("errorBoundary.title")}
        </h1>
        <p className={styles.fallbackMessage}>
          {t("errorBoundary.message")}
        </p>
        <details className={styles.fallbackDetails}>
          <summary>{t("errorBoundary.details")}</summary>
          <pre>{error.message}</pre>
        </details>
        <div className={styles.fallbackActions}>
          <Button onClick={onRetry} type="button">
            {t("errorBoundary.retry")}
          </Button>
          <Button
            onClick={() => window.location.assign("/dashboard")}
            type="button"
            variant="secondary"
          >
            {t("errorBoundary.goToDashboard")}
          </Button>
        </div>
      </Card>
    </main>
  );
}

export default function ErrorBoundary({ children }: Props) {
  const location = useLocation();
  return <ErrorBoundaryInner key={location.pathname}>{children}</ErrorBoundaryInner>;
}
