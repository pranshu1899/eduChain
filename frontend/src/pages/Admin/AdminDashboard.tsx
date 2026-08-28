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

import {
  getPendingHackathonOrganizationRequests,
  approveHackathonOrganizationRequest,
  rejectHackathonOrganizationRequest,
} from "../../services/hackathonOrganizationService";

import {
  approveHackathonOrganization,
  rejectHackathonOrganization,
} from "../../services/hackathonAccessService";

import type {
  HackathonOrganizationRequest,
} from "../../types/hackathon";

/* =====================================================
   ADMIN DASHBOARD
   ===================================================== */

export default function AdminDashboard() {
  /* =====================================================
     UNIVERSITY ISSUER STATE
     ===================================================== */

  const [wallet, setWallet] = useState("");
  const [authority, setAuthority] = useState("");

  const [requests, setRequests] =
    useState<IssuerRequest[]>([]);

  /* =====================================================
     HACKATHON ORGANIZATION STATE
     ===================================================== */

  const [
    hackathonRequests,
    setHackathonRequests,
  ] = useState<
    HackathonOrganizationRequest[]
  >([]);

  const [
    hackathonProcessing,
    setHackathonProcessing,
  ] = useState("");

  /* =====================================================
     GENERAL STATE
     ===================================================== */

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isAdmin, setIsAdmin] =
    useState(false);

  /* =====================================================
     LOAD ADMIN DASHBOARD
     ===================================================== */

  async function loadAdminDashboard() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed.",
        );
      }

      const provider =
        new BrowserProvider(
          window.ethereum,
        );

      /*
       * Read the currently selected
       * MetaMask account.
       *
       * Do not request accounts here.
       */
      const accounts =
        await provider.send(
          "eth_accounts",
          [],
        );

      if (!accounts.length) {
        setWallet("");
        setAuthority("");
        setIsAdmin(false);
        setRequests([]);
        setHackathonRequests([]);
        return;
      }

      const connectedWallet =
        String(accounts[0]);

      setWallet(
        connectedWallet,
      );

      /*
       * Read real contract authority.
       */
      const contractAuthority =
        await getAuthority();

      setAuthority(
        contractAuthority,
      );

      const admin =
        connectedWallet.toLowerCase() ===
        contractAuthority.toLowerCase();

      setIsAdmin(admin);

      /*
       * Non-admin wallets cannot load
       * administrative request data.
       */
      if (!admin) {
        setRequests([]);
        setHackathonRequests([]);
        return;
      }

      /*
       * UNIVERSITY ISSUER REQUESTS
       */
      const pendingIssuers =
        await getPendingIssuerRequests();

      setRequests(
        pendingIssuers,
      );

      /*
       * HACKATHON ORGANIZATION REQUESTS
       *
       * Current checkpoint uses the local
       * service abstraction.
       */
      const pendingHackathonOrganizations =
        getPendingHackathonOrganizationRequests();

      setHackathonRequests(
        pendingHackathonOrganizations,
      );
    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err,
      );

      setIsAdmin(false);
      setRequests([]);
      setHackathonRequests([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admin dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     ACCOUNT CHANGE LISTENER
     ===================================================== */

  useEffect(() => {
    void loadAdminDashboard();

    if (!window.ethereum) {
      return;
    }

    const ethereum =
      window.ethereum;

    const handleAccountsChanged =
      () => {
        void loadAdminDashboard();
      };

    ethereum.on(
      "accountsChanged",
      handleAccountsChanged,
    );

    return () => {
      ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged,
      );
    };
  }, []);

  /* =====================================================
     APPROVE UNIVERSITY ISSUER
     ===================================================== */

  async function handleApprove(
    issuerAddress: string,
  ) {
    try {
      setProcessing(
        issuerAddress,
      );

      setError("");
      setMessage("");

      const txHash =
        await authorizeIssuer(
          issuerAddress,
        );

      setMessage(
        `Issuer approved successfully. Transaction: ${txHash}`,
      );

      const pending =
        await getPendingIssuerRequests();

      setRequests(
        pending,
      );
    } catch (err) {
      console.error(
        "Approve issuer error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to approve issuer.",
      );
    } finally {
      setProcessing("");
    }
  }

  /* =====================================================
     REJECT UNIVERSITY ISSUER
     ===================================================== */

  async function handleReject(
    issuerAddress: string,
  ) {
    try {
      setProcessing(
        issuerAddress,
      );

      setError("");
      setMessage("");

      const txHash =
        await rejectIssuer(
          issuerAddress,
        );

      setMessage(
        `Issuer rejected successfully. Transaction: ${txHash}`,
      );

      const pending =
        await getPendingIssuerRequests();

      setRequests(
        pending,
      );
    } catch (err) {
      console.error(
        "Reject issuer error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject issuer.",
      );
    } finally {
      setProcessing("");
    }
  }

  /* =====================================================
     APPROVE HACKATHON ORGANIZATION
     ===================================================== */

  async function handleApproveHackathonOrganization(
    request: HackathonOrganizationRequest,
  ) {
    try {
      setHackathonProcessing(
        request.id,
      );

      setError("");
      setMessage("");

      // 1. Approve on-chain first
      const tx = await approveHackathonOrganization(
        request.walletAddress,
      );
      
      if (!tx) {
        throw new Error("Transaction was not confirmed.");
      }

      // 2. Update local metadata cache
      const approved =
        approveHackathonOrganizationRequest(
          request.id,
          wallet,
        );

      setMessage(
        `${approved.organizationName} has been approved as a hackathon organization.`,
      );

      setHackathonRequests(
        getPendingHackathonOrganizationRequests(),
      );
    } catch (err) {
      console.error(
        "Approve hackathon organization error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to approve hackathon organization.",
      );
    } finally {
      setHackathonProcessing("");
    }
  }

  /* =====================================================
     REJECT HACKATHON ORGANIZATION
     ===================================================== */

  async function handleRejectHackathonOrganization(
    request: HackathonOrganizationRequest,
  ) {
    try {
      setHackathonProcessing(
        request.id,
      );

      setError("");
      setMessage("");

      // 1. Reject on-chain first
      const tx = await rejectHackathonOrganization(
        request.walletAddress,
      );

      if (!tx) {
        throw new Error("Transaction was not confirmed.");
      }

      // 2. Update local metadata cache
      const rejected =
        rejectHackathonOrganizationRequest(
          request.id,
          wallet,
        );

      setMessage(
        `${rejected.organizationName} has been rejected.`,
      );

      setHackathonRequests(
        getPendingHackathonOrganizationRequests(),
      );
    } catch (err) {
      console.error(
        "Reject hackathon organization error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject hackathon organization.",
      );
    } finally {
      setHackathonProcessing("");
    }
  }

  /* =====================================================
     ADDRESS FORMATTER
     ===================================================== */

  function shortenAddress(
    address: string,
  ) {
    if (!address) {
      return "";
    }

    return `${address.slice(
      0,
      6,
    )}...${address.slice(-4)}`;
  }

  /* =====================================================
     UI
     ===================================================== */

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
            Platform
            <br />
            Administration
          </h1>

          <p
            style={{
              marginTop: "18px",
              maxWidth: "720px",
              color: "#8f94aa",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Manage trusted university issuers
            and approve organizations that can
            participate in the EduProof hackathon
            certification network.
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
              authority wallet can access
              platform administration.
            </p>
          </div>
        )}

        {/* =================================================
            ADMIN CONTENT
            ================================================= */}

        {!loading && isAdmin && (
          <>
            {/* =================================================
                AUTHORITY VERIFIED
                ================================================= */}

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
                This wallet can manage issuer
                applications and hackathon
                organization applications.
              </p>
            </div>

            {/* =================================================
                GLOBAL SUCCESS
                ================================================= */}

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

            {/* =================================================
                GLOBAL ERROR
                ================================================= */}

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
                UNIVERSITY ISSUER REQUESTS
                ================================================= */}

            <section
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
                    University Network
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
                  onClick={() =>
                    void loadAdminDashboard()
                  }
                  disabled={
                    loading ||
                    !!processing ||
                    !!hackathonProcessing
                  }
                  style={{
                    padding:
                      "11px 18px",
                    border:
                      "1px solid #343750",
                    borderRadius:
                      "10px",
                    background:
                      "#171928",
                    color:
                      "#dfe2f4",
                    cursor:
                      "pointer",
                    fontWeight:
                      600,
                  }}
                >
                  Refresh
                </button>
              </div>

              {requests.length === 0 && (
                <div
                  style={{
                    padding:
                      "50px 20px",
                    textAlign:
                      "center",
                    border:
                      "1px dashed #303349",
                    borderRadius:
                      "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "40px",
                      marginBottom:
                        "14px",
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
                      color:
                        "#777d94",
                      margin: 0,
                    }}
                  >
                    There are currently
                    no university
                    applications
                    waiting for
                    approval.
                  </p>
                </div>
              )}

              {requests.map(
                (request) => {
                  const isProcessing =
                    processing.toLowerCase() ===
                    request.wallet.toLowerCase();

                  return (
                    <div
                      key={
                        request.wallet
                      }
                      style={{
                        background:
                          "#080914",
                        border:
                          "1px solid #292c40",
                        borderRadius:
                          "16px",
                        padding:
                          "24px",
                        marginBottom:
                          "16px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap:
                            "20px",
                          marginBottom:
                            "22px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color:
                                "#737991",
                              fontSize:
                                "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom:
                                "7px",
                            }}
                          >
                            Institution
                          </div>

                          <div
                            style={{
                              fontSize:
                                "18px",
                              fontWeight:
                                700,
                            }}
                          >
                            {
                              request.institutionName
                            }
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              color:
                                "#737991",
                              fontSize:
                                "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom:
                                "7px",
                            }}
                          >
                            Institution ID
                          </div>

                          <div
                            style={{
                              color:
                                "#cbd0ff",
                              fontWeight:
                                600,
                            }}
                          >
                            {
                              request.institutionId
                            }
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              color:
                                "#737991",
                              fontSize:
                                "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom:
                                "7px",
                            }}
                          >
                            Applicant Wallet
                          </div>

                          <code
                            style={{
                              color:
                                "#a99cff",
                              wordBreak:
                                "break-all",
                            }}
                          >
                            {
                              request.wallet
                            }
                          </code>
                        </div>

                        <div>
                          <div
                            style={{
                              color:
                                "#737991",
                              fontSize:
                                "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom:
                                "7px",
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
                              fontWeight:
                                700,
                            }}
                          >
                            PENDING
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "12px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            void handleApprove(
                              request.wallet,
                            )
                          }
                          disabled={
                            !!processing ||
                            !!hackathonProcessing
                          }
                          style={{
                            flex:
                              "1 1 180px",
                            padding:
                              "13px 18px",
                            border:
                              "none",
                            borderRadius:
                              "10px",
                            background:
                              isProcessing
                                ? "#315f43"
                                : "#247a48",
                            color:
                              "#ffffff",
                            fontWeight:
                              700,
                            cursor:
                              processing ||
                              hackathonProcessing
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
                            void handleReject(
                              request.wallet,
                            )
                          }
                          disabled={
                            !!processing ||
                            !!hackathonProcessing
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
                              "#21131a",
                            color:
                              "#ff9aaa",
                            fontWeight:
                              700,
                            cursor:
                              processing ||
                              hackathonProcessing
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
                },
              )}
            </section>

            {/* =================================================
                HACKATHON ORGANIZATION REQUESTS
                ================================================= */}

            <section
              style={{
                background: "#10111d",
                border: "1px solid #25273a",
                borderRadius: "18px",
                padding: "28px",
                marginTop: "24px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: "16px",
                  marginBottom:
                    "24px",
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        "#8b7cff",
                      fontSize:
                        "12px",
                      fontWeight:
                        700,
                      letterSpacing:
                        "0.1em",
                      textTransform:
                        "uppercase",
                      marginBottom:
                        "8px",
                    }}
                  >
                    Hackathon Network
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        "28px",
                    }}
                  >
                    Organization Requests
                  </h2>

                  <p
                    style={{
                      color:
                        "#777d94",
                      lineHeight:
                        1.6,
                      marginBottom:
                        0,
                      marginTop:
                        "10px",
                    }}
                  >
                    Review organizations
                    requesting
                    authorization to
                    issue batch
                    hackathon
                    certificates.
                  </p>
                </div>

                <div
                  style={{
                    padding:
                      "8px 12px",
                    borderRadius:
                      "999px",
                    background:
                      "#1b1833",
                    color:
                      "#b6adff",
                    fontSize:
                      "12px",
                    fontWeight:
                      700,
                  }}
                >
                  {
                    hackathonRequests.length
                  }{" "}
                  Pending
                </div>
              </div>

              {/* EMPTY */}

              {hackathonRequests.length ===
                0 && (
                <div
                  style={{
                    padding:
                      "45px 20px",
                    textAlign:
                      "center",
                    border:
                      "1px dashed #303349",
                    borderRadius:
                      "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "36px",
                      marginBottom:
                        "12px",
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
                      color:
                        "#777d94",
                      margin: 0,
                    }}
                  >
                    No hackathon
                    organizations
                    are currently
                    waiting for
                    approval.
                  </p>
                </div>
              )}

              {/* REQUESTS */}

              {hackathonRequests.map(
                (request) => {
                  const isProcessing =
                    hackathonProcessing ===
                    request.id;

                  return (
                    <div
                      key={
                        request.id
                      }
                      style={{
                        background:
                          "#080914",
                        border:
                          "1px solid #292c40",
                        borderRadius:
                          "16px",
                        padding:
                          "24px",
                        marginBottom:
                          "16px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap:
                            "20px",
                          marginBottom:
                            "20px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color:
                                "#737991",
                              fontSize:
                                "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom:
                                "7px",
                            }}
                          >
                            Organization
                          </div>

                          <div
                            style={{
                              fontSize:
                                "18px",
                              fontWeight:
                                700,
                            }}
                          >
                            {
                              request.organizationName
                            }
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              color:
                                "#737991",
                              fontSize:
                                "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom:
                                "7px",
                            }}
                          >
                            Organizer
                          </div>

                          <div>
                            {
                              request.organizerName
                            }
                          </div>

                          <div
                            style={{
                              color:
                                "#8f94aa",
                              fontSize:
                                "13px",
                              marginTop:
                                "4px",
                            }}
                          >
                            {
                              request.organizerEmail
                            }
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              color:
                                "#737991",
                              fontSize:
                                "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom:
                                "7px",
                            }}
                          >
                            Wallet
                          </div>

                          <code
                            style={{
                              color:
                                "#a99cff",
                              wordBreak:
                                "break-all",
                            }}
                          >
                            {
                              request.walletAddress
                            }
                          </code>
                        </div>

                        <div>
                          <div
                            style={{
                              color:
                                "#737991",
                              fontSize:
                                "11px",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.1em",
                              marginBottom:
                                "7px",
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
                              fontWeight:
                                700,
                            }}
                          >
                            PENDING
                          </span>
                        </div>
                      </div>

                      {/* DESCRIPTION */}

                      <div
                        style={{
                          padding:
                            "16px",
                          background:
                            "#10111d",
                          borderRadius:
                            "12px",
                          marginBottom:
                            "14px",
                        }}
                      >
                        <div
                          style={{
                            color:
                              "#737991",
                            fontSize:
                              "11px",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.1em",
                            marginBottom:
                              "7px",
                          }}
                        >
                          Organization
                          Description
                        </div>

                        <p
                          style={{
                            color:
                              "#b9bed0",
                            lineHeight:
                              1.6,
                            margin: 0,
                          }}
                        >
                          {
                            request.organizationDescription
                          }
                        </p>
                      </div>

                      {/* REASON */}

                      <div
                        style={{
                          padding:
                            "16px",
                          background:
                            "#10111d",
                          borderRadius:
                            "12px",
                          marginBottom:
                            "14px",
                        }}
                      >
                        <div
                          style={{
                            color:
                              "#737991",
                            fontSize:
                              "11px",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.1em",
                            marginBottom:
                              "7px",
                          }}
                        >
                          Application
                          Reason
                        </div>

                        <p
                          style={{
                            color:
                              "#b9bed0",
                            lineHeight:
                              1.6,
                            margin: 0,
                          }}
                        >
                          {
                            request.reason
                          }
                        </p>
                      </div>

                      {/* WEBSITE */}

                      {request.website && (
                        <div
                          style={{
                            marginBottom:
                              "20px",
                            color:
                              "#8f94aa",
                            fontSize:
                              "14px",
                          }}
                        >
                          Website:{" "}
                          {request.website}
                        </div>
                      )}

                      {/* ACTIONS */}

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "12px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            void handleApproveHackathonOrganization(
                              request,
                            )
                          }
                          disabled={
                            !!processing ||
                            !!hackathonProcessing
                          }
                          style={{
                            flex:
                              "1 1 180px",
                            padding:
                              "13px 18px",
                            border:
                              "none",
                            borderRadius:
                              "10px",
                            background:
                              isProcessing
                                ? "#315f43"
                                : "#247a48",
                            color:
                              "#ffffff",
                            fontWeight:
                              700,
                            cursor:
                              processing ||
                              hackathonProcessing
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Approve Organization"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleRejectHackathonOrganization(
                              request,
                            )
                          }
                          disabled={
                            !!processing ||
                            !!hackathonProcessing
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
                              "#21131a",
                            color:
                              "#ff9aaa",
                            fontWeight:
                              700,
                            cursor:
                              processing ||
                              hackathonProcessing
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Reject Organization"}
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </section>
          </>
        )}

        {/* =================================================
            LOADING
            ================================================= */}

        {loading && (
          <div
            style={{
              background:
                "#10111d",
              border:
                "1px solid #25273a",
              borderRadius:
                "18px",
              padding:
                "50px",
              textAlign:
                "center",
              color:
                "#8f94aa",
            }}
          >
            Checking authority access...
          </div>
        )}

        {/* =================================================
            FOOTER
            ================================================= */}

        <div
          style={{
            marginTop:
              "28px",
            textAlign:
              "center",
            color:
              "#5f6478",
            fontSize:
              "13px",
          }}
        >
          EduProof • Ethereum Sepolia
        </div>
      </div>
    </div>
  );
}