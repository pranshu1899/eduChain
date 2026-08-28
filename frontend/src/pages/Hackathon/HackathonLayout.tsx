import type { ReactNode } from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

interface HackathonLayoutProps {
  children: ReactNode;
}

export default function HackathonLayout({
  children,
}: HackathonLayoutProps) {
  const navigate =
    useNavigate();

  function navClass({
    isActive,
  }: {
    isActive: boolean;
  }) {
    return isActive
      ? "hackathon-nav-link active"
      : "hackathon-nav-link";
  }

  return (
    <div className="student-page-shell">
      <aside
        style={{
          width: "270px",
          minWidth: "270px",
          minHeight: "100vh",
          padding: "1.5rem",
          borderRight:
            "1px solid rgba(255,255,255,0.08)",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
        }}
      >
        {/* BRAND */}

        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            color: "inherit",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                border:
                  "1px solid rgba(130,100,255,0.6)",
                background:
                  "rgba(110,80,255,0.12)",
                fontWeight: 800,
                fontSize: "1.25rem",
              }}
            >
              E
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "1.05rem",
                }}
              >
                EduProof
              </strong>

              <span
                style={{
                  opacity: 0.55,
                  fontSize: "0.7rem",
                }}
              >
                Academic Credential Network
              </span>
            </div>
          </div>
        </button>

        {/* PORTAL TITLE */}

        <div
          style={{
            marginTop: "2.5rem",
            marginBottom: "1rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              opacity: 0.5,
            }}
          >
            HACKATHON NETWORK
          </p>

          <h2
            style={{
              marginTop: "0.4rem",
              fontSize: "1rem",
            }}
          >
            Organization Portal
          </h2>
        </div>

        {/* NAVIGATION */}

        <nav
          style={{
            display: "grid",
            gap: "0.35rem",
          }}
        >
          <NavLink
            to="/hackathon"
            end
            className={navClass}
          >
            <span>⌂</span>
            Overview
          </NavLink>

          <NavLink
            to="/hackathon/create"
            className={navClass}
          >
            <span>＋</span>
            Create Hackathon
          </NavLink>
        </nav>

        {/* INFO */}

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            borderRadius: "14px",
            border:
              "1px solid rgba(255,255,255,0.08)",
            background:
              "rgba(255,255,255,0.025)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow:
                  "0 0 10px rgba(74,222,128,0.8)",
              }}
            />

            <strong
              style={{
                fontSize: "0.8rem",
              }}
            >
              Blockchain Secured
            </strong>
          </div>

          <p
            style={{
              margin: 0,
              opacity: 0.55,
              fontSize: "0.72rem",
            }}
          >
            Ethereum Sepolia Network
          </p>
        </div>

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          style={{
            marginTop: "1.5rem",
            width: "100%",
          }}
        >
          ← Change Role
        </button>
      </aside>

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <header
          style={{
            height: "84px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 2rem",
            borderBottom:
              "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#4ade80",
              }}
            />

            <span
              style={{
                fontSize: "0.85rem",
                opacity: 0.8,
              }}
            >
              Ethereum Sepolia
            </span>
          </div>
        </header>

        <main
          style={{
            width: "100%",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}