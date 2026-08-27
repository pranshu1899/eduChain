import { ethers } from "ethers";

import type {
  HackathonEvent,
  HackathonParticipant,
  HackathonCertificate,
  HackathonCertificateBatch,
} from "../types/hackathon";

// import {
//   hashEvidence,
// } from "../utils/evidenceCrypto";

import {
  buildMerkleTree,
  createMerkleProof,
} from "../utils/merkle";

/* =====================================================
   STORAGE KEYS
   ===================================================== */

const HACKATHONS_KEY =
  "eduproof:hackathons:v1";

const PARTICIPANTS_KEY =
  "eduproof:hackathon-participants:v1";

const CERTIFICATES_KEY =
  "eduproof:hackathon-certificates:v1";

const BATCHES_KEY =
  "eduproof:hackathon-batches:v1";

/* =====================================================
   GENERIC STORAGE
   ===================================================== */

function readArray<T>(
  key: string,
): T[] {
  try {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? (parsed as T[])
      : [];
  } catch {
    return [];
  }
}

function writeArray<T>(
  key: string,
  value: T[],
): void {
  localStorage.setItem(
    key,
    JSON.stringify(value),
  );
}

/* =====================================================
   ID
   ===================================================== */

function generateId(
  prefix: string,
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* =====================================================
   NORMALIZATION
   ===================================================== */

function required(
  value: string,
  field: string,
): string {
  const result =
    value.trim();

  if (!result) {
    throw new Error(
      `${field} is required.`,
    );
  }

  return result;
}

/* =====================================================
   HACKATHON
   ===================================================== */

export interface CreateHackathonInput {
  organizationId: string;
  organizationWallet: string;
  name: string;
  description: string;
  eventDate: string;
  venue?: string;
  website?: string;
}

export function createHackathon(
  input: CreateHackathonInput,
): HackathonEvent {
  const now =
    Date.now();

  const hackathon: HackathonEvent =
    {
      id:
        generateId("hackathon"),

      organizationId:
        required(
          input.organizationId,
          "Organization ID",
        ),

      organizationWallet:
        required(
          input.organizationWallet,
          "Organization wallet",
        ),

      name:
        required(
          input.name,
          "Hackathon name",
        ),

      description:
        required(
          input.description,
          "Description",
        ),

      eventDate:
        required(
          input.eventDate,
          "Event date",
        ),

      venue:
        input.venue?.trim() ||
        undefined,

      website:
        input.website?.trim() ||
        undefined,

      createdAt:
        now,

      updatedAt:
        now,
    };

  const existing =
    readArray<HackathonEvent>(
      HACKATHONS_KEY,
    );

  existing.unshift(
    hackathon,
  );

  writeArray(
    HACKATHONS_KEY,
    existing,
  );

  return hackathon;
}

export function getHackathons(): HackathonEvent[] {
  return readArray<HackathonEvent>(
    HACKATHONS_KEY,
  );
}

export function getHackathonById(
  id: string,
): HackathonEvent | null {
  return (
    getHackathons().find(
      (item) =>
        item.id === id,
    ) ?? null
  );
}

/* =====================================================
   PARTICIPANTS
   ===================================================== */

export interface AddParticipantInput {
  hackathonId: string;
  did: string;
  name: string;
  email?: string;
  team?: string;
  project?: string;
  result?: string;
  rank?: number;
  award?: string;
}

export function addHackathonParticipant(
  input: AddParticipantInput,
): HackathonParticipant {
  const hackathon =
    getHackathonById(
      input.hackathonId,
    );

  if (!hackathon) {
    throw new Error(
      "Hackathon not found.",
    );
  }

  const did =
    required(
      input.did,
      "Student DID",
    );

  const name =
    required(
      input.name,
      "Student name",
    );

  const participants =
    readArray<HackathonParticipant>(
      PARTICIPANTS_KEY,
    );

  const duplicate =
    participants.find(
      (participant) =>
        participant.hackathonId ===
          input.hackathonId &&
        participant.did.toLowerCase() ===
          did.toLowerCase(),
    );

  if (duplicate) {
    throw new Error(
      "This student is already registered for this hackathon.",
    );
  }

  if (
    input.rank !== undefined &&
    (!Number.isFinite(
      input.rank,
    ) ||
      input.rank < 1)
  ) {
    throw new Error(
      "Rank must be a positive number.",
    );
  }

  const participant: HackathonParticipant =
    {
      id:
        generateId("participant"),

      hackathonId:
        input.hackathonId,

      did,

      name,

      email:
        input.email?.trim() ||
        undefined,

      team:
        input.team?.trim() ||
        undefined,

      project:
        input.project?.trim() ||
        undefined,

      result:
        input.result?.trim() ||
        undefined,

      rank:
        input.rank !== undefined
          ? Math.floor(input.rank)
          : undefined,

      award:
        input.award?.trim() ||
        undefined,

      addedAt:
        Date.now(),
    };

  participants.unshift(
    participant,
  );

  writeArray(
    PARTICIPANTS_KEY,
    participants,
  );

  return participant;
}

export function getHackathonParticipants(
  hackathonId: string,
): HackathonParticipant[] {
  return readArray<HackathonParticipant>(
    PARTICIPANTS_KEY,
  ).filter(
    (participant) =>
      participant.hackathonId ===
      hackathonId,
  );
}

export function removeHackathonParticipant(
  participantId: string,
): void {
  const participants =
    readArray<HackathonParticipant>(
      PARTICIPANTS_KEY,
    );

  writeArray(
    PARTICIPANTS_KEY,
    participants.filter(
      (participant) =>
        participant.id !==
        participantId,
    ),
  );
}

/* =====================================================
   CERTIFICATE CANONICAL DATA
   ===================================================== */

function serializeCertificate(
  certificate: Omit<
    HackathonCertificate,
    | "certificateHash"
    | "merkleLeaf"
    | "merkleProof"
    | "merkleRoot"
  >,
): string {
  return JSON.stringify([
    ["id", certificate.id],
    ["hackathonId", certificate.hackathonId],
    ["participantId", certificate.participantId],
    ["participantDID", certificate.participantDID],
    ["participantName", certificate.participantName],
    ["hackathonName", certificate.hackathonName],
    ["team", certificate.team ?? ""],
    ["project", certificate.project ?? ""],
    ["result", certificate.result ?? ""],
    ["rank", certificate.rank ?? null],
    ["award", certificate.award ?? ""],
    ["issuedAt", certificate.issuedAt],
  ]);
}

/* =====================================================
   GENERATE CERTIFICATE
   ===================================================== */

function createCertificate(
  hackathon: HackathonEvent,
  participant: HackathonParticipant,
): HackathonCertificate {
  const certificateBase = {
    id:
      generateId("certificate"),

    hackathonId:
      hackathon.id,

    participantId:
      participant.id,

    participantDID:
      participant.did,

    participantName:
      participant.name,

    hackathonName:
      hackathon.name,

    team:
      participant.team,

    project:
      participant.project,

    result:
      participant.result,

    rank:
      participant.rank,

    award:
      participant.award,

    issuedAt:
      Date.now(),
  };

  const serialized =
    serializeCertificate(
      certificateBase,
    );

  const certificateHash =
    ethers.keccak256(
      ethers.toUtf8Bytes(
        serialized,
      ),
    );

  return {
    ...certificateBase,
    certificateHash,
  };
}

/* =====================================================
   GENERATE BATCH
   ===================================================== */

export function generateHackathonCertificateBatch(
  hackathonId: string,
): HackathonCertificateBatch {
  const hackathon =
    getHackathonById(
      hackathonId,
    );

  if (!hackathon) {
    throw new Error(
      "Hackathon not found.",
    );
  }

  const participants =
    getHackathonParticipants(
      hackathonId,
    );

  if (
    participants.length === 0
  ) {
    throw new Error(
      "Add at least one participant before generating certificates.",
    );
  }

  const certificates =
    readArray<HackathonCertificate>(
      CERTIFICATES_KEY,
    );

  const existingBatch =
    getHackathonBatches().find(
      (batch) =>
        batch.hackathonId ===
        hackathonId,
    );

  if (existingBatch) {
    throw new Error(
      "Certificates have already been generated for this hackathon.",
    );
  }

  const generated =
    participants.map(
      (participant) =>
        createCertificate(
          hackathon,
          participant,
        ),
    );

  const certificateHashes =
    generated.map(
      (certificate) =>
        certificate.certificateHash,
    );

  const tree =
    buildMerkleTree(
      certificateHashes,
    );

  const finalizedCertificates =
    generated.map(
      (certificate) => {
        const proof =
          createMerkleProof(
            certificateHashes,
            certificate.certificateHash,
          );

        return {
          ...certificate,

          merkleLeaf:
            proof.leaf,

          merkleProof:
            proof.siblings,

          merkleRoot:
            proof.root,
        };
      },
    );

  certificates.unshift(
    ...finalizedCertificates,
  );

  writeArray(
    CERTIFICATES_KEY,
    certificates,
  );

  const batch: HackathonCertificateBatch =
    {
      id:
        generateId("batch"),

      hackathonId,

      organizationWallet:
        hackathon.organizationWallet,

      certificateIds:
        finalizedCertificates.map(
          (certificate) =>
            certificate.id,
        ),

      certificateHashes,

      merkleRoot:
        tree.root,

      certificateCount:
        finalizedCertificates.length,

      status:
        "GENERATED",

      createdAt:
        Date.now(),
    };

  const batches =
    getHackathonBatches();

  batches.unshift(
    batch,
  );

  writeArray(
    BATCHES_KEY,
    batches,
  );

  return batch;
}

/* =====================================================
   CERTIFICATES
   ===================================================== */

export function getHackathonCertificates(
  hackathonId: string,
): HackathonCertificate[] {
  return readArray<HackathonCertificate>(
    CERTIFICATES_KEY,
  ).filter(
    (certificate) =>
      certificate.hackathonId ===
      hackathonId,
  );
}

export function getHackathonCertificateById(
  id: string,
): HackathonCertificate | null {
  return (
    readArray<HackathonCertificate>(
      CERTIFICATES_KEY,
    ).find(
      (certificate) =>
        certificate.id === id,
    ) ?? null
  );
}

/* =====================================================
   BATCHES
   ===================================================== */

export function getHackathonBatches(): HackathonCertificateBatch[] {
  return readArray<HackathonCertificateBatch>(
    BATCHES_KEY,
  );
}

export function getHackathonBatchById(
  id: string,
): HackathonCertificateBatch | null {
  return (
    getHackathonBatches().find(
      (batch) =>
        batch.id === id,
    ) ?? null
  );
}

/* =====================================================
   VERIFY CERTIFICATE LOCALLY
   ===================================================== */

export function verifyHackathonCertificateLocally(
  certificateId: string,
): {
  verified: boolean;
  certificate: HackathonCertificate | null;
  batch: HackathonCertificateBatch | null;
  reason: string;
} {
  const certificate =
    getHackathonCertificateById(
      certificateId,
    );

  if (!certificate) {
    return {
      verified: false,
      certificate: null,
      batch: null,
      reason:
        "Certificate does not exist locally.",
    };
  }

  const batch =
    getHackathonBatches().find(
      (item) =>
        item.hackathonId ===
        certificate.hackathonId,
    ) ?? null;

  if (!batch) {
    return {
      verified: false,
      certificate,
      batch: null,
      reason:
        "Certificate batch does not exist.",
    };
  }

  const expectedRoot =
    certificate.merkleRoot;

  if (
    !expectedRoot
  ) {
    return {
      verified: false,
      certificate,
      batch,
      reason:
        "Certificate has no Merkle root.",
    };
  }

  if (
    expectedRoot.toLowerCase() !==
    batch.merkleRoot.toLowerCase()
  ) {
    return {
      verified: false,
      certificate,
      batch,
      reason:
        "Certificate Merkle root does not match its batch.",
    };
  }

  return {
    verified: true,
    certificate,
    batch,
    reason:
      "Certificate belongs to the generated Merkle batch.",
  };
}

/* =====================================================
   CLEAR DEVELOPMENT DATA
   ===================================================== */

export function clearHackathonData(): void {
  localStorage.removeItem(
    HACKATHONS_KEY,
  );

  localStorage.removeItem(
    PARTICIPANTS_KEY,
  );

  localStorage.removeItem(
    CERTIFICATES_KEY,
  );

  localStorage.removeItem(
    BATCHES_KEY,
  );
}