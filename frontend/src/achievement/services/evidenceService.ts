import type {
  Evidence,
  ProjectEvidenceData,
} from "../types/evidence";

import {
  canonicalizeProjectEvidence,
} from "../crypto/canonical";

import {
  hashCanonicalEvidence,
} from "../crypto/hashing";

import {
  signEvidenceHash,
  verifyEvidenceSignature,
} from "../crypto/signatures";

function createEvidenceId(): string {
  return (
    `evidence_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`
  );
}

export async function createProjectEvidence(
  data: ProjectEvidenceData
): Promise<Evidence> {
  const canonicalData =
    canonicalizeProjectEvidence(
      data
    );

  const evidenceHash =
    hashCanonicalEvidence(
      canonicalData
    );

  const {
    signature,
    signer,
  } = await signEvidenceHash(
    evidenceHash
  );

  if (
    signer.toLowerCase() !==
    data.owner.toLowerCase()
  ) {
    throw new Error(
      "Connected wallet does not match the evidence owner."
    );
  }

  const signatureValid =
    verifyEvidenceSignature(
      evidenceHash,
      signature,
      data.owner
    );

  if (!signatureValid) {
    throw new Error(
      "Evidence signature verification failed."
    );
  }

  return {
    id: createEvidenceId(),

    owner: data.owner,

    type: "PROJECT",

    title:
      data.projectId,

    description:
      `Project evidence for ${data.repository}`,

    metadataHash:
      evidenceHash,

    evidenceHash,

    signature,

    createdAt:
      data.timestamp,

    status:
      "ACTIVE",

    verificationLevel:
      "SELF_ATTESTED",
  };
}