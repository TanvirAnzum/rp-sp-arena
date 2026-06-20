import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { shortTokenId, formatEntryTime } from "./swimming.utils";
import styles from "./TokenCard.module.css";

export default function TokenCard({ token }) {
  async function togglePaid() {
    await updateDoc(doc(db, "swimmingTokens", token.id), { paid: !token.paid });
  }

  return (
    <div className={`${styles.card} ${token.paid ? styles.paid : styles.unpaid}`}>
      <div className={styles.top}>
        <div className={styles.tokenId}>{shortTokenId(token.id)}</div>
        <button
          className={`${styles.paidBtn} ${token.paid ? styles.paidActive : ""}`}
          onClick={togglePaid}
          title={token.paid ? "Mark as unpaid" : "Mark as paid"}
        >
          {token.paid ? "✓ Paid" : "Unpaid"}
        </button>
      </div>

      <div className={styles.details}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>People</span>
          <span className={styles.statVal}>{token.people}</span>
        </span>
        <span className={styles.divider}>×</span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>Hours</span>
          <span className={styles.statVal}>{token.hours}</span>
        </span>
        <span className={styles.divider}>×</span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>Rate</span>
          <span className={styles.statVal}>৳{token.pricePerPersonPerHour?.toLocaleString()}</span>
        </span>
      </div>

      <div className={styles.bottom}>
        <span className={styles.total}>৳{token.totalPrice?.toLocaleString()}</span>
        <span className={styles.time}>{formatEntryTime(token.entryTime)}</span>
      </div>
    </div>
  );
}
