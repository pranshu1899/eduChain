import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import type {
  HackathonCertificate,
  HackathonCertificateBatch,
  HackathonEvent,
  HackathonParticipant,
} from "../../types/hackathon";

import {
  anchorGeneratedHackathonBatch,
  generateHackathonCertificateBatch,
  getHackathonBatches,
  getHackathonBatchBlockchainId,
  getHackathonById,
  getHackathonCertificates,
  getHackathonParticipants,
  verifyHackathonBatchIntegrity,
} from "../../services/hackathonService";

import {
  getHackathonCertificateBatchOnChain,
} from "../../services/hackathonOrganizationRegistry";

export default function HackathonCertificates() {
  const {
    id,
  } = useParams<{
    id: string;
  }>();

  const navigate =
    useNavigate();

  /* =====================================================
     STATE
     ===================================================== */

  const [
    hackathon,
    setHackathon,
  ] =
    useState<HackathonEvent | null>(
      null,
    );

  const [
    participants,
    setParticipants,
  ] =
    useState<HackathonParticipant[]>(
      [],
    );

  const [
    certificates,
    setCertificates,
  ] =
    useState<HackathonCertificate[]>(
      [],
    );

  const [
    batch,
    setBatch,
  ] =
    useState<HackathonCertificateBatch | null>(
      null,
    );

  const [
    generating,
    setGenerating,
  ] =
    useState(false);

  const [
    anchoring,
    setAnchoring,
  ] =
    useState(false);

  const [
    verifyingOnChain,
    setVerifyingOnChain,
  ] =
    useState(false);

  const [
    blockchainVerified,
    setBlockchainVerified,
  ] =
    useState<boolean | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  /* =====================================================
     LOAD HACKATHON
     ===================================================== */

  useEffect(() => {
    if (!id) {
      return;
    }

    const event =
      getHackathonById(id);

    setHackathon(event);

    if (!event) {
      return;
    }

    const eventParticipants =
      getHackathonParticipants(id);

    setParticipants(
      eventParticipants,
    );

    const existingBatch =
      getHackathonBatches().find(
        (item) =>
          item.hackathonId === id,
      ) ?? null;

    setBatch(
      existingBatch,
    );

    if (existingBatch) {
      setCertificates(
        getHackathonCertificates(
          id,
        ),
      );
    }
  }, [id]);

  /* =====================================================
     GENERATE CERTIFICATES
     ===================================================== */

  function handleGenerate() {
    if (!id) {
      setError(
        "Hackathon ID is missing.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setBlockchainVerified(
      null,
    );
    setGenerating(true);

    try {
      const generatedBatch =
        generateHackathonCertificateBatch(
          id,
        );

      setBatch(
        generatedBatch,
      );

      setCertificates(
        getHackathonCertificates(
          id,
        ),
      );

      setSuccess(
        `Successfully generated ${
          generatedBatch.certificateCount
        } certificate${
          generatedBatch.certificateCount ===
          1
            ? ""
            : "s"
        } and created the Merkle batch.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate certificates.",
      );
    } finally {
      setGenerating(false);
    }
  }

  /* =====================================================
     ANCHOR BATCH
     ===================================================== */

  async function handleAnchorBatch() {
    if (!batch) {
      setError(
        "No certificate batch is available.",
      );
      return;
    }

    if (
      batch.status ===
      "ANCHORED"
    ) {
      setError(
        "This certificate batch is already anchored.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setBlockchainVerified(
      null,
    );
    setAnchoring(true);

    try {
      /*
       * Always verify the locally stored Merkle
       * root before asking MetaMask to sign.
       */
      const localIntegrity =
        verifyHackathonBatchIntegrity(
          batch,
        );

      if (!localIntegrity) {
        throw new Error(
          "Local Merkle integrity verification failed. The certificate hashes do not match the stored Merkle root.",
        );
      }

      const updatedBatch =
        await anchorGeneratedHackathonBatch(
          batch,
        );

      setBatch(
        updatedBatch,
      );

      setSuccess(
        "Certificate batch successfully anchored on Ethereum Sepolia.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to anchor certificate batch.",
      );
    } finally {
      setAnchoring(false);
    }
  }

  /* =====================================================
     VERIFY ON CHAIN
     ===================================================== */

  async function handleVerifyOnChain() {
    if (!batch) {
      setError(
        "No certificate batch is available.",
      );
      return;
    }

    if (
      batch.status !==
      "ANCHORED"
    ) {
      setError(
        "The batch must be anchored before it can be verified on-chain.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setVerifyingOnChain(true);

    try {
      /*
       * The batch ID stored locally is converted into
       * the deterministic bytes32 ID used by the contract.
       */
      const blockchainBatchId =
        getHackathonBatchBlockchainId(
          batch.id,
        );

      const onChainBatch =
        await getHackathonCertificateBatchOnChain(
          blockchainBatchId,
        );

      const rootMatches =
        onChainBatch.merkleRoot.toLowerCase() ===
        batch.merkleRoot.toLowerCase();

      const countMatches =
        onChainBatch.certificateCount ===
        batch.certificateCount;

      const organizationExists =
        onChainBatch.exists;

      const verified =
        organizationExists &&
        rootMatches &&
        countMatches;

      setBlockchainVerified(
        verified,
      );

      if (verified) {
        setSuccess(
          "Blockchain verification successful. The on-chain Merkle root matches this certificate batch.",
        );
      } else {
        setError(
          "Blockchain verification failed. The stored batch does not match the on-chain record.",
        );
      }
    } catch (err) {
      setBlockchainVerified(
        false,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify the batch on-chain.",
      );
    } finally {
      setVerifyingOnChain(false);
    }
  }

  /* =====================================================
     HELPERS
     ===================================================== */

  function formatDate(
    timestamp: number,
  ): string {
    return new Date(
      timestamp,
    ).toLocaleString();
  }

  function shortenHash(
    value: string,
  ): string {
    if (value.length <= 20) {
      return value;
    }

    return `${value.slice(
      0,
      10,
    )}...${value.slice(-8)}`;
  }

  function explorerTransactionUrl(
    transactionHash: string,
  ): string {
    return `https://sepolia.etherscan.io/tx/${transactionHash}`;
  }

  /* =====================================================
     NOT FOUND
     ===================================================== */

  if (!hackathon) {
    return (
      <div className="student-page-shell">
        <main className="student-main-content">
          <h1>
            Hackathon not found
          </h1>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/hackathon",
              )
            }
          >
            Back to Hackathons
          </button>
        </main>
      </div>
    );
  }

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="student-page-shell">
      <main className="student-main-content">

        {/* =================================================
            HEADER
            ================================================= */}

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap:
              "1rem",
            flexWrap:
              "wrap",
            marginBottom:
              "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate(
                `/hackathon/${hackathon.id}/participants`,
              )
            }
          >
            ← Participants
          </button>

          <Link
            to="/hackathon"
          >
            Hackathon Dashboard
          </Link>
        </div>

        {/* =================================================
            TITLE
            ================================================= */}

        <section
          style={{
            marginBottom:
              "2rem",
          }}
        >
          <p
            style={{
              opacity:
                0.6,
              fontSize:
                "0.75rem",
              letterSpacing:
                "0.12em",
              marginBottom:
                "0.5rem",
            }}
          >
            CERTIFICATE BATCH
          </p>

          <h1>
            {hackathon.name}
          </h1>

          <p>
            Generate digitally verifiable
            certificates for every registered
            participant using a single Merkle
            batch.
          </p>
        </section>

        {/* =================================================
            SUMMARY
            ================================================= */}

        <section
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap:
              "1rem",
            marginBottom:
              "1.5rem",
          }}
        >
          <div className="dashboard-card">
            <p>
              Participants
            </p>

            <h2>
              {participants.length}
            </h2>
          </div>

          <div className="dashboard-card">
            <p>
              Certificates
            </p>

            <h2>
              {certificates.length}
            </h2>
          </div>

          <div className="dashboard-card">
            <p>
              Batch Status
            </p>

            <h2>
              {batch
                ? batch.status
                : "DRAFT"}
            </h2>
          </div>

          <div className="dashboard-card">
            <p>
              Merkle Root
            </p>

            <h2
              style={{
                fontSize:
                  "0.85rem",
                wordBreak:
                  "break-all",
              }}
            >
              {batch
                ? shortenHash(
                    batch.merkleRoot,
                  )
                : "Not generated"}
            </h2>
          </div>
        </section>

        {/* =================================================
            SUCCESS
            ================================================= */}

        {success && (
          <div
            role="status"
            style={{
              padding:
                "1rem",
              marginBottom:
                "1rem",
              borderRadius:
                "0.75rem",
              border:
                "1px solid currentColor",
            }}
          >
            ✓ {success}
          </div>
        )}

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            role="alert"
            style={{
              padding:
                "1rem",
              marginBottom:
                "1rem",
              borderRadius:
                "0.75rem",
              border:
                "1px solid currentColor",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            GENERATION PANEL
            ================================================= */}

        {!batch && (
          <section
            className="dashboard-card"
            style={{
              marginBottom:
                "1.5rem",
            }}
          >
            <p
              style={{
                opacity:
                  0.6,
                fontSize:
                  "0.75rem",
                letterSpacing:
                  "0.1em",
              }}
            >
              BATCH GENERATION
            </p>

            <h2>
              Generate Certificates
            </h2>

            <p>
              EduProof will create one
              certificate for every participant,
              calculate a cryptographic hash for
              each certificate, and construct one
              Merkle tree for the complete batch.
            </p>

            <div
              style={{
                padding:
                  "1rem",
                margin:
                  "1rem 0",
                borderRadius:
                  "0.75rem",
                border:
                  "1px solid currentColor",
              }}
            >
              <strong>
                What happens?
              </strong>

              <ol
                style={{
                  marginTop:
                    "0.75rem",
                  paddingLeft:
                    "1.25rem",
                }}
              >
                <li>
                  Generate certificate data
                  for each participant.
                </li>

                <li>
                  Hash every certificate.
                </li>

                <li>
                  Build the Merkle tree.
                </li>

                <li>
                  Generate an inclusion proof
                  for every certificate.
                </li>

                <li>
                  Create one batch containing
                  the Merkle root.
                </li>
              </ol>
            </div>

            <button
              type="button"
              onClick={
                handleGenerate
              }
              disabled={
                generating ||
                participants.length ===
                  0
              }
            >
              {generating
                ? "Generating..."
                : `Generate ${
                    participants.length
                  } Certificate${
                    participants.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </button>

            {participants.length ===
              0 && (
              <p
                style={{
                  marginTop:
                    "0.75rem",
                  opacity:
                    0.65,
                }}
              >
                Add at least one participant
                before generating certificates.
              </p>
            )}
          </section>
        )}

        {/* =================================================
            BATCH RESULT
            ================================================= */}

        {batch && (
          <>
            {/* =================================================
                BATCH INFORMATION
                ================================================= */}

            <section
              className="dashboard-card"
              style={{
                marginBottom:
                  "1.5rem",
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
                  gap:
                    "1rem",
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <p
                    style={{
                      opacity:
                        0.6,
                      fontSize:
                        "0.75rem",
                      letterSpacing:
                        "0.1em",
                    }}
                  >
                    MERKLE BATCH
                  </p>

                  <h2>
                    Certificate Batch
                  </h2>
                </div>

                <div>
                  <span
                    style={{
                      padding:
                        "0.4rem 0.75rem",
                      border:
                        "1px solid currentColor",
                      borderRadius:
                        "999px",
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    {batch.status}
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "1.5rem",
                  display:
                    "grid",
                  gap:
                    "1rem",
                }}
              >
                <div>
                  <p
                    style={{
                      opacity:
                        0.6,
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    Batch ID
                  </p>

                  <code
                    style={{
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {batch.id}
                  </code>
                </div>

                <div>
                  <p
                    style={{
                      opacity:
                        0.6,
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    Merkle Root
                  </p>

                  <code
                    style={{
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {batch.merkleRoot}
                  </code>
                </div>

                <div>
                  <p
                    style={{
                      opacity:
                        0.6,
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    Certificate Count
                  </p>

                  <strong>
                    {batch.certificateCount}
                  </strong>
                </div>

                <div>
                  <p
                    style={{
                      opacity:
                        0.6,
                      fontSize:
                        "0.8rem",
                    }}
                  >
                    Created
                  </p>

                  <span>
                    {formatDate(
                      batch.createdAt,
                    )}
                  </span>
                </div>
              </div>

              {/* =================================================
                  BLOCKCHAIN ACTIONS
                  ================================================= */}

              <div
                style={{
                  marginTop:
                    "1.5rem",
                  paddingTop:
                    "1.5rem",
                  borderTop:
                    "1px solid currentColor",
                }}
              >
                <p
                  style={{
                    opacity:
                      0.6,
                    fontSize:
                      "0.75rem",
                    letterSpacing:
                      "0.1em",
                  }}
                >
                  BLOCKCHAIN ANCHOR
                </p>

                {batch.status !==
                  "ANCHORED" ? (
                  <>
                    <h3>
                      Anchor this batch on Ethereum
                    </h3>

                    <p>
                      The certificate data stays
                      off-chain. Only the batch
                      identifier, certificate count,
                      metadata reference, and Merkle
                      root are anchored on Ethereum
                      Sepolia.
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleAnchorBatch
                      }
                      disabled={
                        anchoring
                      }
                      style={{
                        marginTop:
                          "0.75rem",
                      }}
                    >
                      {anchoring
                        ? "Waiting for blockchain confirmation..."
                        : "🔗 Anchor Batch on Ethereum"}
                    </button>

                    {anchoring && (
                      <p
                        style={{
                          marginTop:
                            "0.75rem",
                          opacity:
                            0.65,
                        }}
                      >
                        Confirm the transaction in
                        MetaMask. The page will update
                        after the transaction is mined.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h3>
                      ✓ Batch Anchored
                    </h3>

                    <p>
                      This certificate batch has been
                      permanently anchored on Ethereum
                      Sepolia.
                    </p>

                    {batch.transactionHash && (
                      <div
                        style={{
                          marginTop:
                            "1rem",
                          display:
                            "grid",
                          gap:
                            "0.75rem",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              opacity:
                                0.6,
                              fontSize:
                                "0.8rem",
                            }}
                          >
                            Transaction Hash
                          </p>

                          <code
                            style={{
                              wordBreak:
                                "break-all",
                            }}
                          >
                            {batch.transactionHash}
                          </code>

                          <div
                            style={{
                              marginTop:
                                "0.4rem",
                            }}
                          >
                            <a
                              href={explorerTransactionUrl(
                                batch.transactionHash,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View on Sepolia Etherscan ↗
                            </a>
                          </div>
                        </div>

                        {batch.blockNumber !==
                          undefined && (
                          <div>
                            <p
                              style={{
                                opacity:
                                  0.6,
                                fontSize:
                                  "0.8rem",
                              }}
                            >
                              Block Number
                            </p>

                            <strong>
                              {
                                batch.blockNumber
                              }
                            </strong>
                          </div>
                        )}

                        {batch.anchoredAt && (
                          <div>
                            <p
                              style={{
                                opacity:
                                  0.6,
                                fontSize:
                                  "0.8rem",
                              }}
                            >
                              Anchored At
                            </p>

                            <span>
                              {formatDate(
                                batch.anchoredAt,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* =================================================
                        VERIFY ON CHAIN
                        ================================================= */}

                    <div
                      style={{
                        marginTop:
                          "1.5rem",
                      }}
                    >
                      <button
                        type="button"
                        onClick={
                          handleVerifyOnChain
                        }
                        disabled={
                          verifyingOnChain
                        }
                      >
                        {verifyingOnChain
                          ? "Verifying..."
                          : "🔍 Verify Batch On-Chain"}
                      </button>

                      {blockchainVerified ===
                        true && (
                        <p
                          style={{
                            marginTop:
                              "0.75rem",
                          }}
                        >
                          ✓ Merkle root, certificate
                          count, and blockchain batch
                          record match.
                        </p>
                      )}

                      {blockchainVerified ===
                        false && (
                        <p
                          style={{
                            marginTop:
                              "0.75rem",
                          }}
                        >
                          ✕ Blockchain verification
                          failed.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* =================================================
                CERTIFICATE LIST
                ================================================= */}

            <section
              className="dashboard-card"
            >
              <div
                style={{
                  marginBottom:
                    "1.25rem",
                }}
              >
                <p
                  style={{
                    opacity:
                      0.6,
                    fontSize:
                      "0.75rem",
                    letterSpacing:
                      "0.1em",
                  }}
                >
                  GENERATED CERTIFICATES
                </p>

                <h2>
                  {certificates.length} Certificates
                </h2>

                <p>
                  Every certificate has its own
                  cryptographic hash and Merkle
                  inclusion proof.
                </p>
              </div>

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "0.75rem",
                }}
              >
                {certificates.map(
                  (
                    certificate,
                  ) => (
                    <div
                      key={
                        certificate.id
                      }
                      style={{
                        padding:
                          "1rem",
                        border:
                          "1px solid currentColor",
                        borderRadius:
                          "0.75rem",
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
                          gap:
                            "1rem",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin:
                                0,
                            }}
                          >
                            {
                              certificate.participantName
                            }
                          </h3>

                          <p
                            style={{
                              margin:
                                "0.35rem 0",
                              opacity:
                                0.65,
                              fontSize:
                                "0.8rem",
                            }}
                          >
                            {
                              certificate.participantDID
                            }
                          </p>

                          {(certificate.team ||
                            certificate.project) && (
                            <p
                              style={{
                                fontSize:
                                  "0.85rem",
                              }}
                            >
                              {certificate.team &&
                                `Team: ${certificate.team}`}

                              {certificate.team &&
                                certificate.project &&
                                " • "}

                              {certificate.project &&
                                `Project: ${certificate.project}`}
                            </p>
                          )}
                        </div>

                        <span
                          style={{
                            padding:
                              "0.35rem 0.6rem",
                            border:
                              "1px solid currentColor",
                            borderRadius:
                              "999px",
                            fontSize:
                              "0.75rem",
                          }}
                        >
                          {batch.status ===
                          "ANCHORED"
                            ? "Blockchain anchored"
                            : "Merkle verified"}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "1rem",
                          display:
                            "grid",
                          gap:
                            "0.6rem",
                        }}
                      >
                        <div>
                          <small
                            style={{
                              opacity:
                                0.6,
                            }}
                          >
                            Certificate Hash
                          </small>

                          <code
                            style={{
                              display:
                                "block",
                              wordBreak:
                                "break-all",
                              fontSize:
                                "0.75rem",
                            }}
                          >
                            {
                              certificate.certificateHash
                            }
                          </code>
                        </div>

                        <div>
                          <small
                            style={{
                              opacity:
                                0.6,
                            }}
                          >
                            Merkle Leaf
                          </small>

                          <code
                            style={{
                              display:
                                "block",
                              wordBreak:
                                "break-all",
                              fontSize:
                                "0.75rem",
                            }}
                          >
                            {
                              certificate.merkleLeaf ??
                              "Not available"
                            }
                          </code>
                        </div>

                        <div>
                          <small
                            style={{
                              opacity:
                                0.6,
                            }}
                          >
                            Merkle Proof
                          </small>

                          <code
                            style={{
                              display:
                                "block",
                              fontSize:
                                "0.75rem",
                            }}
                          >
                            {certificate.merkleProof
                              ?.length ??
                              0}{" "}
                            sibling hashes
                          </code>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}