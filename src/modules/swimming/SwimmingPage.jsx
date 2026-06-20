import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import IssueTokenForm from "./IssueTokenForm";
import TokenList from "./TokenList";
import PriceSettings from "./PriceSettings";
import styles from "./SwimmingPage.module.css";

export default function SwimmingPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("issue");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleIssued() {
    setTab("tokens");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Swimming</h2>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "issue" ? styles.active : ""}`}
            onClick={() => setTab("issue")}
          >
            Issue Token
          </button>
          <button
            className={`${styles.tab} ${tab === "tokens" ? styles.active : ""}`}
            onClick={() => setTab("tokens")}
          >
            Tokens
          </button>
          {isOwner && (
            <button
              className={`${styles.tab} ${tab === "settings" ? styles.active : ""}`}
              onClick={() => setTab("settings")}
            >
              Settings
            </button>
          )}
        </div>
      </div>

      {tab === "issue" && <IssueTokenForm onIssued={handleIssued} />}
      {tab === "tokens" && <TokenList key={refreshKey} />}
      {tab === "settings" && isOwner && <PriceSettings />}
    </div>
  );
}
