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
// EVENT SCANNING CONFIGURATION
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
      Number(credential[13]) === 1,
    createdAt: Number(credential[14]),
    revokedAt: Number(credential[15]),
  };
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
// GET ISSUER
// =========================================================

export async function getIssuer(
  address: string
) {
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
// VERSION HISTORY - IDS
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

  const versionIds: bigint[] =
    Array.from(
      history as Iterable<bigint>
    );

  return versionIds.map(
    (id: bigint) => Number(id)
  );
}

// =========================================================
// VERSION HISTORY - FULL RECORDS
// =========================================================

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

    try {
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
    } catch (error) {
      console.error(
        `Failed to scan blocks ${fromBlock}-${toBlock}:`,
        error
      );

      throw new Error(
        `Unable to read EduProof events from Sepolia blocks ${fromBlock}-${toBlock}. ${
          error instanceof Error
            ? error.message
            : "Unknown RPC error."
        }`
      );
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
// FETCH IPFS VERIFIABLE CREDENTIAL
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

  const primaryUrl =
    buildIpfsGatewayUrl(cid);

  const fallbackUrls = [
    primaryUrl,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
  ];

  const uniqueUrls =
    Array.from(
      new Set(fallbackUrls)
    );

  let lastError: unknown =
    null;

  for (
    const url of uniqueUrls
  ) {
    try {
      console.log(
        "Fetching IPFS credential:",
        url
      );

      const response =
        await fetch(url, {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
        });

      if (!response.ok) {
        throw new Error(
          `IPFS request failed: ${response.status} ${response.statusText}`
        );
      }

      const contentType =
        response.headers.get(
          "content-type"
        );

      const text =
        await response.text();

      if (!text.trim()) {
        throw new Error(
          "IPFS gateway returned an empty response."
        );
      }

      let data: unknown;

      try {
        data =
          JSON.parse(text);
      } catch {
        throw new Error(
          `IPFS gateway returned non-JSON content${
            contentType
              ? ` (${contentType})`
              : ""
          }.`
        );
      }

      if (
        !data ||
        typeof data !== "object"
      ) {
        throw new Error(
          "Invalid verifiable credential data returned from IPFS."
        );
      }

      return data;
    } catch (error) {
      console.error(
        `IPFS gateway failed: ${url}`,
        error
      );

      lastError = error;
    }
  }

  throw new Error(
    `Unable to fetch credential from IPFS. ${
      lastError instanceof Error
        ? lastError.message
        : "Unknown error."
    }`
  );
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

  // -------------------------------------------------------
  // FETCH VC FROM IPFS
  // -------------------------------------------------------

  const verifiableCredential =
    await fetchVerifiableCredential(
      credential.ipfsUri
    );

  // -------------------------------------------------------
  // HASH
  // -------------------------------------------------------

  const vcHash =
    verifiableCredential
      ?.proof
      ?.credentialHash;

  const hashMatches =
    typeof vcHash === "string" &&
    vcHash.toLowerCase() ===
      credential.credentialHash.toLowerCase();

  // -------------------------------------------------------
  // SIGNATURE
  // -------------------------------------------------------

  const signatureValid =
    await contract.verifyCredentialSignature(
      credentialId
    );

  // -------------------------------------------------------
  // ISSUER
  // -------------------------------------------------------

  const issuerAuthorized =
    await isAuthorizedIssuer(
      credential.issuer
    );

  // -------------------------------------------------------
  // STATUS
  // -------------------------------------------------------

  const credentialActive =
    credential.active;

  // -------------------------------------------------------
  // STUDENT DID
  // -------------------------------------------------------

  const vcStudentDID =
    verifiableCredential
      ?.credentialSubject
      ?.id;

  const studentDIDMatches =
    typeof vcStudentDID === "string" &&
    vcStudentDID ===
      credential.studentDID;

  // -------------------------------------------------------
  // ISSUER DID
  // -------------------------------------------------------

  const vcIssuerDID =
    verifiableCredential
      ?.issuer
      ?.id;

  const issuerDIDPresent =
    typeof vcIssuerDID === "string" &&
    vcIssuerDID.length > 0;

  // -------------------------------------------------------
  // FINAL
  // -------------------------------------------------------

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
// UPLOAD VC TO PINATA
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

  return result.IpfsHash as string;
}

// =========================================================
// EXTRACT CREDENTIAL ID FROM RECEIPT
// =========================================================

function extractCredentialId(
  contract: Contract,
  receipt: any
): number | null {
  try {
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
  } catch {
    // Event parsing is optional.
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

  // -------------------------------------------------------
  // CHECK ISSUER
  // -------------------------------------------------------

  const authorized =
    await isAuthorizedIssuer(
      issuerAddress
    );

  if (!authorized) {
    throw new Error(
      "Connected wallet is not an authorized university issuer."
    );
  }

  // -------------------------------------------------------
  // GET UNIVERSITY DATA
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // VERSION
  // -------------------------------------------------------

  const version = 1;

  // -------------------------------------------------------
  // HASH
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // SIGN
  // -------------------------------------------------------

  const signature =
    await signer.signMessage(
      getBytes(
        credentialHash
      )
    );

  // -------------------------------------------------------
  // VERIFIABLE CREDENTIAL
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // IPFS
  // -------------------------------------------------------

  const cid =
    await uploadToPinata(
      verifiableCredential
    );

  const ipfsUri =
    `ipfs://${cid}`;

  // -------------------------------------------------------
  // CONTRACT
  // -------------------------------------------------------

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  // -------------------------------------------------------
  // ISSUE
  // -------------------------------------------------------

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
  if (
    !Number.isInteger(
      credentialId
    ) ||
    credentialId <= 0
  ) {
    throw new Error(
      "Invalid credential ID."
    );
  }

  if (!newStudentDID.trim()) {
    throw new Error(
      "Student DID is required."
    );
  }

  if (!newCredentialType.trim()) {
    throw new Error(
      "Credential type is required."
    );
  }

  if (!newInstitution.trim()) {
    throw new Error(
      "Institution is required."
    );
  }

  if (!newInstitutionId.trim()) {
    throw new Error(
      "Institution ID is required."
    );
  }

  if (!newDegree.trim()) {
    throw new Error(
      "Degree is required."
    );
  }

  if (!newIssueDate.trim()) {
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

  // -------------------------------------------------------
  // CURRENT CREDENTIAL
  // -------------------------------------------------------

  const currentCredential =
    await getCredential(
      credentialId
    );

  if (!currentCredential.active) {
    throw new Error(
      "Only an active credential can be updated."
    );
  }

  // -------------------------------------------------------
  // CHECK ISSUER
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // NEW VERSION
  // -------------------------------------------------------

  const newVersion =
    currentCredential.version + 1;

  // -------------------------------------------------------
  // HASH
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // SIGN
  // -------------------------------------------------------

  const newSignature =
    await signer.signMessage(
      getBytes(
        newCredentialHash
      )
    );

  // -------------------------------------------------------
  // VERIFIABLE CREDENTIAL
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // IPFS
  // -------------------------------------------------------

  const cid =
    await uploadToPinata(
      verifiableCredential
    );

  const ipfsUri =
    `ipfs://${cid}`;

  // -------------------------------------------------------
  // CONTRACT
  // -------------------------------------------------------

  const contract =
    new Contract(
      EDUProof_CONTRACT_ADDRESS,
      EduProofArtifact.abi,
      signer
    );

  // -------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------

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