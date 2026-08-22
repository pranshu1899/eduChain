import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

import {
  getAuthority,
  getPendingIssuerRequests,
  authorizeIssuer,
  rejectIssuer,
} from "../../config/contractService";

import type {
  IssuerRequest,
} from "../../config/contractService";

export default function AdminDashboard() {
  const [wallet, setWallet] = useState("");
  const [authority, setAuthority] = useState("");
  const [requests, setRequests] =
    useState<IssuerRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  /*
   * =====================================================
   * LOAD ADMIN DASHBOARD
   * =====================================================
   */

  async function loadAdminDashboard() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed."
        );
      }

      const provider =
        new BrowserProvider(
          window.ethereum
        );

      /*
       * IMPORTANT:
       *
       * Do NOT use eth_requestAccounts here.
       *
       * We only want to READ the currently
       * selected MetaMask account.
       */
      const accounts =
        await provider.send(
          "eth_accounts",
          []
        );

      /*
       * No wallet connected
       */
      if (!accounts.length) {
        setWallet("");
        setAuthority("");
        setIsAdmin(false);
        setRequests([]);
        return;
      }

      const connectedWallet =
        accounts[0];

      setWallet(
        connectedWallet
      );

      /*
       * Get the real authority directly
       * from the deployed contract.
       */
      const contractAuthority =
        await getAuthority();

      setAuthority(
        contractAuthority
      );

      /*
       * Compare the currently selected
       * MetaMask account with the contract
       * authority.
       */
      const admin =
        connectedWallet.toLowerCase() ===
        contractAuthority.toLowerCase();

      setIsAdmin(admin);

      /*
       * If this is NOT the authority,
       * don't even load pending requests.
       */
      if (!admin) {
        setRequests([]);
        return;
      }

      /*
       * Authority only:
       * load pending issuer applications.
       */
      const pending =
        await getPendingIssuerRequests();

      setRequests(
        pending
      );
    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setIsAdmin(false);
      setRequests([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * META MASK ACCOUNT CHANGE LISTENER
   * =====================================================
   *
   * This is the important part.
   *
   * When the user changes:
   *
   * Account 2 → Account 3
   *
   * MetaMask fires accountsChanged.
   *
   * We immediately reload the dashboard.
   */

  useEffect(() => {
    loadAdminDashboard();

    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged =
      () => {
        loadAdminDashboard();
      };

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    return () => {
      window.ethereum?.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  /*
   * =====================================================
   * APPROVE ISSUER
   * =====================================================
   */

  async function handleApprove(
    issuerAddress: string
  ) {
    try {
      setProcessing(
        issuerAddress
      );

      setError("");
      setMessage("");

      const txHash =
        await authorizeIssuer(
          issuerAddress
        );

      setMessage(
        `Issuer approved successfully. Transaction: ${txHash}`
      );

      /*
       * Refresh pending applications
       * after successful approval.
       */
      const pending =
        await getPendingIssuerRequests();

      setRequests(
        pending
      );
    } catch (err) {
      console.error(
        "Approve issuer error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to approve issuer."
      );
    } finally {
      setProcessing("");
    }
  }

  /*
   * =====================================================
   * REJECT ISSUER
   * =====================================================
   */

  async function handleReject(
    issuerAddress: string
  ) {
    try {
      setProcessing(
        issuerAddress
      );

      setError("");
      setMessage("");

      const txHash =
        await rejectIssuer(
          issuerAddress
        );

      setMessage(
        `Issuer rejected successfully. Transaction: ${txHash}`
      );

      /*
       * Refresh pending applications
       * after successful rejection.
       */
      const pending =
        await getPendingIssuerRequests();

      setRequests(
        pending
      );
    } catch (err) {
      console.error(
        "Reject issuer error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject issuer."
      );
    } finally {
      setProcessing("");
    }
  }

  /*
   * =====================================================
   * ADDRESS FORMATTER
   * =====================================================
   */

  function shortenAddress(
    address: string
  ) {
    if (!address) {
      return "";
    }

    return `${address.slice(
      0,
      6
    )}...${address.slice(-4)}`;
  }

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070814",
        color: "#f5f7ff",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* =================================================
            HEADER
            ================================================= */}

        <div
          style={{
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              color: "#8b7cff",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            EduProof Administration
          </div>

          <h1
            style={{
              margin: 0,
              fontSize:
                "clamp(36px, 6vw, 58px)",
              lineHeight: 1.05,
            }}
          >
            Issuer
            <br />
            Approvals
          </h1>

          <p
            style={{
              marginTop: "18px",
              maxWidth: "700px",
              color: "#8f94aa",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Review university applications
            and authorize institutions to
            issue blockchain-backed academic
            credentials.
          </p>
        </div>

        {/* =================================================
            WALLET / AUTHORITY
            ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#10111d",
              border: "1px solid #25273a",
              borderRadius: "18px",
              padding: "24px",
            }}
          >
            <div
              style={{
                color: "#737991",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "10px",
              }}
            >
              Connected Wallet
            </div>

            <code
              style={{
                color: "#cbd0ff",
                wordBreak: "break-all",
              }}
            >
              {wallet
                ? shortenAddress(wallet)
                : "Not connected"}
            </code>
          </div>

          <div
            style={{
              background: "#10111d",
              border: "1px solid #25273a",
              borderRadius: "18px",
              padding: "24px",
            }}
          >
            <div
              style={{
                color: "#737991",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "10px",
              }}
            >
              Contract Authority
            </div>

            <code
              style={{
                color: "#cbd0ff",
                wordBreak: "break-all",
              }}
            >
              {authority
                ? shortenAddress(authority)
                : "Loading..."}
            </code>
          </div>
        </div>

        {/* =================================================
            ACCESS DENIED
            ================================================= */}

        {!loading && !isAdmin && (
          <div
            style={{
              background: "#29141a",
              border: "1px solid #6d2635",
              borderRadius: "18px",
              padding: "28px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Access Denied
            </h2>

            <p
              style={{
                color: "#ff9aaa",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              This wallet is not the EduProof
              contract authority. Only the
              authority wallet can approve or
              reject issuer applications.
            </p>
          </div>
        )}

        {/* =================================================
            ADMIN CONTENT
            ================================================= */}

        {!loading && isAdmin && (
          <>
            {/* AUTHORITY VERIFIED */}

            <div
              style={{
                background: "#0d2117",
                border: "1px solid #1d5c38",
                borderRadius: "18px",
                padding: "22px 24px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#4ade80",
                  }}
                />

                <strong>
                  Authority access verified
                </strong>
              </div>

              <p
                style={{
                  color: "#9bc9aa",
                  marginBottom: 0,
                  lineHeight: 1.5,
                }}
              >
                This wallet can approve or
                reject university issuer
                applications.
              </p>
            </div>

            {/* SUCCESS MESSAGE */}

            {message && (
              <div
                style={{
                  background: "#102719",
                  border: "1px solid #27613d",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  color: "#67e69a",
                  marginBottom: "20px",
                  wordBreak: "break-word",
                }}
              >
                {message}
              </div>
            )}

            {/* ERROR MESSAGE */}

            {error && (
              <div
                style={{
                  background: "#29141a",
                  border: "1px solid #6d2635",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  color: "#ff7b8c",
                  marginBottom: "20px",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {/* =================================================
                PENDING APPLICATIONS
                ================================================= */}

            <div
              style={{
                background: "#10111d",
                border: "1px solid #25273a",
                borderRadius: "18px",
                padding: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "24px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#8b7cff",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Pending Applications
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: "28px",
                    }}
                  >
                    Issuer Requests
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    loadAdminDashboard
                  }
                  disabled={
                    loading ||
                    !!processing
                  }
                  style={{
                    padding: "11px 18px",
                    border:
                      "1px solid #343750",
                    borderRadius: "10px",
                    background: "#171928",
                    color: "#dfe2f4",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Refresh
                </button>
              </div>

              {/* EMPTY STATE */}

              {requests.length === 0 && (
                <div
                  style={{
                    padding: "50px 20px",
                    textAlign: "center",
                    border:
                      "1px dashed #303349",
                    borderRadius: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "40px",
                      marginBottom: "14px",
                    }}
                  >
                    ✓
                  </div>

                  <h3
                    style={{
                      margin:
                        "0 0 8px",
                    }}
                  >
                    No Pending Requests
                  </h3>

                  <p
                    style={{
                      color: "#777d94",
                      margin: 0,
                    }}
                  >
                    There are currently no
                    university applications
                    waiting for approval.
                  </p>
                </div>
              )}

              {/* REQUEST CARDS */}

              {requests.map(
                (request) => {
                  const isProcessing =
                    processing.toLowerCase() ===
                    request.wallet.toLowerCase();

                  return (
                    <div
                      key={request.wallet}
                      style={{
                        background: "#080914",
                        border:
                          "1px solid #292c40",
                        borderRadius: "16px",
                        padding: "24px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "20px",
                          marginBottom: "22px",
                        }}
                      >
                        {/* INSTITUTION */}

                        <div>
                          <div
                            style={{
                              color: "#737991",
                              fontSize: "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom: "7px",
                            }}
                          >
                            Institution
                          </div>

                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                            }}
                          >
                            {
                              request.institutionName
                            }
                          </div>
                        </div>

                        {/* INSTITUTION ID */}

                        <div>
                          <div
                            style={{
                              color: "#737991",
                              fontSize: "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom: "7px",
                            }}
                          >
                            Institution ID
                          </div>

                          <div
                            style={{
                              color: "#cbd0ff",
                              fontWeight: 600,
                            }}
                          >
                            {
                              request.institutionId
                            }
                          </div>
                        </div>

                        {/* WALLET */}

                        <div>
                          <div
                            style={{
                              color: "#737991",
                              fontSize: "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom: "7px",
                            }}
                          >
                            Applicant Wallet
                          </div>

                          <code
                            style={{
                              color: "#a99cff",
                              wordBreak:
                                "break-all",
                            }}
                          >
                            {
                              request.wallet
                            }
                          </code>
                        </div>

                        {/* STATUS */}

                        <div>
                          <div
                            style={{
                              color: "#737991",
                              fontSize: "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom: "7px",
                            }}
                          >
                            Status
                          </div>

                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "6px 11px",
                              borderRadius:
                                "999px",
                              background:
                                "#30270d",
                              color:
                                "#facc15",
                              fontSize:
                                "12px",
                              fontWeight: 700,
                            }}
                          >
                            PENDING
                          </span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(
                              request.wallet
                            )
                          }
                          disabled={
                            !!processing
                          }
                          style={{
                            flex:
                              "1 1 180px",
                            padding:
                              "13px 18px",
                            border: "none",
                            borderRadius:
                              "10px",
                            background:
                              isProcessing
                                ? "#315f43"
                                : "#247a48",
                            color:
                              "#ffffff",
                            fontWeight: 700,
                            cursor:
                              processing
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Approve Issuer"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleReject(
                              request.wallet
                            )
                          }
                          disabled={
                            !!processing
                          }
                          style={{
                            flex:
                              "1 1 180px",
                            padding:
                              "13px 18px",
                            border:
                              "1px solid #713341",
                            borderRadius:
                              "10px",
                            background:
                              isProcessing
                                ? "#321a20"
                                : "#21131a",
                            color:
                              "#ff9aaa",
                            fontWeight: 700,
                            cursor:
                              processing
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Reject Issuer"}
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}

        {/* =================================================
            LOADING
            ================================================= */}

        {loading && (
          <div
            style={{
              background: "#10111d",
              border:
                "1px solid #25273a",
              borderRadius: "18px",
              padding: "50px",
              textAlign: "center",
              color: "#8f94aa",
            }}
          >
            Checking authority access...
          </div>
        )}

        {/* FOOTER */}

        <div
          style={{
            marginTop: "28px",
            textAlign: "center",
            color: "#5f6478",
            fontSize: "13px",
          }}
        >
          EduProof • Ethereum Sepolia
        </div>
      </div>
    </div>
  );
}