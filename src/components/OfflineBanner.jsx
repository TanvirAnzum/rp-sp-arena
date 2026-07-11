import { useOnlineStatus } from "../hooks/useOnlineStatus";
import styles from "./OfflineBanner.module.css";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <span className={styles.icon}>⚡</span>
      You are offline. Changes may not be saved until the connection is restored.
    </div>
  );
}
