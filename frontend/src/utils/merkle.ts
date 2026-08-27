import { ethers } from "ethers";

/* =====================================================
   TYPES
   ===================================================== */

export interface MerkleProof {
  leaf: string;

  siblings: string[];

  indices: number[];

  root: string;
}

export interface MerkleTree {
  leaves: string[];

  levels: string[][];

  root: string;
}

/* =====================================================
   VALIDATION
   ===================================================== */

function validateHash(
  hash: string,
): void {
  if (
    !ethers.isHexString(
      hash,
      32,
    )
  ) {
    throw new Error(
      `Invalid Merkle hash: ${hash}. Expected bytes32.`,
    );
  }
}

/* =====================================================
   NORMALIZE HASHES
   ===================================================== */

export function normalizeMerkleLeaves(
  hashes: string[],
): string[] {
  const normalized =
    hashes.map((hash) => {
      validateHash(hash);

      return hash.toLowerCase();
    });

  return Array.from(
    new Set(normalized),
  ).sort();
}

/* =====================================================
   HASH LEAF
   ===================================================== */

export function hashMerkleLeaf(
  evidenceHash: string,
): string {
  validateHash(
    evidenceHash,
  );

  return ethers.keccak256(
    ethers.concat([
      ethers.toUtf8Bytes(
        "EDUPROOF_EVIDENCE_LEAF",
      ),
      ethers.getBytes(
        evidenceHash,
      ),
    ]),
  );
}

/* =====================================================
   HASH INTERNAL NODE
   ===================================================== */

export function hashMerklePair(
  left: string,
  right: string,
): string {
  validateHash(left);
  validateHash(right);

  const leftBytes =
    ethers.getBytes(left);

  const rightBytes =
    ethers.getBytes(right);

  const leftHex =
    ethers.hexlify(leftBytes);

  const rightHex =
    ethers.hexlify(rightBytes);

  const ordered =
    leftHex.toLowerCase() <=
    rightHex.toLowerCase()
      ? [
          leftBytes,
          rightBytes,
        ]
      : [
          rightBytes,
          leftBytes,
        ];

  return ethers.keccak256(
    ethers.concat(
      ordered,
    ),
  );
}

/* =====================================================
   BUILD TREE
   ===================================================== */

export function buildMerkleTree(
  evidenceHashes: string[],
): MerkleTree {
  const normalized =
    normalizeMerkleLeaves(
      evidenceHashes,
    );

  if (
    normalized.length === 0
  ) {
    throw new Error(
      "Cannot build a Merkle tree without evidence.",
    );
  }

  const leaves =
    normalized.map(
      hashMerkleLeaf,
    );

  const levels: string[][] = [
    leaves,
  ];

  let currentLevel =
    leaves;

  while (
    currentLevel.length > 1
  ) {
    const nextLevel: string[] =
      [];

    for (
      let i = 0;
      i < currentLevel.length;
      i += 2
    ) {
      const left =
        currentLevel[i];

      const right =
        currentLevel[i + 1] ??
        left;

      nextLevel.push(
        hashMerklePair(
          left,
          right,
        ),
      );
    }

    levels.push(
      nextLevel,
    );

    currentLevel =
      nextLevel;
  }

  return {
    leaves,
    levels,
    root:
      currentLevel[0],
  };
}

/* =====================================================
   GET ROOT
   ===================================================== */

export function getMerkleRoot(
  evidenceHashes: string[],
): string {
  return buildMerkleTree(
    evidenceHashes,
  ).root;
}

/* =====================================================
   FIND LEAF
   ===================================================== */

function findLeafIndex(
  tree: MerkleTree,
  evidenceHash: string,
): number {
  const leaf =
    hashMerkleLeaf(
      evidenceHash,
    );

  return tree.leaves.findIndex(
    (item) =>
      item.toLowerCase() ===
      leaf.toLowerCase(),
  );
}

/* =====================================================
   CREATE INCLUSION PROOF
   ===================================================== */

export function createMerkleProof(
  evidenceHashes: string[],
  evidenceHash: string,
): MerkleProof {
  const tree =
    buildMerkleTree(
      evidenceHashes,
    );

  const index =
    findLeafIndex(
      tree,
      evidenceHash,
    );

  if (
    index === -1
  ) {
    throw new Error(
      "Evidence hash is not present in this Merkle tree.",
    );
  }

  const siblings: string[] =
    [];

  const indices: number[] =
    [];

  let currentIndex =
    index;

  for (
    let level = 0;
    level <
    tree.levels.length - 1;
    level++
  ) {
    const current =
      tree.levels[level];

    const siblingIndex =
      currentIndex % 2 === 0
        ? currentIndex + 1
        : currentIndex - 1;

    const sibling =
      current[siblingIndex] ??
      current[currentIndex];

    siblings.push(
      sibling,
    );

    indices.push(
      currentIndex % 2,
    );

    currentIndex =
      Math.floor(
        currentIndex / 2,
      );
  }

  return {
    leaf:
      tree.leaves[index],

    siblings,

    indices,

    root:
      tree.root,
  };
}

/* =====================================================
   VERIFY INCLUSION PROOF
   ===================================================== */

export function verifyMerkleProof(
  proof: MerkleProof,
): boolean {
  try {
    validateHash(
      proof.leaf,
    );

    validateHash(
      proof.root,
    );

    if (
      proof.siblings.length !==
      proof.indices.length
    ) {
      return false;
    }

    let current =
      proof.leaf;

    for (
      let i = 0;
      i < proof.siblings.length;
      i++
    ) {
      const sibling =
        proof.siblings[i];

      validateHash(
        sibling,
      );

      /*
       * Direction is intentionally not required
       * for the calculation because hashMerklePair()
       * sorts both children before hashing.
       */
      current =
        hashMerklePair(
          current,
          sibling,
        );
    }

    return (
      current.toLowerCase() ===
      proof.root.toLowerCase()
    );
  } catch {
    return false;
  }
}

/* =====================================================
   VERIFY EVIDENCE MERKLE PROOF
   ===================================================== */

export function verifyEvidenceMerkleProof(
  evidenceHash: string,
  proof: MerkleProof,
): boolean {
  try {
    const expectedLeaf =
      hashMerkleLeaf(
        evidenceHash,
      );

    if (
      expectedLeaf.toLowerCase() !==
      proof.leaf.toLowerCase()
    ) {
      return false;
    }

    return verifyMerkleProof(
      proof,
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
    validateHash(
      expectedRoot,
    );

    const calculatedRoot =
      getMerkleRoot(
        evidenceHashes,
      );

    return (
      calculatedRoot.toLowerCase() ===
      expectedRoot.toLowerCase()
    );
  } catch {
    return false;
  }
}

/* =====================================================
   TREE SUMMARY
   ===================================================== */

export function getMerkleTreeSummary(
  evidenceHashes: string[],
): {
  evidenceCount: number;
  leafCount: number;
  treeDepth: number;
  root: string;
} {
  const tree =
    buildMerkleTree(
      evidenceHashes,
    );

  return {
    evidenceCount:
      evidenceHashes.length,

    leafCount:
      tree.leaves.length,

    treeDepth:
      tree.levels.length - 1,

    root:
      tree.root,
  };
}