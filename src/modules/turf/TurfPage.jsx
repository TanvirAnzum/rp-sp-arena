import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import BookingView from "./BookingView";
import ManageSlots from "./ManageSlots";
import styles from "./TurfPage.module.css";

export default function TurfPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("bookings");

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>⚽ Turf Booking</h2>

        {isOwner && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "bookings" ? styles.active : ""}`}
              onClick={() => setTab("bookings")}
            >
              Bookings
            </button>
            <button
              className={`${styles.tab} ${tab === "manage" ? styles.active : ""}`}
              onClick={() => setTab("manage")}
            >
              Manage Slots
            </button>
          </div>
        )}
      </div>

      {tab === "bookings" && <BookingView />}
      {tab === "manage" && isOwner && <ManageSlots />}
    </div>
  );
}
