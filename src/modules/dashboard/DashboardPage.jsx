import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DayReport from "./DayReport";
import MonthReport from "./MonthReport";
import WeekReport from "./WeekReport";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("today");

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Dashboard</h2>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "today" ? styles.active : ""}`}
            onClick={() => setTab("today")}
          >
            Today
          </button>
          {isOwner && (
            <>
              <button
                className={`${styles.tab} ${tab === "weekly" ? styles.active : ""}`}
                onClick={() => setTab("weekly")}
              >
                This Week
              </button>
              <button
                className={`${styles.tab} ${tab === "monthly" ? styles.active : ""}`}
                onClick={() => setTab("monthly")}
              >
                Monthly
              </button>
            </>
          )}
        </div>
      </div>

      {tab === "today"   && <DayReport />}
      {tab === "weekly"  && isOwner && <WeekReport />}
      {tab === "monthly" && isOwner && <MonthReport />}
    </div>
  );
}
