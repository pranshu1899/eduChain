import { ethers } from "ethers";

/* =====================================================
   TYPES
   ===================================================== */

export interface MerkleProof {
  leaf: string;
  proof: string[];
  root: string;
  index: number;
}

export interface MerkleTreeResult {
  root: string;
  leaves: string[];
  proofs: MerkleProof[];
}

/* =====================================================
   NORMALIZE HASH
   ===================================================== */

function normalizeHash(
  hash: string,
): string {
  if (
    !ethers.isHexString(
      hash,
      32,
    )
  ) {
    throw new Error(
      "Evidence hash must be a valid bytes32 value.",
    );
  }

  return hash.toLowerCase();
}

/* =====================================================
   HASH TWO NODES
   ===================================================== */

/**
 * Hash two Merkle nodes together.
 *
 * Sorting the pair makes the tree deterministic and
 * avoids needing left/right direction information during
 * verification.
 */
export function hashMerklePair(
  left: string,
  right: string,
): string {
  const normalizedLeft =
    normalizeHash(left);

  const normalizedRight =
    normalizeHash(right);

  const ordered =
    normalizedLeft <= normalizedRight
      ? [
          normalizedLeft,
          normalizedRight,
        ]
      : [
          normalizedRight,
          normalizedLeft,
        ];

  return ethers.keccak256(
    ethers.concat(ordered),
  );
}

/* =====================================================
   BUILD NEXT LEVEL
   ===================================================== */

function buildNextLevel(
  level: string[],
): string[] {
  const next: string[] = [];

  for (
    let index = 0;
    index < level.length;
    index += 2
  ) {
    const left =
      level[index];

    const right =
      level[index + 1] ??
      left;

    next.push(
      hashMerklePair(
        left,
        right,
      ),
    );
  }

  return next;
}

/* =====================================================
   BUILD MERKLE ROOT
   ===================================================== */

export function buildMerkleRoot(
  evidenceHashes: string[],
): string {
  if (
    evidenceHashes.length === 0
  ) {
    throw new Error(
      "Cannot build a Merkle tree without evidence.",
    );
  }

  let level =
    evidenceHashes
      .map(normalizeHash)
      .sort();

  while (
    level.length > 1
  ) {
    level =
      buildNextLevel(
        level,
      );
  }

  return level[0];
}

/* =====================================================
   BUILD PROOF FOR ONE LEAF
   ===================================================== */

function buildProofForLeaf(
  leaves: string[],
  targetIndex: number,
): string[] {
  const proof: string[] = [];

  let currentLevel =
    leaves;

  let index =
    targetIndex;

  while (
    currentLevel.length > 1
  ) {
    const siblingIndex =
      index % 2 === 0
        ? index + 1
        : index - 1;

    const sibling =
      currentLevel[
        siblingIndex
      ] ?? currentLevel[index];

    proof.push(
      sibling,
    );

    currentLevel =
      buildNextLevel(
        currentLevel,
      );

    index =
      Math.floor(
        index / 2,
      );
  }

  return proof;
}

/* =====================================================
   BUILD COMPLETE TREE
   ===================================================== */

export function buildMerkleTree(
  evidenceHashes: string[],
): MerkleTreeResult {
  if (
    evidenceHashes.length === 0
  ) {
    throw new Error(
      "At least one evidence hash is required.",
    );
  }

  const leaves =
    evidenceHashes
      .map(normalizeHash)
      .sort();

  const root =
    buildMerkleRoot(
      leaves,
    );

  const proofs =
    leaves.map(
      (leaf, index) => ({
        leaf,
        proof:
          buildProofForLeaf(
            leaves,
            index,
          ),
        root,
        index,
      }),
    );

  return {
    root,
    leaves,
    proofs,
  };
}

/* =====================================================
   GET PROOF
   ===================================================== */

export function getMerkleProof(
  evidenceHash: string,
  evidenceHashes: string[],
): MerkleProof {
  const target =
    normalizeHash(
      evidenceHash,
    );

  const tree =
    buildMerkleTree(
      evidenceHashes,
    );

  const proof =
    tree.proofs.find(
      (item) =>
        item.leaf === target,
    );

  if (!proof) {
    throw new Error(
      "Evidence hash was not found in the Merkle tree.",
    );
  }

  return proof;
}

/* =====================================================
   VERIFY MERKLE PROOF
   ===================================================== */

export function verifyMerkleProof(
  leaf: string,
  proof: string[],
  expectedRoot: string,
): boolean {
  try {
    let computed =
      normalizeHash(
        leaf,
      );

    for (
      const sibling of proof
    ) {
      computed =
        hashMerklePair(
          computed,
          sibling,
        );
    }

    return (
      computed.toLowerCase() ===
      normalizeHash(
        expectedRoot,
      ).toLowerCase()
    );
  } catch {
    return false;
  }
}

/* =====================================================
   VERIFY TREE
   ===================================================== */

export function verifyMerkleTree(
  evidenceHashes: string[],
  expectedRoot: string,
): boolean {
  try {
    const root =
      buildMerkleRoot(
        evidenceHashes,
      );

    return (
      root.toLowerCase() ===
      normalizeHash(
        expectedRoot,
      ).toLowerCase()
    );
  } catch {
    return false;
  }
}