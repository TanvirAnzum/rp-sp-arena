import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import styles from "./Layout.module.css";

const staffNav = [
  { to: "/turf", label: "⚽ Turf" },
  { to: "/swimming", label: "🏊 Swimming" },
  { to: "/food", label: "🍔 Food" },
  { to: "/other", label: "🛍️ Other Items" },
  { to: "/dashboard", label: "📊 Dashboard" },
];

const ownerExtra = [
  // Owner-only settings links are inside each module — nav is the same
];

export default function Layout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🏟️</span>
          <span className={styles.brandName}>RSA</span>
        </div>

        <nav className={styles.nav}>
          {staffNav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.bottom}>
          <div className={styles.userInfo}>
            <span className={styles.roleTag}>{role}</span>
            <span className={styles.email}>{user?.email}</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
