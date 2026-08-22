import {
  BrowserProvider,
  Contract,
  solidityPackedKeccak256,
  getBytes,
} from "ethers";

import EduProofArtifact from "../abi/EduProof.json";

import {
  EDUProof_CONTRACT_ADDRESS,
  SEPOLIA_CHAIN_ID,
} from "./contract";

// =========================================================
// TYPES
// =========================================================

export interface Credential {
  id: number;
  version: number;
  issuer: string;
  studentDID: string;
  credentialType: string;
  institution: string;
  institutionId: string;
  degree: string;
  issueDate: string;
  credentialHash: string;
  signature: string;
  ipfsUri: string;
  status: number;
  active: boolean;
  createdAt: number;
  revokedAt: number;
}

export interface VerificationChecks {
  hashMatches: boolean;
  signatureValid: boolean;
  issuerAuthorized: boolean;
  credentialActive: boolean;
  studentDIDMatches: boolean;
  issuerDIDPresent: boolean;
}

export interface Issuer {
  wallet: string;
  institutionName: string;
  institutionId: string;
  status: number;
}

export interface IssuerRequest {
  wallet: string;
  institutionName: string;
  institutionId: string;
  status: number;
}

export interface IssueCredentialResult {
  credentialId: number | null;
  transactionHash: string;
  credentialHash: string;
  signature: string;
  ipfsUri: string;
  cid: string;
  institution: string;
  institutionId: string;
  version: number;
  verifiableCredential: unknown;
}

export interface UpdateCredentialResult {
  previousCredentialId: number;
  credentialId: number | null;
  version: number;
  transactionHash: string;
  credentialHash: string;
  signature: string;
  ipfsUri: string;
  cid: string;
  institution: string;
  institutionId: string;
  verifiableCredential: unknown;
}

// =========================================================
// ISSUER STATUS
// =========================================================

export const ISSUER_STATUS = {
  NONE: 0,
  PENDING: 1,
  AUTHORIZED: 2,
  SUSPENDED: 3,
  REVOKED: 4,
  REJECTED: 5,
} as const;

// =========================================================
// EVENT SCANNING
// =========================================================

const EVENT_QUERY_CHUNK_SIZE = 9_000;

const DEFAULT_EVENT_LOOKBACK = 200_000;

const configuredDeploymentBlock =
  import.meta.env.VITE_EDUPROOF_DEPLOYMENT_BLOCK;

function getEventStartBlock(
  latestBlock: number
): number {
  if (configuredDeploymentBlock) {
    const parsed = Number(
      configuredDeploymentBlock
    );

    if (
      Number.isInteger(parsed) &&
      parsed >= 0 &&
      parsed <= latestBlock
    ) {
      return parsed;
    }
  }

  return Math.max(
    0,
    latestBlock - DEFAULT_EVENT_LOOKBACK
  );
}

// =========================================================
// PINATA GATEWAY
// =========================================================

function getPinataGatewayUrl(): string {
  const configured =
    import.meta.env.VITE_PINATA_GATEWAY_URL;

  if (configured) {
    return configured
      .trim()
      .replace(/\/+$/, "");
  }

  return "https://gateway.pinata.cloud";
}

function buildIpfsGatewayUrl(
  cid: string
): string {
  const gateway =
    getPinataGatewayUrl();

  if (gateway.includes("/ipfs")) {
    return `${gateway}/${cid}`;
  }

  return `${gateway}/ipfs/${cid}`;
}

// =========================================================
// PROVIDER
// =========================================================

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed."
    );
  }

  const provider =
    new BrowserProvider(
      window.ethereum
    );

  const network =
    await provider.getNetwork();

  if (
    Number(network.chainId) !==
    SEPOLIA_CHAIN_ID
  ) {
    throw new Error(
      "Please switch MetaMask to Ethereum Sepolia."
    );
  }

  return provider;
}

// =========================================================
// READ-ONLY CONTRACT
// =========================================================

export async function getContract() {
  const provider =
    await getProvider();

  return new Contract(
    EDUProof_CONTRACT_ADDRESS,
    EduProofArtifact.abi,
    provider
  );
}

// =========================================================
// SIGNER CONTRACT
// =========================================================

export async function getSignerContract() {
  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  return new Contract(
    EDUProof_CONTRACT_ADDRESS,
    EduProofArtifact.abi,
    signer
  );
}

// =========================================================
// AUTHORITY
// =========================================================

export async function getAuthority(): Promise<string> {
  const contract =
    await getContract();

  return await contract.authority();
}

export async function isAuthority(
  address: string
): Promise<boolean> {
  const authority =
    await getAuthority();

  return (
    authority.toLowerCase() ===
    address.toLowerCase()
  );
}

// =========================================================
// ISSUER REQUEST
// =========================================================

export async function requestIssuer(
  institutionName: string,
  institutionId: string
): Promise<string> {
  if (!institutionName.trim()) {
    throw new Error(
      "Institution name is required."
    );
  }

  if (!institutionId.trim()) {
    throw new Error(
      "Institution ID is required."
    );
  }

  const contract =
    await getSignerContract();

  const tx =
    await contract.requestIssuer(
      institutionName.trim(),
      institutionId.trim()
    );

  const receipt =
    await tx.wait();

  return receipt.hash;
}

// =========================================================
// GET ISSUER
// =========================================================

export async function getIssuer(
  address: string
): Promise<Issuer> {
  const contract =
    await getContract();

  const issuer =
    await contract.getIssuer(
      address
    );

  return {
    wallet: issuer[0],
    institutionName: issuer[1],
    institutionId: issuer[2],
    status: Number(issuer[3]),
  };
}

// =========================================================
// GET CURRENT ISSUER
// =========================================================

export async function getCurrentIssuer(): Promise<Issuer> {
  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  const address =
    await signer.getAddress();

  return getIssuer(address);
}

// =========================================================
// AUTHORIZED ISSUER
// =========================================================

export async function isAuthorizedIssuer(
  address: string
): Promise<boolean> {
  const contract =
    await getContract();

  return await contract.isAuthorizedIssuer(
    address
  );
}

// =========================================================
// ISSUER STATUS
// =========================================================

export async function getIssuerStatus(
  address: string
): Promise<number> {
  const issuer =
    await getIssuer(address);

  return issuer.status;
}

// =========================================================
// GET PENDING ISSUER REQUESTS
// =========================================================
export async function getPendingIssuerRequests(): Promise<
  IssuerRequest[]
> {
  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  const signerAddress =
    await signer.getAddress();

  const authority =
    await getAuthority();

  if (
    signerAddress.toLowerCase() !==
    authority.toLowerCase()
  ) {
    throw new Error(
      "Only the EduProof authority can view pending issuer requests."
    );
  }

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  const pendingWallets =
    await contract.getPendingIssuerRequests();

  const requests: IssuerRequest[] =
    [];

  for (
    const wallet of pendingWallets
  ) {
    const issuer =
      await getIssuer(wallet);

    requests.push({
      wallet: issuer.wallet,
      institutionName:
        issuer.institutionName,
      institutionId:
        issuer.institutionId,
      status: issuer.status,
    });
  }

  return requests;
}
// =========================================================
// APPROVE ISSUER
// =========================================================

export async function authorizeIssuer(
  issuerAddress: string
): Promise<string> {
  if (!issuerAddress) {
    throw new Error(
      "Issuer address is required."
    );
  }

  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  const signerAddress =
    await signer.getAddress();

  const authority =
    await getAuthority();

  if (
    signerAddress.toLowerCase() !==
    authority.toLowerCase()
  ) {
    throw new Error(
      "Only the EduProof authority can approve issuers."
    );
  }

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  const tx =
    await contract.authorizeIssuer(
      issuerAddress
    );

  const receipt =
    await tx.wait();

  return receipt.hash;
}

// =========================================================
// REJECT ISSUER
// =========================================================

export async function rejectIssuer(
  issuerAddress: string
): Promise<string> {
  if (!issuerAddress) {
    throw new Error(
      "Issuer address is required."
    );
  }

  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  const signerAddress =
    await signer.getAddress();

  const authority =
    await getAuthority();

  if (
    signerAddress.toLowerCase() !==
    authority.toLowerCase()
  ) {
    throw new Error(
      "Only the EduProof authority can reject issuers."
    );
  }

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  const tx =
    await contract.rejectIssuer(
      issuerAddress
    );

  const receipt =
    await tx.wait();

  return receipt.hash;
}

// =========================================================
// SUSPEND ISSUER
// =========================================================

export async function suspendIssuer(
  issuerAddress: string
): Promise<string> {
  if (!issuerAddress) {
    throw new Error(
      "Issuer address is required."
    );
  }

  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  const signerAddress =
    await signer.getAddress();

  const authority =
    await getAuthority();

  if (
    signerAddress.toLowerCase() !==
    authority.toLowerCase()
  ) {
    throw new Error(
      "Only the EduProof authority can suspend issuers."
    );
  }

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  const tx =
    await contract.suspendIssuer(
      issuerAddress
    );

  const receipt =
    await tx.wait();

  return receipt.hash;
}

// =========================================================
// REVOKE ISSUER
// =========================================================

export async function revokeIssuer(
  issuerAddress: string
): Promise<string> {
  if (!issuerAddress) {
    throw new Error(
      "Issuer address is required."
    );
  }

  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  const signerAddress =
    await signer.getAddress();

  const authority =
    await getAuthority();

  if (
    signerAddress.toLowerCase() !==
    authority.toLowerCase()
  ) {
    throw new Error(
      "Only the EduProof authority can revoke issuers."
    );
  }

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  const tx =
    await contract.revokeIssuer(
      issuerAddress
    );

  const receipt =
    await tx.wait();

  return receipt.hash;
}

// =========================================================
// GET CREDENTIAL
// =========================================================

export async function getCredential(
  credentialId: number
): Promise<Credential> {
  const contract =
    await getContract();

  const credential =
    await contract.getCredential(
      credentialId
    );

  return {
    id: Number(credential[0]),
    version: Number(credential[1]),
    issuer: credential[2],
    studentDID: credential[3],
    credentialType: credential[4],
    institution: credential[5],
    institutionId: credential[6],
    degree: credential[7],
    issueDate: credential[8],
    credentialHash: credential[9],
    signature: credential[10],
    ipfsUri: credential[11],
    status: Number(credential[12]),
    active:
      Number(credential[12]) === 1,
    createdAt: Number(credential[13]),
    revokedAt: 0,
  };
}

// =========================================================
// VERSION HISTORY
// =========================================================

export async function getVersionHistory(
  credentialId: number
): Promise<number[]> {
  const contract =
    await getContract();

  const history =
    await contract.getVersionHistory(
      credentialId
    );

  return Array.from(
    history as Iterable<bigint>
  ).map(
    (id: bigint) => Number(id)
  );
}

export async function getCredentialVersionHistory(
  credentialId: number
): Promise<Credential[]> {
  const versionIds =
    await getVersionHistory(
      credentialId
    );

  return Promise.all(
    versionIds.map(
      (id: number) =>
        getCredential(id)
    )
  );
}

// =========================================================
// GET ALL CREDENTIAL IDS
// =========================================================

export async function getCredentialIds(): Promise<
  number[]
> {
  const contract =
    await getContract();

  const provider =
    await getProvider();

  const latestBlock =
    await provider.getBlockNumber();

  const startBlock =
    getEventStartBlock(
      latestBlock
    );

  const filter =
    contract.filters.CredentialIssued();

  const ids =
    new Set<number>();

  let fromBlock =
    startBlock;

  while (
    fromBlock <= latestBlock
  ) {
    const toBlock =
      Math.min(
        fromBlock +
          EVENT_QUERY_CHUNK_SIZE -
          1,
        latestBlock
      );

    const events =
      await contract.queryFilter(
        filter,
        fromBlock,
        toBlock
      );

    for (
      const event of events
    ) {
      if (
        "args" in event &&
        event.args
      ) {
        const credentialId =
          Number(
            event.args[0]
          );

        if (
          Number.isInteger(
            credentialId
          ) &&
          credentialId > 0
        ) {
          ids.add(
            credentialId
          );
        }
      }
    }

    fromBlock =
      toBlock + 1;
  }

  return Array.from(ids).sort(
    (a, b) => a - b
  );
}

// =========================================================
// GET ALL CREDENTIALS
// =========================================================

export async function getAllCredentials(): Promise<
  Credential[]
> {
  const ids =
    await getCredentialIds();

  if (ids.length === 0) {
    return [];
  }

  const credentials =
    await Promise.all(
      ids.map(
        (id: number) =>
          getCredential(id)
      )
    );

  return credentials.sort(
    (a, b) => a.id - b.id
  );
}

// =========================================================
// FETCH IPFS VC
// =========================================================

export async function fetchVerifiableCredential(
  ipfsUri: string
): Promise<any> {
  if (!ipfsUri) {
    throw new Error(
      "Credential does not contain an IPFS URI."
    );
  }

  const cid =
    ipfsUri
      .replace(/^ipfs:\/\//, "")
      .trim();

  if (!cid) {
    throw new Error(
      "Invalid IPFS URI."
    );
  }

  const url =
    buildIpfsGatewayUrl(cid);

  const response =
    await fetch(url, {
      headers: {
        Accept:
          "application/json",
      },
    });

  if (!response.ok) {
    throw new Error(
      `IPFS request failed: ${response.status}`
    );
  }

  const data =
    await response.json();

  return data;
}

// =========================================================
// VERIFY CREDENTIAL
// =========================================================

export async function verifyCredential(
  credentialId: number
) {
  const contract =
    await getContract();

  const credential =
    await getCredential(
      credentialId
    );

  const verifiableCredential =
    await fetchVerifiableCredential(
      credential.ipfsUri
    );

  const vcHash =
    verifiableCredential
      ?.proof
      ?.credentialHash;

  const hashMatches =
    typeof vcHash === "string" &&
    vcHash.toLowerCase() ===
      credential.credentialHash.toLowerCase();

  const signatureValid =
    await contract.verifyCredentialSignature(
      credentialId
    );

  const issuerAuthorized =
    await isAuthorizedIssuer(
      credential.issuer
    );

  const credentialActive =
    credential.active;

  const vcStudentDID =
    verifiableCredential
      ?.credentialSubject
      ?.id;

  const studentDIDMatches =
    typeof vcStudentDID === "string" &&
    vcStudentDID ===
      credential.studentDID;

  const vcIssuerDID =
    verifiableCredential
      ?.issuer
      ?.id;

  const issuerDIDPresent =
    typeof vcIssuerDID === "string" &&
    vcIssuerDID.length > 0;

  const verified =
    hashMatches &&
    signatureValid &&
    issuerAuthorized &&
    credentialActive &&
    studentDIDMatches &&
    issuerDIDPresent;

  return {
    verified,

    credential,

    verifiableCredential,

    checks: {
      hashMatches,
      signatureValid,
      issuerAuthorized,
      credentialActive,
      studentDIDMatches,
      issuerDIDPresent,
    } satisfies VerificationChecks,
  };
}

// =========================================================
// CREATE CREDENTIAL HASH
// =========================================================

export function createCredentialHash(
  studentDID: string,
  credentialType: string,
  institution: string,
  institutionId: string,
  degree: string,
  issueDate: string,
  version: number
): string {
  return solidityPackedKeccak256(
    [
      "string",
      "string",
      "string",
      "string",
      "string",
      "string",
      "uint256",
    ],
    [
      studentDID,
      credentialType,
      institution,
      institutionId,
      degree,
      issueDate,
      version,
    ]
  );
}

// =========================================================
// PINATA UPLOAD
// =========================================================

async function uploadToPinata(
  verifiableCredential: unknown
): Promise<string> {
  const jwt =
    import.meta.env
      .VITE_PINATA_JWT;

  if (!jwt) {
    throw new Error(
      "VITE_PINATA_JWT is missing from frontend/.env"
    );
  }

  const response =
    await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${jwt}`,
        },

        body: JSON.stringify({
          pinataContent:
            verifiableCredential,

          pinataMetadata: {
            name:
              `EduProof Credential ${Date.now()}`,
          },
        }),
      }
    );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      `Pinata upload failed: ${message}`
    );
  }

  const result =
    await response.json();

  if (!result.IpfsHash) {
    throw new Error(
      "Pinata did not return an IPFS CID."
    );
  }

  return result.IpfsHash;
}

// =========================================================
// EXTRACT CREDENTIAL ID
// =========================================================

function extractCredentialId(
  contract: Contract,
  receipt: any
): number | null {
  for (
    const log of receipt.logs
  ) {
    try {
      const parsed =
        contract.interface.parseLog(
          log
        );

      if (
        parsed &&
        parsed.name ===
          "CredentialIssued"
      ) {
        return Number(
          parsed.args[0]
        );
      }
    } catch {
      // Ignore unrelated logs.
    }
  }

  return null;
}

// =========================================================
// ISSUE CREDENTIAL
// =========================================================

export async function issueCredential(
  studentDID: string,
  credentialType: string,
  degree: string,
  issueDate: string
): Promise<IssueCredentialResult> {
  if (!studentDID.trim()) {
    throw new Error(
      "Student DID is required."
    );
  }

  if (!credentialType.trim()) {
    throw new Error(
      "Credential type is required."
    );
  }

  if (!degree.trim()) {
    throw new Error(
      "Degree is required."
    );
  }

  if (!issueDate.trim()) {
    throw new Error(
      "Issue date is required."
    );
  }

  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  const issuerAddress =
    await signer.getAddress();

  const authorized =
    await isAuthorizedIssuer(
      issuerAddress
    );

  if (!authorized) {
    throw new Error(
      "Connected wallet is not an authorized university issuer."
    );
  }

  const issuer =
    await getIssuer(
      issuerAddress
    );

  const institution =
    issuer.institutionName;

  const institutionId =
    issuer.institutionId;

  if (!institution) {
    throw new Error(
      "Issuer institution is not registered."
    );
  }

  if (!institutionId) {
    throw new Error(
      "Issuer institution ID is not registered."
    );
  }

  const version = 1;

  const credentialHash =
    createCredentialHash(
      studentDID,
      credentialType,
      institution,
      institutionId,
      degree,
      issueDate,
      version
    );

  const signature =
    await signer.signMessage(
      getBytes(
        credentialHash
      )
    );

  const verifiableCredential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
    ],

    type: [
      "VerifiableCredential",
      "EducationalCredential",
    ],

    issuer: {
      id:
        `did:eduproof:${issuerAddress.toLowerCase()}`,
      name: institution,
    },

    credentialSubject: {
      id: studentDID,
      credentialType,
      institution,
      institutionId,
      degree,
      issueDate,
    },

    credentialVersion:
      version,

    proof: {
      type:
        "EcdsaSecp256k1Signature",

      credentialHash,

      signature,
    },
  };

  const cid =
    await uploadToPinata(
      verifiableCredential
    );

  const ipfsUri =
    `ipfs://${cid}`;

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  const tx =
    await contract.issueCredential(
      studentDID,
      credentialType,
      institution,
      institutionId,
      degree,
      issueDate,
      credentialHash,
      signature,
      ipfsUri
    );

  const receipt =
    await tx.wait();

  const credentialId =
    extractCredentialId(
      contract,
      receipt
    );

  return {
    credentialId,

    transactionHash:
      receipt.hash,

    credentialHash,

    signature,

    ipfsUri,

    cid,

    institution,

    institutionId,

    version,

    verifiableCredential,
  };
}

// =========================================================
// UPDATE CREDENTIAL
// =========================================================

export async function updateCredential(
  credentialId: number,
  newStudentDID: string,
  newCredentialType: string,
  newInstitution: string,
  newInstitutionId: string,
  newDegree: string,
  newIssueDate: string
): Promise<UpdateCredentialResult> {
  const provider =
    await getProvider();

  const signer =
    await provider.getSigner();

  const issuerAddress =
    await signer.getAddress();

  const currentCredential =
    await getCredential(
      credentialId
    );

  if (!currentCredential.active) {
    throw new Error(
      "Only an active credential can be updated."
    );
  }

  if (
    currentCredential.issuer.toLowerCase() !==
    issuerAddress.toLowerCase()
  ) {
    throw new Error(
      "Only the original issuing university can update this credential."
    );
  }

  const authorized =
    await isAuthorizedIssuer(
      issuerAddress
    );

  if (!authorized) {
    throw new Error(
      "Connected wallet is not an authorized university issuer."
    );
  }

  const newVersion =
    currentCredential.version + 1;

  const newCredentialHash =
    createCredentialHash(
      newStudentDID,
      newCredentialType,
      newInstitution,
      newInstitutionId,
      newDegree,
      newIssueDate,
      newVersion
    );

  const newSignature =
    await signer.signMessage(
      getBytes(
        newCredentialHash
      )
    );

  const verifiableCredential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
    ],

    type: [
      "VerifiableCredential",
      "EducationalCredential",
    ],

    issuer: {
      id:
        `did:eduproof:${issuerAddress.toLowerCase()}`,
      name: newInstitution,
    },

    credentialSubject: {
      id: newStudentDID,
      credentialType:
        newCredentialType,
      institution:
        newInstitution,
      institutionId:
        newInstitutionId,
      degree:
        newDegree,
      issueDate:
        newIssueDate,
    },

    credentialVersion:
      newVersion,

    proof: {
      type:
        "EcdsaSecp256k1Signature",

      credentialHash:
        newCredentialHash,

      signature:
        newSignature,
    },

    previousCredential: {
      id: credentialId,
      version:
        currentCredential.version,
    },
  };

  const cid =
    await uploadToPinata(
      verifiableCredential
    );

  const ipfsUri =
    `ipfs://${cid}`;

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  const tx =
    await contract.updateCredential(
      credentialId,
      newStudentDID,
      newCredentialType,
      newInstitution,
      newInstitutionId,
      newDegree,
      newIssueDate,
      newCredentialHash,
      newSignature,
      ipfsUri
    );

  const receipt =
    await tx.wait();

  const newCredentialId =
    extractCredentialId(
      contract,
      receipt
    );

  return {
    previousCredentialId:
      credentialId,

    credentialId:
      newCredentialId,

    version:
      newVersion,

    transactionHash:
      receipt.hash,

    credentialHash:
      newCredentialHash,

    signature:
      newSignature,

    ipfsUri,

    cid,

    institution:
      newInstitution,

    institutionId:
      newInstitutionId,

    verifiableCredential,
  };
}

// =========================================================
// REVOKE CREDENTIAL
// =========================================================

export async function revokeCredential(
  credentialId: number
): Promise<string> {
  const contract =
    await getSignerContract();

  const tx =
    await contract.revokeCredential(
      credentialId
    );

  const receipt =
    await tx.wait();

  return receipt.hash;
}