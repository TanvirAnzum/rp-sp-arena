import { useState } from "react";
import { useSlots } from "./hooks/useSlots";
import { useDayBookings } from "./hooks/useDayBookings";
import SlotCard from "./SlotCard";
import BookingModal from "./BookingModal";
import { toDateStr, formatDateLabel } from "./turf.utils";
import styles from "./BookingView.module.css";

export default function BookingView() {
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [modal, setModal] = useState(null); // { slot, booking|null }

  const { slots, loading: slotsLoading } = useSlots();
  const { bookingsBySlot, loading: bookingsLoading } = useDayBookings(selectedDate);

  const activeSlots = slots.filter((s) => s.isActive);

  function changeDate(delta) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateStr(d));
  }

  const loading = slotsLoading || bookingsLoading;

  return (
    <div className={styles.container}>
      {/* Date navigation */}
      <div className={styles.datePicker}>
        <button className={styles.navBtn} onClick={() => changeDate(-1)}>‹</button>
        <div className={styles.dateDisplay}>
          <span className={styles.dateLabel}>{formatDateLabel(selectedDate)}</span>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <button className={styles.navBtn} onClick={() => changeDate(1)}>›</button>
      </div>

      {/* Slot grid */}
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : activeSlots.length === 0 ? (
        <p className={styles.empty}>No active slots. Ask the owner to add slots.</p>
      ) : (
        <div className={styles.grid}>
          {activeSlots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              booking={bookingsBySlot[slot.id] ?? null}
              onClick={(s, b) => setModal({ slot: s, booking: b })}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <BookingModal
          slot={modal.slot}
          booking={modal.booking}
          date={selectedDate}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
