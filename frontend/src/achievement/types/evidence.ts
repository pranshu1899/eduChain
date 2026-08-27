export type EvidenceType =
  | "PROJECT"
  | "COURSE"
  | "ASSESSMENT"
  | "HACKATHON"
  | "INTERNSHIP"
  | "OPEN_SOURCE"
  | "RESEARCH"
  | "ATTESTATION";

export type EvidenceStatus =
  | "ACTIVE"
  | "REVOKED"
  | "EXPIRED"
  | "PENDING";

export type VerificationLevel =
  | "SELF_ATTESTED"
  | "SYSTEM_VERIFIED"
  | "EXTERNALLY_ATTESTED";

export interface Evidence {
  id: string;
  owner: string;

  type: EvidenceType;

  title: string;
  description: string;

  metadataHash: string;
  evidenceHash: string;

  signature: string;

  createdAt: number;

  status: EvidenceStatus;

  verificationLevel: VerificationLevel;
}

export interface ProjectEvidenceData {
  projectId: string;
  owner: string;
  repository: string;
  commit: string;
  skills: string[];
  timestamp: number;
}