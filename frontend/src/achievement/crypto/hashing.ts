import {
  keccak256,
  toUtf8Bytes,
} from "ethers";

export function hashCanonicalEvidence(
  canonicalData: string
): string {
  return keccak256(
    toUtf8Bytes(canonicalData)
  );
}