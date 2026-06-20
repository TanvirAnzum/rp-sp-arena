import { formatTime, TIERS } from "./turf.utils";
import styles from "./SlotCard.module.css";

const STATUS_LABEL = {
  available: "Available",
  booked: "Booked",
  held: "Held",
};

export default function SlotCard({ slot, booking, onClick }) {
  const status = booking ? booking.status : "available";

  return (
    <button
      className={`${styles.card} ${styles[status]}`}
      onClick={() => onClick(slot, booking)}
      disabled={false}
    >
      <div className={styles.time}>
        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
      </div>

      <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
        {STATUS_LABEL[status]}
      </span>

      {status === "available" ? (
        <div className={styles.prices}>
          {TIERS.map((t) =>
            slot.prices?.[t] ? (
              <span key={t} className={styles.price}>
                {t}p: ৳{slot.prices[t].toLocaleString()}
              </span>
            ) : null
          )}
        </div>
      ) : (
        <div className={styles.bookingInfo}>
          <span className={styles.customer}>{booking.customerName}</span>
          <span className={styles.meta}>
            {booking.tier}p &nbsp;·&nbsp; ৳{booking.price?.toLocaleString()}
            {booking.advancePaid > 0 && (
              <> &nbsp;·&nbsp; Adv: ৳{booking.advancePaid?.toLocaleString()}</>
            )}
          </span>
        </div>
      )}
    </button>
  );
}
