import { NavLink } from "react-router-dom";

const items = [
  { to: "/university", label: "Overview", icon: "⌂", end: true },
  { to: "/university/credentials", label: "Credentials", icon: "▣" },
  { to: "/university/issue", label: "Issue Credential", icon: "+" },
  { to: "/university/analytics", label: "Analytics", icon: "◈" },
  { to: "/university/verify", label: "Verify", icon: "✓" },
];

export default function UniversitySidebar() {
  return (
    <aside className="university-sidebar">
      <div className="university-brand">
        <div className="university-brand-mark">E</div>

        <div>
          <div className="university-brand-name">EduProof</div>
          <div className="university-brand-subtitle">
            Academic Credential Network
          </div>
        </div>
      </div>

      <div className="university-sidebar-section">
        <span>UNIVERSITY PORTAL</span>
      </div>

      <nav className="university-navigation">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `university-nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="university-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="university-sidebar-bottom">
        <div className="university-security-card">
          <div className="security-icon">◆</div>
          <div>
            <strong>Blockchain secured</strong>
            <span>Sepolia Network</span>
          </div>
        </div>

        <NavLink to="/" className="university-change-role">
          <span>←</span>
          Change role
        </NavLink>
      </div>
    </aside>
  );
}