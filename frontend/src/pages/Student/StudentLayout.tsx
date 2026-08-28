import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

interface StudentLayoutProps {
  children: ReactNode;
  walletAddress: string;
  connected: boolean;
  onConnect: () => void | Promise<void>;
}

/* =====================================================
   WALLET ADDRESS SHORTENER
   ===================================================== */

function shortenAddress(
  address: string,
): string {
  if (!address) {
    return "";
  }

  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/* =====================================================
   ETHEREUM PROVIDER TYPE
   ===================================================== */

interface EthereumProvider {
  on?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;

  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;
}

/* =====================================================
   STUDENT LAYOUT
   ===================================================== */

export default function StudentLayout({
  children,
  walletAddress,
  connected,
  onConnect,
}: StudentLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentWallet, setCurrentWallet] =
    useState<string>(walletAddress);

  /* =====================================================
     SYNC WALLET PROP
     ===================================================== */

  useEffect(() => {
    setCurrentWallet(walletAddress);
  }, [walletAddress]);

  /* =====================================================
     METAMASK ACCOUNT CHANGE LISTENER
     ===================================================== */

  useEffect(() => {
    const ethereum = (
      window as Window & {
        ethereum?: EthereumProvider;
      }
    ).ethereum;

    if (!ethereum) {
      return;
    }

    const handleAccountsChanged = (
      ...args: unknown[]
    ) => {
      const accounts = args[0] as
        | string[]
        | undefined;

      const nextAddress =
        accounts?.[0] ?? "";

      setCurrentWallet(nextAddress);
    };

    ethereum.on?.(
      "accountsChanged",
      handleAccountsChanged,
    );

    return () => {
      ethereum.removeListener?.(
        "accountsChanged",
        handleAccountsChanged,
      );
    };
  }, []);

  /* =====================================================
     CURRENT ROUTE
     ===================================================== */

  const pathname = location.pathname;

  /* =====================================================
     NAVIGATION STATE
     ===================================================== */

  const isOverviewActive =
    pathname === "/student";

  const isCredentialsActive =
    pathname === "/student/credentials" ||
    pathname.startsWith(
      "/student/credentials/",
    );

  const isEvidenceActive =
    pathname === "/student/evidence" ||
    pathname.startsWith(
      "/student/evidence/",
    ) ||
    pathname === "/student/evidence-test";

  const isAchievementActive =
    pathname === "/student/achievements" ||
    pathname.startsWith(
      "/student/achievements/",
    );

  /* =====================================================
     DISPLAY WALLET
     ===================================================== */

  const displayWallet =
    currentWallet || walletAddress;

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="dashboard-shell">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="dashboard-sidebar">

        {/* =================================================
            BRAND
            ================================================= */}

        <div className="dashboard-brand">

          <Link
            to="/student"
            style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}
          >
            <div className="dashboard-brand-mark">
              E
            </div>

            <div>
              <div className="dashboard-brand-name">
                EduProof
              </div>

              <div className="dashboard-brand-subtitle">
                Academic Credential Network
              </div>
            </div>
          </Link>

        </div>

        {/* =================================================
            NAVIGATION
            ================================================= */}

        <nav
          className="dashboard-nav-group"
          aria-label="Student navigation"
        >

          <div className="dashboard-nav-label">
            STUDENT PORTAL
          </div>

          {/* =================================================
              OVERVIEW
              ================================================= */}

          <Link
            to="/student"
            className={
              isOverviewActive
                ? "dashboard-nav-item active"
                : "dashboard-nav-item"
            }
            aria-current={
              isOverviewActive
                ? "page"
                : undefined
            }
          >
            <span>
              Overview
            </span>
          </Link>

          {/* =================================================
              MY CREDENTIALS
              ================================================= */}

          <Link
            to="/student/credentials"
            className={
              isCredentialsActive
                ? "dashboard-nav-item active"
                : "dashboard-nav-item"
            }
            aria-current={
              isCredentialsActive
                ? "page"
                : undefined
            }
          >
            <span>
              My Credentials
            </span>
          </Link>

          {/* =================================================
              MY EVIDENCE
              ================================================= */}

          <Link
            to="/student/evidence"
            className={
              isEvidenceActive
                ? "dashboard-nav-item active"
                : "dashboard-nav-item"
            }
            aria-current={
              isEvidenceActive
                ? "page"
                : undefined
            }
          >
            <span>
              My Evidence
            </span>
          </Link>

          {/* =================================================
              ACHIEVEMENTS
              ================================================= */}

          <Link
            to="/student/achievements"
            className={
              isAchievementActive
                ? "dashboard-nav-item active"
                : "dashboard-nav-item"
            }
            aria-current={
              isAchievementActive
                ? "page"
                : undefined
            }
          >
            <span>
              Achievements
            </span>
          </Link>

        </nav>

        {/* =================================================
            ACHIEVEMENT QUICK ACTION
            ================================================= */}

        <div style={{ marginTop: "auto" }}>

          <button
            type="button"
            onClick={() => {
              navigate("/");
            }}
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
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT AREA
          ===================================================== */}

      <div className="dashboard-main">

        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="dashboard-topbar">

          <div style={{ fontSize: "12px", color: "var(--text-soft)" }}>

            <Link to="/student" style={{ color: "inherit", textDecoration: "none" }}>
              EduProof
            </Link>

            <span aria-hidden="true" style={{ margin: "0 8px", opacity: 0.5 }}>
              /
            </span>

            <strong style={{ color: "var(--text)" }}>
              {isAchievementActive
                ? "Achievements"
                : isEvidenceActive
                ? "My Evidence"
                : isCredentialsActive
                ? "My Credentials"
                : "Student Portal"}
            </strong>

          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

            {/* =================================================
                NETWORK STATUS
                ================================================= */}
            <div className="dashboard-badge success">Ethereum Sepolia</div>

            {/* =================================================
                CONNECTED WALLET
                ================================================= */}

            {connected ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingLeft: "16px", borderLeft: "1px solid var(--border)" }}>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>CONNECTED WALLET</span>
                  <strong style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text)" }}>
                    {shortenAddress(
                      displayWallet,
                    )}
                  </strong>
                </div>

                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--secondary-light)", color: "var(--secondary)", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: 700 }}>
                  S
                </div>

              </div>
            ) : (
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => {
                  void onConnect();
                }}
              >
                Connect Wallet
              </button>
            )}

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        <main className="dashboard-content">
          {children}
        </main>

      </div>

    </div>
  );
}