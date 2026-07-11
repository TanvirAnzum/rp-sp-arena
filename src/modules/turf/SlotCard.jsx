import { formatTime, TIERS } from "./turf.utils";
import styles from "./SlotCard.module.css";

const STATUS_LABEL = {
  available: "Available",
  booked: "Booked",
  held: "Held",
};

export default function SlotCard({ slot, booking, onClick }) {
  const status = booking ? booking.status : "available";

  // Payment status for booked slots
  const isPartial = booking && !booking.paid && (booking.advancePaid ?? 0) > 0;
  const payDotClass = booking?.paid
    ? styles.paidDot
    : isPartial
    ? styles.partialDot
    : styles.dueDot;
  const payLabel = booking?.paid
    ? "● Paid"
    : isPartial
    ? "● Partial"
    : "● Due";

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
          <div className={styles.customerRow}>
            <span className={styles.customer}>{booking.customerName}</span>
            <span className={payDotClass}>{payLabel}</span>
          </div>
          <span className={styles.meta}>
            {booking.tier}p &nbsp;·&nbsp; ৳{booking.price?.toLocaleString()}
            {isPartial && (
              <> &nbsp;·&nbsp; Adv: ৳{booking.advancePaid?.toLocaleString()}, Due: ৳{((booking.price ?? 0) - (booking.advancePaid ?? 0)).toLocaleString()}</>
            )}
          </span>
        </div>
      )}
    </button>
  );
}
