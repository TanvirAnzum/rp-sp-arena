import { useCallback, useState } from "react";
import { useSlots } from "./hooks/useSlots";
import { useDayBookings } from "./hooks/useDayBookings";
import SlotCard from "./SlotCard";
import BookingModal from "./BookingModal";
import TurfReceipt from "./TurfReceipt";
import Modal from "../../components/Modal";
import { toDateStr, formatDateLabel } from "./turf.utils";
import { useAuth } from "../../auth/AuthContext";
import { useDebouncedCallback } from "../../utils/useDebouncedCallback";
import styles from "./BookingView.module.css";

export default function BookingView() {
  const { isOwner } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [modal, setModal]       = useState(null);
  const [billData, setBillData] = useState(null);

  const { slots, loading: slotsLoading }             = useSlots();
  const { bookingsBySlot, loading: bookingsLoading } = useDayBookings(selectedDate);

  const activeSlots = slots.filter((s) => s.isActive);
  const today   = toDateStr(new Date());
  const isToday = selectedDate === today;

  const changeDate = useDebouncedCallback(
    useCallback((delta) => {
      if (delta < 0 && isToday && !isOwner) return;
      const d = new Date(selectedDate + "T00:00:00");
      d.setDate(d.getDate() + delta);
      setSelectedDate(toDateStr(d));
    }, [selectedDate, isToday, isOwner]),
    300,
  );

  function handleOpenBill(booking, slot) {
    setBillData({ booking, slot });
  }

  const loading = slotsLoading || bookingsLoading;

  return (
    <div className={styles.container}>
      <div className={styles.datePicker}>
        <button
          className={styles.navBtn}
          onClick={() => changeDate(-1)}
          disabled={!isOwner && isToday}
          title={!isOwner && isToday ? "Cannot go before today" : undefined}
        >&#8249;</button>
        <div className={styles.dateDisplay}>
          <span className={styles.dateLabel}>{formatDateLabel(selectedDate)}</span>
          {isOwner && (
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}
        </div>
        <button className={styles.navBtn} onClick={() => changeDate(1)}>&#8250;</button>
        {!isToday && (
          <button
            className={styles.todayBtn}
            onClick={() => setSelectedDate(today)}
          >
            Today
          </button>
        )}
      </div>

      {loading ? (
        <p className={styles.empty}>Loading&#8230;</p>
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

      {modal && (
        <BookingModal
          slot={modal.slot}
          booking={modal.booking}
          date={selectedDate}
          onClose={() => setModal(null)}
          onBill={handleOpenBill}
        />
      )}

      {billData && (
        <Modal
          title="Turf Booking Bill"
          onClose={() => setBillData(null)}
          width="420px"
        >
          <TurfReceipt
            booking={billData.booking}
            slot={billData.slot}
            date={selectedDate}
            onClose={() => setBillData(null)}
          />
        </Modal>
      )}
    </div>
  );
}
