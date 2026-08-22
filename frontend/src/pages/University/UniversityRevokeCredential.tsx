import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";
import {
  getReadOnlyContract,
  getWalletContract,
} from "../../services/eduProof";

interface Credential {
  id: number;
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
}

interface LocalEthereumProvider {
  request(args: {
    method: string;
    params?: unknown[];
  }): Promise<unknown>;

  on(
    event: string,
    handler: (...args: unknown[]) => void,
  ): void;

  removeListener(
    event: string,
    handler: (...args: unknown[]) => void,
  ): void;
}

function getEthereum(): LocalEthereumProvider | null {
  const ethereum = (
    window as Window & {
      ethereum?: LocalEthereumProvider;
    }
  ).ethereum;

  return ethereum ?? null;
}

function statusText(status: number) {
  if (status === 0) return "ACTIVE";
  if (status === 1) return "REVOKED";
  if (status === 2) return "SUPERSEDED";

  return "UNKNOWN";
}

function statusClass(status: number) {
  if (status === 0) return "active";
  if (status === 1) return "revoked";
  if (status === 2) return "superseded";

  return "unknown";
}

function formatDate(date: string) {
  if (!date) return "Unknown";

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

function shortValue(value: string) {
  if (!value) return "Not available";

  if (value.length <= 34) {
    return value;
  }

  return `${value.slice(0, 18)}...${value.slice(-12)}`;
}

export default function UniversityRevokeCredential() {
  const [walletAddress, setWalletAddress] = useState("");
  const [connected, setConnected] = useState(false);

  const [credentialId, setCredentialId] = useState("");

  const [credential, setCredential] =
    useState<Credential | null>(null);

  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [transactionHash, setTransactionHash] =
    useState("");

  /* =====================================================
     WALLET CONNECTION
     ===================================================== */

  const connectWallet = async () => {
    const ethereum = getEthereum();

    if (!ethereum) {
      setError(
        "MetaMask is not installed. Please install MetaMask to revoke a credential.",
      );

      return;
    }

    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setConnected(true);
        setError("");
      }
    } catch (walletError) {
      console.error(
        "Wallet connection failed:",
        walletError,
      );

      setError(
        "Wallet connection was rejected or failed.",
      );
    }
  };

  /* =====================================================
     LOAD CREDENTIAL
     ===================================================== */

  const handleLookup = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setTransactionHash("");
    setCredential(null);

    const parsedId = Number(
      credentialId.trim(),
    );

    if (
      !credentialId.trim() ||
      !Number.isInteger(parsedId) ||
      parsedId <= 0
    ) {
      setError(
        "Enter a valid positive credential ID.",
      );

      return;
    }

    try {
      setLoading(true);

      const contract =
        getReadOnlyContract();

      const result =
        await contract.getCredential(
          parsedId,
        );

      const loadedCredential: Credential = {
        id: Number(result.id),
        issuer: String(result.issuer),
        studentDID: String(result.studentDID),
        credentialType: String(
          result.credentialType,
        ),
        institution: String(
          result.institution,
        ),
        institutionId: String(
          result.institutionId,
        ),
        degree: String(result.degree),
        issueDate: String(
          result.issueDate,
        ),
        credentialHash: String(
          result.credentialHash,
        ),
        signature: String(
          result.signature,
        ),
        cid: String(result.cid),
        version: Number(result.version),
        status: Number(result.status),
      };

      setCredential(
        loadedCredential,
      );
    } catch (lookupError) {
      console.error(
        "Credential lookup failed:",
        lookupError,
      );

      setError(
        "Credential could not be found on the EduProof blockchain.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     REVOKE CREDENTIAL
     ===================================================== */

  const handleRevoke = async () => {
    if (!credential) {
      return;
    }

    if (credential.status !== 0) {
      setError(
        "Only an active credential can be revoked.",
      );

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to revoke Credential #${credential.id}?\n\nThis is an on-chain action and cannot be casually undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setTransactionHash("");
      setRevoking(true);

      if (!connected) {
        await connectWallet();

        /*
         * getWalletContract() obtains the signer from
         * the currently connected MetaMask account.
         */
      }

      const contract =
        await getWalletContract();

      const transaction =
        await contract.revokeCredential(
          credential.id,
        );

      setTransactionHash(
        transaction.hash,
      );

      await transaction.wait();

      setSuccess(
        `Credential #${credential.id} was successfully revoked on-chain.`,
      );

      /*
       * Reload the credential so the UI reflects
       * the new blockchain state.
       */

      const readOnlyContract =
        getReadOnlyContract();

      const updated =
        await readOnlyContract.getCredential(
          credential.id,
        );

      setCredential({
        id: Number(updated.id),
        issuer: String(updated.issuer),
        studentDID: String(
          updated.studentDID,
        ),
        credentialType: String(
          updated.credentialType,
        ),
        institution: String(
          updated.institution,
        ),
        institutionId: String(
          updated.institutionId,
        ),
        degree: String(
          updated.degree,
        ),
        issueDate: String(
          updated.issueDate,
        ),
        credentialHash: String(
          updated.credentialHash,
        ),
        signature: String(
          updated.signature,
        ),
        cid: String(updated.cid),
        version: Number(
          updated.version,
        ),
        status: Number(
          updated.status,
        ),
      });
    } catch (revokeError) {
      console.error(
        "Credential revocation failed:",
        revokeError,
      );

      setError(
        "Credential revocation failed. The transaction may have been rejected or reverted.",
      );
    } finally {
      setRevoking(false);
    }
  };

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <UniversityLayout
      walletAddress={walletAddress}
      connected={connected}
    >
      {/* =================================================
          HEADER
          ================================================= */}

      <section className="university-page-header">
        <div>
          <Link
            to="/university/credentials"
            className="credential-back-link"
          >
            ← Back to Credentials
          </Link>

          <span className="page-eyebrow">
            CREDENTIAL MANAGEMENT
          </span>

          <h1>
            Revoke Credential
          </h1>

          <p>
            Permanently revoke an active academic
            credential on the EduProof blockchain.
          </p>
        </div>

        <div className="university-page-actions">
          {!connected && (
            <button
              type="button"
              className="secondary-button"
              onClick={connectWallet}
            >
              Connect MetaMask
            </button>
          )}
        </div>
      </section>

      {/* =================================================
          WARNING
          ================================================= */}

      <section className="revoke-warning-card">
        <div className="revoke-warning-icon">
          !
        </div>

        <div>
          <strong>
            On-chain action
          </strong>

          <p>
            Revocation changes the credential state on
            the blockchain. Make sure you have selected
            the correct credential before confirming the
            transaction.
          </p>
        </div>
      </section>

      {/* =================================================
          LOOKUP
          ================================================= */}

      <section className="university-panel revoke-lookup-panel">

        <div className="credential-section-heading">
          <div>
            <span className="page-eyebrow">
              CREDENTIAL LOOKUP
            </span>

            <h2>
              Find Credential
            </h2>

            <p>
              Enter the on-chain credential ID to inspect
              the record before revoking it.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleLookup}
          className="credential-verify-form"
        >
          <div className="credential-id-field">
            <label htmlFor="revoke-credential-id">
              Credential ID
            </label>

            <input
              id="revoke-credential-id"
              type="number"
              min="1"
              value={credentialId}
              onChange={(event) =>
                setCredentialId(
                  event.target.value,
                )
              }
              placeholder="e.g. 1"
              disabled={
                loading || revoking
              }
            />
          </div>

          <button
            type="submit"
            className="primary-button verify-submit-button"
            disabled={
              loading || revoking
            }
          >
            {loading
              ? "Loading..."
              : "Find Credential →"}
          </button>
        </form>

      </section>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <section className="verification-result-error">
          <div className="verification-error-icon">
            !
          </div>

          <div>
            <strong>
              Action failed
            </strong>

            <p>
              {error}
            </p>
          </div>
        </section>
      )}

      {/* =================================================
          SUCCESS
          ================================================= */}

      {success && (
        <section className="revoke-success-card">
          <div className="revoke-success-icon">
            ✓
          </div>

          <div>
            <strong>
              Credential Revoked
            </strong>

            <p>
              {success}
            </p>

            {transactionHash && (
              <code>
                Transaction: {transactionHash}
              </code>
            )}
          </div>
        </section>
      )}

      {/* =================================================
          CREDENTIAL PREVIEW
          ================================================= */}

      {credential && (
        <section className="revoke-preview">

          <div className="university-panel">

            <div className="credential-details-card-header">

              <div>
                <span className="credential-card-eyebrow">
                  CREDENTIAL #{credential.id}
                </span>

                <h2>
                  {credential.credentialType}
                </h2>

                <p>
                  {credential.degree}
                </p>
              </div>

              <span
                className={`credential-status ${statusClass(
                  credential.status,
                )}`}
              >
                <span className="credential-status-dot" />

                {statusText(
                  credential.status,
                )}
              </span>

            </div>

            <div className="credential-info-grid">

              <div className="credential-info-item">
                <span>
                  Student DID
                </span>

                <strong>
                  {credential.studentDID}
                </strong>
              </div>

              <div className="credential-info-item">
                <span>
                  Institution
                </span>

                <strong>
                  {credential.institution}
                </strong>
              </div>

              <div className="credential-info-item">
                <span>
                  Institution ID
                </span>

                <strong>
                  {credential.institutionId}
                </strong>
              </div>

              <div className="credential-info-item">
                <span>
                  Issue Date
                </span>

                <strong>
                  {formatDate(
                    credential.issueDate,
                  )}
                </strong>
              </div>

              <div className="credential-info-item">
                <span>
                  Version
                </span>

                <strong>
                  v{credential.version}
                </strong>
              </div>

              <div className="credential-info-item">
                <span>
                  Credential Hash
                </span>

                <strong>
                  {shortValue(
                    credential.credentialHash,
                  )}
                </strong>
              </div>

            </div>

          </div>

          {/* =================================================
              REVOCATION ACTION
              ================================================= */}

          <div className="revoke-action-panel">

            <div>
              <span className="page-eyebrow">
                DANGEROUS ACTION
              </span>

              <h2>
                Revoke this credential?
              </h2>

              <p>
                Once the transaction is confirmed,
                credential #{credential.id} will no longer
                be considered active.
              </p>
            </div>

            <div className="revoke-action-buttons">

              <Link
                to={`/university/credentials/${credential.id}`}
                className="secondary-button"
              >
                View Details
              </Link>

              {credential.status === 0 ? (
                <button
                  type="button"
                  className="revoke-button"
                  onClick={handleRevoke}
                  disabled={revoking}
                >
                  {revoking
                    ? "Waiting for Transaction..."
                    : "Revoke Credential"}
                </button>
              ) : (
                <div className="revoke-already-state">
                  Credential is already{" "}
                  {statusText(
                    credential.status,
                  ).toLowerCase()}
                  .
                </div>
              )}

            </div>

          </div>

        </section>
      )}
    </UniversityLayout>
  );
}