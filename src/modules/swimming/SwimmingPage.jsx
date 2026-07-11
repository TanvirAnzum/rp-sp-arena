import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import IssueTokenForm from "./IssueTokenForm";
import TokenList from "./TokenList";
import PriceSettings from "./PriceSettings";
import styles from "./SwimmingPage.module.css";

export default function SwimmingPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("issue");

  function handleIssued() {
    // Switch to list so staff can see the active session
    setTab("list");
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
            className={`${styles.tab} ${tab === "list" ? styles.active : ""}`}
            onClick={() => setTab("list")}
          >
            Token List
          </button>
          {isOwner && (
            <button
              className={`${styles.tab} ${tab === "pricing" ? styles.active : ""}`}
              onClick={() => setTab("pricing")}
            >
              Pricing
            </button>
          )}
        </div>
      </div>

      {tab === "issue"   && <IssueTokenForm onIssued={handleIssued} />}
      {tab === "list"    && <TokenList />}
      {tab === "pricing" && isOwner && <PriceSettings />}
    </div>
  );
}
