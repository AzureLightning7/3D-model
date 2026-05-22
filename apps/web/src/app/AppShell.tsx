import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/features/auth/store";
import { useProfileStore } from "@/features/survey/store";
import { styles } from "@/shared/ui";
import { ThemeToggle } from "@/themes/ThemeToggle";

export function AppShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clear);
  const clearProfile = useProfileStore((s) => s.setProfileId);
  const hideNav = loc.pathname.startsWith("/login") || loc.pathname.startsWith("/register");
  const isEditor = loc.pathname.includes("/editor");

  return (
    <div style={styles.shell}>
      {!hideNav && !isEditor && (
        <nav style={styles.navbar}>
          <Link to="/projects" style={{ color: "#f3f0ff", textDecoration: "none", fontWeight: 700 }}>
            DormVibe
          </Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {user && <span style={{ ...styles.muted, fontSize: 13 }}>{user.email}</span>}
            <ThemeToggle />
            {user && (
              <button
                style={styles.buttonGhost}
                onClick={() => {
                  clearAuth();
                  clearProfile(null);
                  nav("/login", { replace: true });
                }}
              >
                Log out
              </button>
            )}
          </div>
        </nav>
      )}
      <Outlet />
    </div>
  );
}
