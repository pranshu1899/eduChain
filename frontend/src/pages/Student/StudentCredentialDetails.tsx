import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import StudentLayout from "./StudentLayout";

import {
  getReadOnlyContract,
} from "../../services/eduProof";

import {
  createStudentDID,
} from "../../utils/didUtils";

interface LocalEthereumProvider {
  request(args: {
    method: string;
    params?: unknown[];
  }): Promise<unknown>;
}

interface Credential {
  id: number;
  rootCredentialId: number;
  issuer: string;
  studentDID: string;
  credentialType: string;
  institution: string;
  institutionId: string;
  degree: string;
  issueDate: string;
  credentialHash: string;
  signature: string;
  cid: string;
  version: number;
  status: number;
  issuedAt: number;
  previousVersionId: number;
}

function getEthereum(): LocalEthereumProvider | null {
  return (
    window as Window & {
      ethereum?: LocalEthereumProvider;
    }
  ).ethereum ?? null;
}

function statusText(status: number) {
  if (status === 0) {
    return "ACTIVE";
  }

  if (status === 1) {
    return "REVOKED";
  }

  if (status === 2) {
    return "SUPERSEDED";
  }

  return "UNKNOWN";
}

function statusClass(status: number) {
  if (status === 0) {
    return "active";
  }

  if (status === 1) {
    return "revoked";
  }

  if (status === 2) {
    return "superseded";
  }

  return "unknown";
}

function formatDate(date: string) {
  if (!date) {
    return "Unknown";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function shortenValue(
  value: string,
  start = 18,
  end = 12,
) {
  if (!value) {
    return "Not available";
  }

  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export default function StudentCredentialDetails() {
  const { id } = useParams();

  const [walletAddress, setWalletAddress] = useState("");
  const [connected, setConnected] = useState(false);

  const [credential, setCredential] =
    useState<Credential | null>(null);

  const [versionHistory, setVersionHistory] =
    useState<number[]>([]);

  const [signatureValid, setSignatureValid] =
    useState<boolean | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  /* =====================================================
     CONNECT WALLET
     ===================================================== */

  const connectWallet = async () => {
    const ethereum = getEthereum();

    if (!ethereum) {
      setError("MetaMask is not installed.");
      return;
    }

    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts.length === 0) {
        return;
      }

      setWalletAddress(accounts[0]);
      setConnected(true);
    } catch (walletError) {
      console.error(
        "Wallet connection failed:",
        walletError,
      );

      setError(
        "Wallet connection was rejected.",
      );
    }
  };

  /* =====================================================
     LOAD CREDENTIAL
     ===================================================== */

  useEffect(() => {
    const loadCredential = async () => {
      if (!id) {
        setError("Credential ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const credentialId = Number(id);

        if (
          !Number.isInteger(credentialId) ||
          credentialId <= 0
        ) {
          throw new Error(
            "Invalid credential ID.",
          );
        }

        const contract =
          getReadOnlyContract();

        const result =
          await contract.getCredential(
            credentialId,
          );

        const loadedCredential: Credential = {
          id: Number(result.id),

          rootCredentialId:
            Number(result.rootCredentialId),

          issuer:
            String(result.issuer),

          studentDID:
            String(result.studentDID),

          credentialType:
            String(result.credentialType),

          institution:
            String(result.institution),

          institutionId:
            String(result.institutionId),

          degree:
            String(result.degree),

          issueDate:
            String(result.issueDate),

          credentialHash:
            String(result.credentialHash),

          signature:
            String(result.signature),

          cid:
            String(result.cid),

          version:
            Number(result.version),

          status:
            Number(result.status),

          issuedAt:
            Number(result.issuedAt),

          previousVersionId:
            Number(result.previousVersionId),
        };

        setCredential(
          loadedCredential,
        );

        const history =
          await contract.getVersionHistory(
            credentialId,
          );

        setVersionHistory(
          Array.from(
            history,
            (item) => Number(item),
          ),
        );

        const valid =
          await contract.verifyCredentialSignature(
            credentialId,
          );

        setSignatureValid(
          Boolean(valid),
        );
      } catch (credentialError) {
        console.error(
          "Credential loading failed:",
          credentialError,
        );

        setError(
          "Unable to load this credential from the Sepolia blockchain.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCredential();
  }, [id]);

  /* =====================================================
     DETECT WALLET
     ===================================================== */

  useEffect(() => {
    const ethereum = getEthereum();

    if (!ethereum) {
      return;
    }

    const detectWallet = async () => {
      try {
        const accounts =
          (await ethereum.request({
            method: "eth_accounts",
          })) as string[];

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setConnected(true);
        }
      } catch (walletError) {
        console.warn(
          "Wallet detection failed:",
          walletError,
        );
      }
    };

    void detectWallet();
  }, []);

  /* =====================================================
     QR VERIFICATION
     ===================================================== */

  const verificationUrl =
    credential && typeof window !== "undefined"
      ? `${window.location.origin}/verify/${credential.id}`
      : "";

  const copyVerificationLink =
    async () => {
      if (!verificationUrl) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          verificationUrl,
        );

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (copyError) {
        console.error(
          "Failed to copy verification link:",
          copyError,
        );
      }
    };

  const studentDID =
    credential?.studentDID ?? "";

  const walletDID =
    walletAddress
      ? createStudentDID(
          walletAddress,
        )
      : "";

  const isOwner =
    Boolean(
      studentDID &&
      walletDID &&
      studentDID === walletDID,
    );

  return (
    <StudentLayout
      walletAddress={walletAddress}
      connected={connected}
      onConnect={connectWallet}
    >

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="student-page-header">
        <div>
          <Link
            to="/student"
            className="student-back-link"
          >
            ← Back to My Credentials
          </Link>

          <span className="student-page-eyebrow">
            CREDENTIAL DETAILS
          </span>

          <h1>
            Academic Credential
          </h1>

          <p>
            Blockchain-backed credential record
            from EduProof.
          </p>
        </div>
      </section>

      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading && (
        <section className="student-panel">
          <div className="student-loading">
            <div className="credential-loading-spinner" />

            <p>
              Reading credential from Sepolia...
            </p>
          </div>
        </section>
      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {!loading && error && (
        <section className="student-error">
          <div className="student-error-icon">
            !
          </div>

          <div>
            <strong>
              Credential unavailable
            </strong>

            <p>
              {error}
            </p>
          </div>
        </section>
      )}

      {/* =====================================================
          CREDENTIAL
          ===================================================== */}

      {!loading &&
        !error &&
        credential && (
          <>
            {/* =================================================
                MAIN CREDENTIAL
                ================================================= */}

            <section className="student-credential-hero">
              <div className="student-credential-hero-top">
                <div>
                  <span>
                    CREDENTIAL #
                    {credential.id}
                  </span>

                  <h2>
                    {credential.degree}
                  </h2>

                  <p>
                    {credential.institution}
                  </p>
                </div>

                <div
                  className={`student-status-large ${statusClass(
                    credential.status,
                  )}`}
                >
                  <span />

                  {statusText(
                    credential.status,
                  )}
                </div>
              </div>

              <div className="student-credential-overview">
                <div>
                  <span>
                    CREDENTIAL TYPE
                  </span>

                  <strong>
                    {
                      credential.credentialType
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    ISSUE DATE
                  </span>

                  <strong>
                    {formatDate(
                      credential.issueDate,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    VERSION
                  </span>

                  <strong>
                    v
                    {
                      credential.version
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    INSTITUTION ID
                  </span>

                  <strong>
                    {
                      credential.institutionId
                    }
                  </strong>
                </div>
              </div>
            </section>

            {/* =================================================
                QR VERIFICATION
                ================================================= */}

            <section className="student-qr-card">

              <div className="student-qr-content">

                <div className="student-qr-information">

                  <span className="student-qr-eyebrow">
                    INSTANT VERIFICATION
                  </span>

                  <h2>
                    Verify this credential
                  </h2>

                  <p>
                    Anyone can scan this QR code
                    to verify the authenticity
                    and current status of this
                    credential directly against
                    the EduProof blockchain.
                  </p>

                  <div className="student-qr-meta">

                    <div>
                      <span>
                        CREDENTIAL
                      </span>

                      <strong>
                        #
                        {credential.id}
                      </strong>
                    </div>

                    <div>
                      <span>
                        STATUS
                      </span>

                      <strong>
                        {statusText(
                          credential.status,
                        )}
                      </strong>
                    </div>

                  </div>

                  <div className="student-qr-link-box">

                    <span>
                      VERIFICATION LINK
                    </span>

                    <code>
                      {verificationUrl}
                    </code>

                  </div>

                  <div className="student-qr-actions">

                    <button
                      type="button"
                      className="student-qr-copy-button"
                      onClick={
                        copyVerificationLink
                      }
                    >
                      {copied
                        ? "✓ Link Copied"
                        : "Copy Verification Link"}
                    </button>

                    <Link
                      to={`/verify/${credential.id}`}
                      className="student-qr-open-button"
                    >
                      Open Verification →
                    </Link>

                  </div>

                </div>

                <div className="student-qr-wrapper">

                  <div className="student-qr-frame">

                    <QRCodeSVG
                      value={
                        verificationUrl
                      }
                      size={220}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#111111"
                    />

                  </div>

                  <div className="student-qr-scan-text">
                    <span>
                      SCAN TO VERIFY
                    </span>

                    <p>
                      No wallet required
                    </p>
                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                BLOCKCHAIN PROOF
                ================================================= */}

            <section className="student-proof-card">

              <div className="student-proof-header">

                <div>
                  <span>
                    BLOCKCHAIN PROOF
                  </span>

                  <h2>
                    Credential Authenticity
                  </h2>
                </div>

                {signatureValid !== null && (
                  <div
                    className={
                      signatureValid
                        ? "student-proof-valid"
                        : "student-proof-invalid"
                    }
                  >
                    <span>
                      {signatureValid
                        ? "✓"
                        : "!"}
                    </span>

                    {signatureValid
                      ? "Signature Verified"
                      : "Signature Invalid"}
                  </div>
                )}

              </div>

              <div className="student-proof-grid">

                <div className="student-proof-field">
                  <span>
                    STUDENT DID
                  </span>

                  <strong>
                    {shortenValue(
                      credential.studentDID,
                    )}
                  </strong>

                  <code>
                    {
                      credential.studentDID
                    }
                  </code>
                </div>

                <div className="student-proof-field">
                  <span>
                    ISSUER WALLET
                  </span>

                  <strong>
                    {shortenValue(
                      credential.issuer,
                    )}
                  </strong>

                  <code>
                    {
                      credential.issuer
                    }
                  </code>
                </div>

                <div className="student-proof-field">
                  <span>
                    CREDENTIAL HASH
                  </span>

                  <strong>
                    {shortenValue(
                      credential.credentialHash,
                    )}
                  </strong>

                  <code>
                    {
                      credential.credentialHash
                    }
                  </code>
                </div>

                <div className="student-proof-field">
                  <span>
                    DIGITAL SIGNATURE
                  </span>

                  <strong>
                    {shortenValue(
                      credential.signature,
                    )}
                  </strong>

                  <code>
                    {
                      credential.signature
                    }
                  </code>
                </div>

              </div>

            </section>

            {/* =================================================
                IPFS
                ================================================= */}

            <section className="student-panel">

              <div className="student-panel-header">

                <div>
                  <span>
                    DECENTRALIZED STORAGE
                  </span>

                  <h2>
                    IPFS Credential Metadata
                  </h2>

                  <p>
                    Off-chain credential metadata
                    referenced by the blockchain
                    record.
                  </p>
                </div>

              </div>

              <div className="student-ipfs-card">

                <div className="student-ipfs-icon">
                  ◈
                </div>

                <div>
                  <span>
                    IPFS CID
                  </span>

                  <strong>
                    {
                      credential.cid ||
                      "No CID available"
                    }
                  </strong>

                  {credential.cid && (
                    <a
                      href={`https://ipfs.io/ipfs/${credential.cid}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open IPFS proof →
                    </a>
                  )}
                </div>

              </div>

            </section>

            {/* =================================================
                VERSION HISTORY
                ================================================= */}

            <section className="student-panel">

              <div className="student-panel-header">

                <div>
                  <span>
                    CREDENTIAL HISTORY
                  </span>

                  <h2>
                    Version History
                  </h2>

                  <p>
                    Blockchain-linked versions
                    of this credential.
                  </p>
                </div>

              </div>

              {versionHistory.length === 0 ? (
                <div className="student-empty">

                  <div className="student-empty-icon">
                    ◷
                  </div>

                  <h3>
                    No version history
                  </h3>

                  <p>
                    No version history is
                    available for this
                    credential.
                  </p>

                </div>
              ) : (
                <div className="student-version-list">

                  {versionHistory.map(
                    (
                      versionId,
                      index,
                    ) => {

                      const isCurrent =
                        versionId ===
                        credential.id;

                      return (
                        <div
                          key={`${versionId}-${index}`}
                          className={
                            isCurrent
                              ? "student-version-item current"
                              : "student-version-item"
                          }
                        >

                          <div className="student-version-number">
                            v
                            {index + 1}
                          </div>

                          <div className="student-version-content">

                            <strong>
                              Credential #
                              {versionId}
                            </strong>

                            <span>
                              {isCurrent
                                ? "Current version"
                                : "Previous version"}
                            </span>

                          </div>

                          {isCurrent && (
                            <span className="student-current-badge">
                              CURRENT
                            </span>
                          )}

                        </div>
                      );
                    },
                  )}

                </div>
              )}

            </section>

            {/* =================================================
                OWNER
                ================================================= */}

            <section className="student-owner-card">

              <div className="student-owner-icon">
                {isOwner
                  ? "✓"
                  : "○"}
              </div>

              <div>
                <span>
                  WALLET OWNERSHIP
                </span>

                <h3>
                  {isOwner
                    ? "This credential belongs to your connected wallet"
                    : "Connect the credential owner's wallet to verify ownership"}
                </h3>

                <p>
                  EduProof derives the student
                  DID from the wallet address.
                </p>
              </div>

              {!connected && (
                <button
                  type="button"
                  className="student-connect-large"
                  onClick={
                    connectWallet
                  }
                >
                  Connect Wallet
                </button>
              )}

            </section>

          </>
        )}

    </StudentLayout>
  );
}