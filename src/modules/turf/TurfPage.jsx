import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import BookingView from "./BookingView";
import ManageSlots from "./ManageSlots";
import styles from "./TurfPage.module.css";

export default function TurfPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState("book");

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Turf Booking</h2>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "book" ? styles.active : ""}`}
            onClick={() => setTab("book")}
          >
            Book / Bookings
          </button>
          {isOwner && (
            <button
              className={`${styles.tab} ${tab === "slots" ? styles.active : ""}`}
              onClick={() => setTab("slots")}
            >
              Manage Slots
            </button>
          )}
        </div>
      </div>

      {tab === "book"  && <BookingView />}
      {tab === "slots" && isOwner && <ManageSlots />}
    </div>
  );
}
