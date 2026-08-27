export type HackathonOrganizationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED";

export interface HackathonOrganizationRequest {
  id: string;
  organizationName: string;
  organizerName: string;
  organizerEmail: string;
  walletAddress: string;
  organizationDescription: string;
  reason: string;
  website?: string;
  status: HackathonOrganizationStatus;
  submittedAt: number;
}

/* =====================================================
   HACKATHON
   ===================================================== */

export interface HackathonEvent {
  id: string;
  organizationId: string;
  organizationWallet: string;

  name: string;
  description: string;

  eventDate: string;
  venue?: string;
  website?: string;

  createdAt: number;
  updatedAt: number;
}

/* =====================================================
   PARTICIPANT
   ===================================================== */

export interface HackathonParticipant {
  id: string;

  hackathonId: string;

  /*
   * Student's decentralized identity.
   * This is the primary identity reference.
   */
  did: string;

  name: string;

  email?: string;

  team?: string;

  project?: string;

  result?: string;

  rank?: number;

  award?: string;

  addedAt: number;
}

/* =====================================================
   CERTIFICATE
   ===================================================== */

export interface HackathonCertificate {
  id: string;

  hackathonId: string;

  participantId: string;

  participantDID: string;

  participantName: string;

  hackathonName: string;

  team?: string;

  project?: string;

  result?: string;

  rank?: number;

  award?: string;

  issuedAt: number;

  certificateHash: string;

  /*
   * Merkle information is generated when
   * the certificate becomes part of a batch.
   */
  merkleLeaf?: string;

  merkleProof?: string[];

  merkleRoot?: string;
}

/* =====================================================
   CERTIFICATE BATCH
   ===================================================== */

export type CertificateBatchStatus =
  | "DRAFT"
  | "GENERATED"
  | "ANCHORED";

export interface HackathonCertificateBatch {
  id: string;

  hackathonId: string;

  organizationWallet: string;

  certificateIds: string[];

  certificateHashes: string[];

  merkleRoot: string;

  certificateCount: number;

  status: CertificateBatchStatus;

  createdAt: number;

  anchoredAt?: number;

  transactionHash?: string;

  blockNumber?: number;

  metadataURI?: string;
}