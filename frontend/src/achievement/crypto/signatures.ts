import {
  BrowserProvider,
  verifyMessage,
} from "ethers";

export async function signEvidenceHash(
  evidenceHash: string
): Promise<{
  signature: string;
  signer: string;
}> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed."
    );
  }

  const provider =
    new BrowserProvider(
      window.ethereum
    );

  const signer =
    await provider.getSigner();

  const signerAddress =
    await signer.getAddress();

  const signature =
    await signer.signMessage(
      evidenceHash
    );

  return {
    signature,
    signer: signerAddress,
  };
}

export function verifyEvidenceSignature(
  evidenceHash: string,
  signature: string,
  expectedOwner: string
): boolean {
  try {
    const recoveredAddress =
      verifyMessage(
        evidenceHash,
        signature
      );

    return (
      recoveredAddress.toLowerCase() ===
      expectedOwner.toLowerCase()
    );
  } catch {
    return false;
  }
}