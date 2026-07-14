import { useNavigate } from "react-router-dom";
import PasswordChangeForm from "../components/PasswordChangeForm";
import Card from "../components/ui/Card";
import { useI18n } from "../app/i18n/I18nContext";
import styles from "./LoginPage.module.scss";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <PasswordChangeForm
          onSuccess={() => navigate("/transactions", { replace: true })}
          submitLabel={t("settings.password.firstAccessSave")}
          subtitle={t("settings.password.firstAccessSubtitle")}
          title={t("settings.password.firstAccessTitle")}
        />
      </Card>
    </div>
  );
}
