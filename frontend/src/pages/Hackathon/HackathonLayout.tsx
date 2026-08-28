import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getConnectedHackathonWallet, getHackathonOrganizationOnChain } from "../../services/hackathonAccessService";

interface HackathonLayoutProps {
  children: ReactNode;
}

export default function HackathonLayout({
  children,
}: HackathonLayoutProps) {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const w = await getConnectedHackathonWallet();
        if (w) {
          setWallet(w);
          const org = await getHackathonOrganizationOnChain(w);
          if (org) {
            setOrgName(org.organizationName);
          }
        }
      } catch (err) {
        console.error("Failed to load layout data", err);
      }
    }
    void init();
  }, []);

  function navClass({ isActive }: { isActive: boolean }) {
    return isActive ? "dashboard-nav-item active" : "dashboard-nav-item";
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        {/* BRAND */}
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            color: "inherit",
          }}
        >
          <div className="dashboard-brand">
            <div className="dashboard-brand-mark">E</div>
            <div>
              <div className="dashboard-brand-name">EduProof</div>
              <div className="dashboard-brand-subtitle">Academic Credential Network</div>
            </div>
          </div>
        </button>

        {/* IDENTITY */}
        <div style={{ marginTop: "36px", padding: "0 8px", marginBottom: "24px" }}>
          <div style={{ color: "#8e87ff", fontSize: "9px", fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase" }}>
            Approved Organization
          </div>
          <div style={{ marginTop: "6px", fontSize: "13px", fontWeight: 700, color: "#f5f7ff", opacity: 0.9 }}>
            Hackathon Network
          </div>
        </div>

        <div style={{ padding: "0 8px", marginBottom: "32px" }}>
          <div style={{ color: "rgba(245,247,255,0.45)", fontSize: "10px", marginBottom: "4px" }}>
            Organization
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", color: "#f5f7ff", wordBreak: "break-word" }}>
            {orgName || "Loading..."}
          </div>

          <div style={{ color: "rgba(245,247,255,0.45)", fontSize: "10px", marginBottom: "4px" }}>
            Connected wallet
          </div>
          <div style={{ fontFamily: "monospace", color: "#aaa5ff", fontSize: "11px", marginBottom: "16px" }}>
            {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "..."}
          </div>

          <div className="student-network-card" style={{ marginTop: "8px", padding: "10px 12px" }}>
            <div className="student-network-dot" style={{ width: "6px", height: "6px", flexShrink: 0 }}></div>
            <div>
              <strong style={{ fontSize: "10px", color: "#f5f7ff" }}>Blockchain Secured</strong>
              <span style={{ marginTop: "2px", fontSize: "9px", color: "rgba(245,247,255,0.5)" }}>Ethereum Sepolia</span>
            </div>
          </div>
        </div>

        <div className="dashboard-nav-label" style={{ marginTop: 0 }}>OVERVIEW</div>

        {/* NAVIGATION */}
        <nav className="dashboard-nav-group">
          <NavLink to="/hackathon" end className={navClass}>
            Overview
          </NavLink>
          <NavLink to="/hackathon/create" className={navClass}>
            Hackathons
          </NavLink>
          <div className="dashboard-nav-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
            Participants
          </div>
          <div className="dashboard-nav-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
            Certificate Batches
          </div>
        </nav>

        {/* BACK */}
        <div style={{ marginTop: "auto" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
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
            }}
          >
            ← Change Role
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div style={{ fontSize: "12px", color: "var(--text-soft)" }}>
            Hackathon Organization
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="dashboard-badge success">Ethereum Sepolia</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-soft)" }}>
              {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "..."}
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}