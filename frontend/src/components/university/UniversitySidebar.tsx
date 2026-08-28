import { NavLink } from "react-router-dom";

const items = [
  {
    to: "/university",
    label: "Overview",
    icon: "⌂",
    end: true,
  },
  {
    to: "/university/credentials",
    label: "Credentials",
    icon: "▣",
  },
  {
    to: "/university/issue",
    label: "Issue Credential",
    icon: "+",
  },
  {
    to: "/university/analytics",
    label: "Analytics",
    icon: "◈",
  },
  {
    to: "/university/verify",
    label: "Verify",
    icon: "✓",
  },
];

export default function UniversitySidebar() {
  return (
    <aside className="dashboard-sidebar">
      {/* ================= BRAND ================= */}
      <div className="dashboard-brand">
        <div className="dashboard-brand-mark">E</div>

        <div>
          <div className="dashboard-brand-name">EduProof</div>

          <div className="dashboard-brand-subtitle">
            Academic Credential Network
          </div>
        </div>
      </div>

      {/* ================= PORTAL LABEL ================= */}
      <div className="dashboard-nav-label">
        UNIVERSITY PORTAL
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="dashboard-nav-group">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `dashboard-nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* ================= BOTTOM AREA ================= */}
      <div style={{ marginTop: "auto" }}>
        {/* Change role */}
        <NavLink
          to="/"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            padding: "10px",
            color: "var(--text-soft)",
            fontSize: "12px",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block"
          }}
        >
          ← Change role
        </NavLink>
      </div>
    </aside>
  );
}