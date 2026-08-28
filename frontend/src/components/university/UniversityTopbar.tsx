import { Link } from "react-router-dom";

interface UniversityTopbarProps {
  walletAddress: string;
  connected: boolean;
}

function shortAddress(address: string) {
  if (!address) return "Not connected";
  if (address.length < 12) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function UniversityTopbar({
  walletAddress,
}: UniversityTopbarProps) {
  return (
    <header className="dashboard-topbar">
      <div style={{ fontSize: "12px", color: "var(--text-soft)" }}>
        <Link to="/university" style={{ color: "inherit", textDecoration: "none" }}>EduProof</Link>
        <span style={{ margin: "0 8px", opacity: 0.5 }}>/</span>
        <strong style={{ color: "var(--text)" }}>University Portal</strong>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="dashboard-badge success">Ethereum Sepolia</div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingLeft: "16px", borderLeft: "1px solid var(--border)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>UNIVERSITY ISSUER</span>
            <strong style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text)" }}>
              {shortAddress(walletAddress)}
            </strong>
          </div>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: 700 }}>
            U
          </div>
        </div>
      </div>
    </header>
  );
}