import { useState } from "react";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [activePage, setActivePage] = useState("dashboard");

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setWallet(accounts[0]);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">E</div>

          <div>
            <h2>EduProof</h2>
            <span>Trusted Credentials</span>
          </div>
        </div>

        <nav className="navigation">
          <button
            className={activePage === "dashboard" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={activePage === "credentials" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("credentials")}
          >
            <span>▣</span>
            Credentials
          </button>

          <button
            className={activePage === "issue" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("issue")}
          >
            <span>＋</span>
            Issue Credential
          </button>

          <button
            className={activePage === "verify" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("verify")}
          >
            <span>✓</span>
            Verify
          </button>

          <button
            className={activePage === "analytics" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("analytics")}
          >
            <span>◫</span>
            Analytics
          </button>
        </nav>

        <div className="network-card">
          <div className="network-dot"></div>

          <div>
            <small>Network</small>
            <strong>Ethereum Sepolia</strong>
          </div>
        </div>

        <div className="sidebar-footer">
          <span>EduProof v1.0</span>
          <span>Blockchain secured</span>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CREDENTIAL MANAGEMENT</p>
            <h1>
              {activePage === "dashboard" && "Dashboard"}
              {activePage === "credentials" && "Credentials"}
              {activePage === "issue" && "Issue Credential"}
              {activePage === "verify" && "Verify Credential"}
              {activePage === "analytics" && "Analytics"}
            </h1>
          </div>

          <div className="topbar-actions">
            {wallet ? (
              <div className="wallet-connected">
                <span className="wallet-dot"></span>
                {shortenAddress(wallet)}
              </div>
            ) : (
              <button className="connect-button" onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <>
            <section className="hero">
              <div>
                <span className="hero-label">DECENTRALIZED CREDENTIALS</span>

                <h2>
                  Academic credentials,
                  <br />
                  <span>verified on-chain.</span>
                </h2>

                <p>
                  Issue, manage and verify tamper-proof educational
                  credentials using blockchain, IPFS and cryptographic
                  signatures.
                </p>

                <div className="hero-buttons">
                  <button
                    className="primary-button"
                    onClick={() => setActivePage("issue")}
                  >
                    Issue Credential
                    <span>→</span>
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => setActivePage("verify")}
                  >
                    Verify Credential
                  </button>
                </div>
              </div>

              <div className="verification-visual">
                <div className="verification-ring">
                  <div className="verification-check">✓</div>
                </div>

                <div className="verification-card">
                  <span>VERIFICATION STATUS</span>
                  <strong>Credential Authentic</strong>
                  <small>Blockchain verified</small>
                </div>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span>Total Credentials</span>
                <strong>1</strong>
                <small>On-chain records</small>
              </div>

              <div className="stat-card">
                <span>Verified</span>
                <strong>1</strong>
                <small className="success-text">100% valid</small>
              </div>

              <div className="stat-card">
                <span>Active Issuers</span>
                <strong>1</strong>
                <small>Authorized institutions</small>
              </div>

              <div className="stat-card">
                <span>Network</span>
                <strong>Sepolia</strong>
                <small>Ethereum testnet</small>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-label">RECENT ACTIVITY</span>
                    <h3>Credential Activity</h3>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("credentials")}
                  >
                    View all →
                  </button>
                </div>

                <div className="activity-row">
                  <div className="activity-icon">✓</div>

                  <div className="activity-info">
                    <strong>Credential issued</strong>
                    <span>B.Tech · ABC University</span>
                  </div>

                  <span className="status-badge">Verified</span>
                </div>

                <div className="activity-row">
                  <div className="activity-icon">◆</div>

                  <div className="activity-info">
                    <strong>IPFS metadata stored</strong>
                    <span>Content-addressed record</span>
                  </div>

                  <span className="status-badge">Stored</span>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-label">SECURITY</span>
                    <h3>Verification Layers</h3>
                  </div>
                </div>

                <div className="security-list">
                  <div>
                    <span>✓</span>
                    <p>Blockchain Record</p>
                    <strong>Valid</strong>
                  </div>

                  <div>
                    <span>✓</span>
                    <p>IPFS Metadata</p>
                    <strong>Valid</strong>
                  </div>

                  <div>
                    <span>✓</span>
                    <p>Credential Hash</p>
                    <strong>Match</strong>
                  </div>

                  <div>
                    <span>✓</span>
                    <p>ECDSA Signature</p>
                    <strong>Valid</strong>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* CREDENTIALS */}
        {activePage === "credentials" && (
          <section className="page-section">
            <div className="page-intro">
              <span className="panel-label">ON-CHAIN RECORDS</span>
              <h2>Your Credentials</h2>
              <p>
                Credentials stored on the EduProof blockchain.
              </p>
            </div>

            <div className="credential-card">
              <div className="credential-header">
                <div className="credential-symbol">EP</div>

                <div>
                  <span className="panel-label">EDUCATIONAL CREDENTIAL</span>
                  <h3>Bachelor of Technology</h3>
                  <p>ABC University</p>
                </div>

                <span className="status-badge large">Verified</span>
              </div>

              <div className="credential-details">
                <div>
                  <span>Credential Type</span>
                  <strong>B.Tech</strong>
                </div>

                <div>
                  <span>Issue Date</span>
                  <strong>21 Aug 2026</strong>
                </div>

                <div>
                  <span>Version</span>
                  <strong>1</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>Active</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ISSUE */}
        {activePage === "issue" && (
          <section className="page-section">
            <div className="page-intro">
              <span className="panel-label">UNIVERSITY ACTION</span>
              <h2>Issue a Credential</h2>
              <p>
                Create a cryptographically signed educational credential.
              </p>
            </div>

            <div className="form-panel">
              <div className="form-grid">
                <label>
                  Student DID
                  <input
                    placeholder="did:eduproof:student..."
                    type="text"
                  />
                </label>

                <label>
                  Credential Type
                  <input placeholder="B.Tech" type="text" />
                </label>

                <label>
                  Institution
                  <input placeholder="ABC University" type="text" />
                </label>

                <label>
                  Institution ID
                  <input placeholder="ABC-001" type="text" />
                </label>

                <label className="full-width">
                  Degree
                  <input
                    placeholder="Bachelor of Technology"
                    type="text"
                  />
                </label>
              </div>

              <div className="form-footer">
                <div>
                  <span>Storage</span>
                  <strong>IPFS + Blockchain</strong>
                </div>

                <button className="primary-button">
                  Issue Credential →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* VERIFY */}
        {activePage === "verify" && (
          <section className="page-section verify-page">
            <div className="verify-header">
              <span className="panel-label">PUBLIC VERIFICATION</span>

              <h2>Verify a Credential</h2>

              <p>
                Confirm that an educational credential was genuinely
                issued by an authorized institution.
              </p>
            </div>

            <div className="verify-box">
              <div className="verify-icon">✓</div>

              <h3>Credential Verification</h3>

              <p>
                Enter a credential ID to verify its blockchain,
                IPFS and cryptographic integrity.
              </p>

              <div className="verify-input">
                <input
                  placeholder="Enter credential ID"
                  type="text"
                />

                <button className="primary-button">
                  Verify
                </button>
              </div>

              <div className="verification-methods">
                <span>✓ Blockchain</span>
                <span>✓ IPFS</span>
                <span>✓ Hash</span>
                <span>✓ Signature</span>
              </div>
            </div>
          </section>
        )}

        {/* ANALYTICS */}
        {activePage === "analytics" && (
          <section className="page-section">
            <div className="page-intro">
              <span className="panel-label">SYSTEM INSIGHTS</span>
              <h2>Analytics</h2>
              <p>
                Credential issuance and verification activity.
              </p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Credentials Issued</span>
                <strong>1</strong>
              </div>

              <div className="stat-card">
                <span>Verification Rate</span>
                <strong>100%</strong>
              </div>

              <div className="stat-card">
                <span>Active Credentials</span>
                <strong>1</strong>
              </div>

              <div className="stat-card">
                <span>Revoked</span>
                <strong>0</strong>
              </div>
            </div>

            <div className="panel analytics-panel">
              <span className="panel-label">NETWORK</span>
              <h3>EduProof on Ethereum Sepolia</h3>

              <div className="contract-address">
                <span>Contract</span>
                <code>
                  0x75f4c5489E34CC1d1c67E3c302dDD76a86956e8a
                </code>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;