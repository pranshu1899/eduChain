export default function UniversityTopbar() {
  return (
    <header className="university-topbar">
      <div className="university-breadcrumb">
        <span>EduProof</span>
        <span className="breadcrumb-separator">/</span>
        <strong>University Portal</strong>
      </div>

      <div className="university-topbar-right">
        <div className="network-status">
          <span className="network-dot" />
          <span>Ethereum Sepolia</span>
        </div>

        <div className="wallet-pill">
          <span className="wallet-avatar">U</span>

          <div>
            <span className="wallet-label">University issuer</span>
            <strong>0xe0af...e461</strong>
          </div>

          <span className="wallet-status">Connected</span>
        </div>
      </div>
    </header>
  );
}