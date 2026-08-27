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
    <div className="student-page">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="student-sidebar">

        {/* =================================================
            BRAND
            ================================================= */}

        <div className="student-sidebar-brand">

          <Link
            to="/student"
            className="student-brand"
          >
            <div className="student-brand-mark">
              E
            </div>

            <div>
              <div className="student-brand-name">
                EduProof
              </div>

              <div className="student-brand-subtitle">
                Academic Credential Network
              </div>
            </div>
          </Link>

        </div>

        {/* =================================================
            NAVIGATION
            ================================================= */}

        <nav
          className="student-navigation"
          aria-label="Student navigation"
        >

          <div className="student-navigation-label">
            STUDENT PORTAL
          </div>

          {/* =================================================
              OVERVIEW
              ================================================= */}

          <Link
            to="/student"
            className={
              isOverviewActive
                ? "student-nav-item active"
                : "student-nav-item"
            }
            aria-current={
              isOverviewActive
                ? "page"
                : undefined
            }
          >
            <span
              className="student-nav-icon"
              aria-hidden="true"
            >
              ⌂
            </span>

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
                ? "student-nav-item active"
                : "student-nav-item"
            }
            aria-current={
              isCredentialsActive
                ? "page"
                : undefined
            }
          >
            <span
              className="student-nav-icon"
              aria-hidden="true"
            >
              ▣
            </span>

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
                ? "student-nav-item active"
                : "student-nav-item"
            }
            aria-current={
              isEvidenceActive
                ? "page"
                : undefined
            }
          >
            <span
              className="student-nav-icon"
              aria-hidden="true"
            >
              ◇
            </span>

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
                ? "student-nav-item active"
                : "student-nav-item"
            }
            aria-current={
              isAchievementActive
                ? "page"
                : undefined
            }
          >
            <span
              className="student-nav-icon"
              aria-hidden="true"
            >
              ✦
            </span>

            <span>
              Achievements
            </span>
          </Link>

        </nav>

        {/* =================================================
            ACHIEVEMENT QUICK ACTION
            ================================================= */}

        <div className="student-achievement-sidebar-card">

          <div
            className="student-achievement-sidebar-icon"
            aria-hidden="true"
          >
            ✦
          </div>

          <div>
            <strong>
              Proof of Achievement
            </strong>

            <p>
              Combine verified evidence into
              one cryptographic achievement.
            </p>

            <Link
              to="/student/achievements"
            >
              View achievements →
            </Link>
          </div>

        </div>

        {/* =================================================
            NETWORK
            ================================================= */}

        <div className="student-network-card">

          <div
            className="student-network-dot"
            aria-hidden="true"
          />

          <div>
            <small>
              BLOCKCHAIN SECURED
            </small>

            <strong>
              Sepolia Network
            </strong>
          </div>

        </div>

        {/* =================================================
            WALLET
            ================================================= */}

        <div className="student-sidebar-wallet">

          {connected ? (
            <>
              <div
                className="student-wallet-avatar"
                aria-hidden="true"
              >
                U
              </div>

              <div className="student-wallet-info">
                <span>
                  CONNECTED
                </span>

                <strong>
                  {shortenAddress(
                    displayWallet,
                  )}
                </strong>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="student-sidebar-connect"
              onClick={() => {
                void onConnect();
              }}
            >
              Connect Wallet
            </button>
          )}

        </div>

        {/* =================================================
            SIDEBAR FOOTER
            ================================================= */}

        <div className="student-sidebar-footer">

          <button
            type="button"
            onClick={() => {
              navigate("/");
            }}
            className="student-change-role"
          >
            ← Change role
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT AREA
          ===================================================== */}

      <div className="student-content">

        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="student-topbar">

          <div className="student-breadcrumb">

            <Link to="/student">
              EduProof
            </Link>

            <span aria-hidden="true">
              /
            </span>

            <strong>
              {isAchievementActive
                ? "Achievements"
                : isEvidenceActive
                ? "My Evidence"
                : isCredentialsActive
                ? "My Credentials"
                : "Student Portal"}
            </strong>

          </div>

          <div className="student-topbar-right">

            {/* =================================================
                NETWORK STATUS
                ================================================= */}

            <div className="student-network-status">

              <span
                className="student-network-status-dot"
                aria-hidden="true"
              />

              <span>
                Ethereum Sepolia
              </span>

            </div>

            {/* =================================================
                CONNECTED WALLET
                ================================================= */}

            {connected && (
              <div className="student-topbar-wallet">

                <div
                  className="student-topbar-avatar"
                  aria-hidden="true"
                >
                  U
                </div>

                <div>
                  <strong>
                    {shortenAddress(
                      displayWallet,
                    )}
                  </strong>

                  <span>
                    Connected
                  </span>
                </div>

              </div>
            )}

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
            ================================================= */}

        <main className="student-main-content">
          {children}
        </main>

      </div>

    </div>
  );
}