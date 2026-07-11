import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import OfflineBanner from "./OfflineBanner";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import styles from "./Layout.module.css";

const staffNav = [
  { to: "/home",      label: "🏠 Home" },
  { to: "/turf",      label: "⚽ Turf" },
  { to: "/swimming",  label: "🏊 Swimming" },
  { to: "/food",      label: "🍔 Food" },
  { to: "/other",     label: "🛍️ Other Items" },
  { to: "/expenses",  label: "💸 Expenses" },
  { to: "/dashboard", label: "📊 Dashboard" },
];

const ownerNav = [
  { to: "/staff",     label: "👥 Staff" },
  { to: "/downloads", label: "📥 Downloads" },
];

export default function Layout() {
  const { user, role, isOwner, logout } = useAuth();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function closeMenu() { setMenuOpen(false); }

  return (
    <>
      <OfflineBanner />
      <div className={`${styles.shell} ${!isOnline ? styles.offline : ""}`}>
      {/* Mobile topbar */}
      <div className={styles.topbar}>
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
        <div className={styles.topbarBrand}>
          <img src="/logo.png" alt="RSA Logo" className={styles.topbarLogo} />
          <span className={styles.topbarName}>Rangpur Sports Arena</span>
        </div>
      </div>

      {/* Backdrop (mobile only) */}
      <div
        className={`${styles.backdrop} ${menuOpen ? styles.menuOpen : ""}`}
        onClick={closeMenu}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.menuOpen : ""}`}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="RSA Logo" className={styles.brandLogo} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>Rangpur</span>
            <span className={styles.brandSub}>Sports Arena</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {staffNav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`
              }
            >
              {label}
            </NavLink>
          ))}

          {isOwner && (
            <>
              <div className={styles.navDivider} />
              {ownerNav.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.active : ""}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className={styles.bottom}>
          <div className={styles.userInfo}>
            <span className={styles.roleTag}>{role}</span>
            <span className={styles.email}>{user?.email}</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
          <p className={styles.devCredit}>Dev by Tanvir Anzum</p>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
    </>
  );
}
