import { useEffect, useState } from "react";
import {
  BrowserProvider,
} from "ethers";
import {
  getCurrentIssuer,
  requestIssuer,
  ISSUER_STATUS,
} from "../config/contractService";
import "../App.css";

export default function RequestIssuer() {
  const [wallet, setWallet] =
    useState("");

  const [institutionName, setInstitutionName] =
    useState("");

  const [institutionId, setInstitutionId] =
    useState("");

  const [status, setStatus] =
    useState<number>(ISSUER_STATUS.NONE);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      setLoading(true);
      setError("");

      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed."
        );
      }

      const provider =
        new BrowserProvider(
          window.ethereum
        );

      const accounts =
        await provider.send(
          "eth_requestAccounts",
          []
        );

      if (!accounts.length) {
        throw new Error(
          "Please connect a MetaMask wallet."
        );
      }

      const address =
        accounts[0];

      setWallet(address);

      const issuer =
        await getCurrentIssuer();

      setStatus(
        issuer.status
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load wallet."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!institutionName.trim()) {
      setError(
        "Institution name is required."
      );
      return;
    }

    if (!institutionId.trim()) {
      setError(
        "Institution ID is required."
      );
      return;
    }

    try {
      setSubmitting(true);

      const txHash =
        await requestIssuer(
          institutionName,
          institutionId
        );

      setMessage(
        `Application submitted successfully. Transaction: ${txHash}`
      );

      setStatus(
        ISSUER_STATUS.PENDING
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit issuer application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusLabel() {
    switch (status) {
      case ISSUER_STATUS.PENDING:
        return "Pending";

      case ISSUER_STATUS.AUTHORIZED:
        return "Authorized";

      case ISSUER_STATUS.SUSPENDED:
        return "Suspended";

      case ISSUER_STATUS.REVOKED:
        return "Revoked";

      case ISSUER_STATUS.REJECTED:
        return "Rejected";

      default:
        return "Not Registered";
    }
  }

  function getStatusDescription() {
    switch (status) {
      case ISSUER_STATUS.PENDING:
        return "Your application is waiting for approval from the EduProof authority.";

      case ISSUER_STATUS.AUTHORIZED:
        return "This wallet is authorized to issue academic credentials.";

      case ISSUER_STATUS.SUSPENDED:
        return "This issuer is currently suspended and cannot issue credentials.";

      case ISSUER_STATUS.REVOKED:
        return "Issuer authorization has been revoked.";

      case ISSUER_STATUS.REJECTED:
        return "Your issuer application was rejected.";

      default:
        return "This wallet has not requested issuer authorization.";
    }
  }

  const canApply =
    status === ISSUER_STATUS.NONE ||
    status === ISSUER_STATUS.REJECTED;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "#070814",
        color: "#f5f7ff",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

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
              letterSpacing:
                "0.12em",
              textTransform:
                "uppercase",
              marginBottom: "10px",
            }}
          >
            EduProof Issuer Network
          </div>

          <h1
            style={{
              fontSize:
                "clamp(36px, 6vw, 58px)",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Become a
            <br />
            University Issuer
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
            Submit your institution for
            verification. An EduProof
            authority must approve your
            wallet before it can issue
            blockchain-backed academic
            credentials.
          </p>
        </div>

        {/* WALLET */}

        <div
          style={{
            background:
              "#10111d",
            border:
              "1px solid #25273a",
            borderRadius:
              "18px",
            padding:
              "24px",
            marginBottom:
              "24px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#737991",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.1em",
              marginBottom:
                "10px",
            }}
          >
            Connected Wallet
          </div>

          {loading ? (
            <div
              style={{
                color: "#8f94aa",
              }}
            >
              Loading wallet...
            </div>
          ) : (
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "12px",
                flexWrap:
                  "wrap",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius:
                    "50%",
                  background:
                    "#4ade80",
                }}
              />

              <code
                style={{
                  color: "#cbd0ff",
                  wordBreak:
                    "break-all",
                }}
              >
                {wallet ||
                  "Wallet not connected"}
              </code>
            </div>
          )}
        </div>

        {/* CURRENT STATUS */}

        <div
          style={{
            background:
              "#10111d",
            border:
              "1px solid #25273a",
            borderRadius:
              "18px",
            padding:
              "28px",
            marginBottom:
              "24px",
          }}
        >
          <div
            style={{
              color: "#737991",
              fontSize: "12px",
              textTransform:
                "uppercase",
              letterSpacing:
                "0.1em",
              marginBottom:
                "12px",
            }}
          >
            Issuer Status
          </div>

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "14px",
              marginBottom:
                "12px",
            }}
          >
            <div
              style={{
                padding:
                  "8px 14px",
                borderRadius:
                  "999px",
                background:
                  status ===
                  ISSUER_STATUS.AUTHORIZED
                    ? "#12351f"
                    : status ===
                      ISSUER_STATUS.PENDING
                    ? "#30270d"
                    : "#211d35",
                color:
                  status ===
                  ISSUER_STATUS.AUTHORIZED
                    ? "#4ade80"
                    : status ===
                      ISSUER_STATUS.PENDING
                    ? "#facc15"
                    : "#a99cff",
                fontWeight: 700,
                fontSize:
                  "13px",
              }}
            >
              {getStatusLabel()}
            </div>
          </div>

          <p
            style={{
              color: "#8f94aa",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {getStatusDescription()}
          </p>
        </div>

        {/* AUTHORIZED */}

        {status ===
          ISSUER_STATUS.AUTHORIZED && (
          <div
            style={{
              background:
                "#0d2117",
              border:
                "1px solid #1d5c38",
              borderRadius:
                "18px",
              padding:
                "28px",
              marginBottom:
                "24px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom:
                  "10px",
              }}
            >
              ✓ Issuer Authorized
            </h2>

            <p
              style={{
                color:
                  "#9bc9aa",
                lineHeight:
                  1.6,
              }}
            >
              This wallet has already
              been approved by the
              EduProof authority. You
              can use the University
              Portal to issue credentials.
            </p>
          </div>
        )}

        {/* APPLICATION FORM */}

        {canApply && (
          <form
            onSubmit={
              handleSubmit
            }
            style={{
              background:
                "#10111d",
              border:
                "1px solid #25273a",
              borderRadius:
                "18px",
              padding:
                "32px",
            }}
          >
            <div
              style={{
                marginBottom:
                  "28px",
              }}
            >
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
                Institution Application
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize:
                    "28px",
                }}
              >
                Institution Details
              </h2>

              <p
                style={{
                  color:
                    "#8f94aa",
                  lineHeight:
                    1.6,
                }}
              >
                These details will be
                registered on-chain if
                the authority approves
                your application.
              </p>
            </div>

            {/* INSTITUTION NAME */}

            <div
              style={{
                marginBottom:
                  "22px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "8px",
                  fontWeight:
                    600,
                }}
              >
                Institution Name
              </label>

              <input
                type="text"
                value={
                  institutionName
                }
                onChange={(e) =>
                  setInstitutionName(
                    e.target.value
                  )
                }
                placeholder="ABC University"
                disabled={
                  submitting
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "14px 16px",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid #303349",
                  background:
                    "#080914",
                  color:
                    "#ffffff",
                  fontSize:
                    "15px",
                  outline:
                    "none",
                }}
              />
            </div>

            {/* INSTITUTION ID */}

            <div
              style={{
                marginBottom:
                  "26px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "8px",
                  fontWeight:
                    600,
                }}
              >
                Institution ID
              </label>

              <input
                type="text"
                value={
                  institutionId
                }
                onChange={(e) =>
                  setInstitutionId(
                    e.target.value
                  )
                }
                placeholder="ABC-001"
                disabled={
                  submitting
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "14px 16px",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid #303349",
                  background:
                    "#080914",
                  color:
                    "#ffffff",
                  fontSize:
                    "15px",
                  outline:
                    "none",
                }}
              />
            </div>

            {/* ERROR */}

            {error && (
              <div
                style={{
                  padding:
                    "14px 16px",
                  borderRadius:
                    "12px",
                  background:
                    "#29141a",
                  border:
                    "1px solid #6d2635",
                  color:
                    "#ff7b8c",
                  marginBottom:
                    "20px",
                  lineHeight:
                    1.5,
                }}
              >
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div
                style={{
                  padding:
                    "14px 16px",
                  borderRadius:
                    "12px",
                  background:
                    "#102719",
                  border:
                    "1px solid #27613d",
                  color:
                    "#67e69a",
                  marginBottom:
                    "20px",
                  lineHeight:
                    1.5,
                  wordBreak:
                    "break-word",
                }}
              >
                {message}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                submitting ||
                !wallet
              }
              style={{
                width:
                  "100%",
                padding:
                  "15px 20px",
                border: "none",
                borderRadius:
                  "12px",
                background:
                  submitting
                    ? "#403b70"
                    : "#6d5dfc",
                color:
                  "#ffffff",
                fontSize:
                  "15px",
                fontWeight:
                  700,
                cursor:
                  submitting
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {submitting
                ? "Submitting Application..."
                : "Submit Issuer Application"}
            </button>
          </form>
        )}

        {/* PENDING MESSAGE */}

        {status ===
          ISSUER_STATUS.PENDING && (
          <div
            style={{
              background:
                "#1e1a0d",
              border:
                "1px solid #5c4b16",
              borderRadius:
                "18px",
              padding:
                "28px",
              marginTop:
                "24px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Application Pending
            </h2>

            <p
              style={{
                color:
                  "#c9bc82",
                lineHeight:
                  1.6,
              }}
            >
              Your institution application
              has been recorded on the
              EduProof blockchain. The
              authority must approve it
              before this wallet can issue
              credentials.
            </p>
          </div>
        )}

        {/* FOOTER */}

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