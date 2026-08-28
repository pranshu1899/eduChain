import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  connectHackathonWallet,
  getConnectedHackathonWallet,
  getHackathonOrganizationOnChain,
  isHackathonOrganizationApproved,
} from "../../services/hackathonAccessService";

type GuardState =
  | "CHECKING"
  | "APPROVED"
  | "NOT_APPROVED"
  | "ERROR";

interface HackathonGuardProps {
  children: React.ReactNode;
}

function shortenAddress(
  address: string,
): string {
  if (address.length < 12) {
    return address;
  }

  return `${address.slice(
    0,
    6,
  )}...${address.slice(-4)}`;
}

export default function HackathonGuard({
  children,
}: HackathonGuardProps) {
  const navigate =
    useNavigate();

  const [
    wallet,
    setWallet,
  ] = useState<string | null>(null);

  const [
    organizationName,
    setOrganizationName,
  ] = useState("");

  const [
    state,
    setState,
  ] = useState<GuardState>(
    "CHECKING",
  );

  const [
    error,
    setError,
  ] = useState("");

  async function checkAuthorization() {
    try {
      setState("CHECKING");
      setError("");

      const connectedWallet =
        await getConnectedHackathonWallet();

      if (!connectedWallet) {
        setWallet(null);
        setState("NOT_APPROVED");
        return;
      }

      setWallet(
        connectedWallet,
      );

      const approved =
        await isHackathonOrganizationApproved(
          connectedWallet,
        );

      if (!approved) {
        setState("NOT_APPROVED");
        return;
      }

      const organization =
        await getHackathonOrganizationOnChain(
          connectedWallet,
        );

      if (organization) {
        setOrganizationName(
          organization.organizationName,
        );
      }

      setState("APPROVED");
    } catch (err) {
      console.error(
        "Hackathon authorization check failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify hackathon organization authorization.",
      );

      setState("ERROR");
    }
  }

  useEffect(() => {
    void checkAuthorization();

    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged = () => {
      void checkAuthorization();
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  async function handleConnect() {
    try {
      setError("");
      setState("CHECKING");

      const connectedWallet =
        await connectHackathonWallet();

      setWallet(
        connectedWallet,
      );

      const approved =
        await isHackathonOrganizationApproved(
          connectedWallet,
        );

      if (!approved) {
        setState("NOT_APPROVED");
        return;
      }

      const organization =
        await getHackathonOrganizationOnChain(
          connectedWallet,
        );

      if (organization) {
        setOrganizationName(
          organization.organizationName,
        );
      }

      setState("APPROVED");
    } catch (err) {
      console.error(
        "Unable to connect hackathon wallet:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect wallet.",
      );

      setState("ERROR");
    }
  }

  function handleApply() {
    navigate(
      "/request-hackathon",
    );
  }

  function handleBack() {
    navigate("/");
  }

  if (state === "CHECKING") {
    return (
      <div className="student-page-shell">
        <main
          className="student-main-content"
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <section
            className="dashboard-card"
            style={{
              width: "100%",
              maxWidth: "620px",
              textAlign: "center",
              padding: "3rem",
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
              }}
            >
              🔐
            </div>

            <p
              style={{
                margin: 0,
                opacity: 0.65,
                fontSize: "0.75rem",
                letterSpacing: "0.12em",
              }}
            >
              EDUPROOF HACKATHON NETWORK
            </p>

            <h1>
              Checking authorization
            </h1>

            <p>
              Verifying your wallet against the
              Hackathon Organization Registry on
              Sepolia.
            </p>

            {wallet && (
              <p
                style={{
                  marginTop: "1.5rem",
                  fontFamily:
                    "monospace",
                  opacity: 0.7,
                }}
              >
                {shortenAddress(wallet)}
              </p>
            )}
          </section>
        </main>
      </div>
    );
  }

  if (state === "APPROVED") {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <div className="student-page-shell">
      <main
        className="student-main-content"
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <section
          className="dashboard-card"
          style={{
            width: "100%",
            maxWidth: "760px",
            textAlign: "center",
            padding: "3.5rem 2.5rem",
          }}
        >
          <div
            style={{
              fontSize: "2.5rem",
              marginBottom: "1rem",
            }}
          >
            🛡️
          </div>

          <p
            style={{
              margin: 0,
              opacity: 0.65,
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
            }}
          >
            AUTHORIZATION REQUIRED
          </p>

          <h1>
            Hackathon organization access required
          </h1>

          {wallet && (
            <div
              style={{
                marginTop: "1.5rem",
                marginBottom: "1.5rem",
                padding: "1rem",
                borderRadius: "0.9rem",
                border:
                  "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.6,
                  marginBottom: "0.4rem",
                  letterSpacing:
                    "0.08em",
                }}
              >
                CONNECTED WALLET
              </div>

              <div
                style={{
                  fontFamily:
                    "monospace",
                }}
              >
                {shortenAddress(wallet)}
              </div>
            </div>
          )}

          <p>
            This wallet is not currently approved
            to operate as a hackathon organization.
          </p>

          {organizationName && (
            <p>
              Organization:{" "}
              <strong>
                {organizationName}
              </strong>
            </p>
          )}

          {error && (
            <div
              role="alert"
              style={{
                marginTop: "1rem",
                padding: "0.9rem 1rem",
                borderRadius: "0.75rem",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginTop: "2rem",
            }}
          >
            {!wallet && (
              <button
                type="button"
                onClick={() => {
                  void handleConnect();
                }}
              >
                Connect Wallet
              </button>
            )}

            {wallet && (
              <button
                type="button"
                onClick={() => {
                  void handleConnect();
                }}
              >
                Reconnect Wallet
              </button>
            )}

            <button
              type="button"
              onClick={
                handleApply
              }
            >
              Apply for Authorization
            </button>

            <button
              type="button"
              onClick={
                handleBack
              }
            >
              Back to EduProof
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}