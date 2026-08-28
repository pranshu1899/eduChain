import { ethers } from "ethers";

/* =====================================================
   HACKATHON ORGANIZATION REGISTRY
   ===================================================== */

export const HACKATHON_REGISTRY_ADDRESS =
  "0x3D0a9e7DE01FC4734C4E342998Eea7D007e15AC3";

/* =====================================================
   SEPOLIA
   ===================================================== */

export const SEPOLIA_CHAIN_ID = 11155111n;

const SEPOLIA_RPC_URL =
  "https://ethereum-sepolia-rpc.publicnode.com";

/* =====================================================
   CONTRACT ABI
   ===================================================== */

const HACKATHON_REGISTRY_ABI = [
  "function isOrganizationApproved(address organizationWallet) view returns (bool)",

  "function getOrganization(address organizationWallet) view returns (address wallet, string organizationName, uint8 status, uint256 submittedAt, uint256 approvedAt, uint256 updatedAt)",

  "function isAdmin(address account) view returns (bool)",

  "function requestOrganization(string organizationName)",

  "function approveOrganization(address organizationWallet)",

  "function rejectOrganization(address organizationWallet)",

  "function revokeOrganization(address organizationWallet)",
];

/* =====================================================
   TYPES
   ===================================================== */

export interface HackathonOrganizationOnChain {
  wallet: string;
  organizationName: string;
  status: number;
  submittedAt: number;
  approvedAt: number;
  updatedAt: number;
}

/* =====================================================
   PROVIDER HELPERS
   ===================================================== */

/*
 * Do NOT declare window.ethereum here.
 *
 * It is already declared by:
 *
 * src/vite-env.d.ts
 *
 * Declaring it again causes TS2717.
 */

/**
 * Get the MetaMask browser provider.
 */
async function getBrowserProvider(): Promise<ethers.BrowserProvider> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install MetaMask to continue.",
    );
  }

  return new ethers.BrowserProvider(
    window.ethereum,
  );
}

/**
 * Get a signer from MetaMask.
 */
async function getSigner(): Promise<ethers.Signer> {
  const provider =
    await getBrowserProvider();

  return provider.getSigner();
}

/**
 * Read-only Sepolia provider.
 *
 * Used for authorization checks so the application
 * can verify the blockchain state without opening
 * a MetaMask popup.
 */
function getReadOnlyProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(
    SEPOLIA_RPC_URL,
  );
}

/* =====================================================
   CONTRACT HELPERS
   ===================================================== */

/**
 * Contract connected to a provider.
 */
function getReadContract(
  provider: ethers.Provider,
): ethers.Contract {
  return new ethers.Contract(
    HACKATHON_REGISTRY_ADDRESS,
    HACKATHON_REGISTRY_ABI,
    provider,
  );
}

/**
 * Contract connected to a signer.
 *
 * Used for blockchain transactions.
 */
function getWriteContract(
  signer: ethers.Signer,
): ethers.Contract {
  return new ethers.Contract(
    HACKATHON_REGISTRY_ADDRESS,
    HACKATHON_REGISTRY_ABI,
    signer,
  );
}

/* =====================================================
   REGISTRY ADDRESS
   ===================================================== */

export function getHackathonRegistryAddress(): string {
  return HACKATHON_REGISTRY_ADDRESS;
}

/* =====================================================
   CONNECTED WALLET
   ===================================================== */

/**
 * Read currently connected MetaMask account.
 *
 * Does NOT open the MetaMask popup.
 */
export async function getConnectedHackathonWallet(): Promise<
  string | null
> {
  if (!window.ethereum) {
    return null;
  }

  try {
    const accounts =
      await window.ethereum.request({
        method: "eth_accounts",
      });

    if (
      !Array.isArray(accounts) ||
      accounts.length === 0
    ) {
      return null;
    }

    const wallet =
      accounts[0];

    if (
      typeof wallet !== "string" ||
      !ethers.isAddress(wallet)
    ) {
      return null;
    }

    return wallet;
  } catch (error) {
    console.error(
      "Unable to read connected wallet:",
      error,
    );

    return null;
  }
}

/* =====================================================
   CONNECT WALLET
   ===================================================== */

/**
 * Open MetaMask and return the selected wallet.
 */
export async function connectHackathonWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install MetaMask to continue.",
    );
  }

  await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const provider =
    await getBrowserProvider();

  const signer =
    await provider.getSigner();

  return signer.getAddress();
}

/* =====================================================
   NETWORK
   ===================================================== */

/**
 * Check whether MetaMask is currently connected
 * to Ethereum Sepolia.
 */
export async function isOnSepolia(): Promise<boolean> {
  if (!window.ethereum) {
    return false;
  }

  try {
    const chainId =
      await window.ethereum.request({
        method: "eth_chainId",
      });

    if (
      typeof chainId !== "string"
    ) {
      return false;
    }

    return (
      BigInt(chainId) ===
      SEPOLIA_CHAIN_ID
    );
  } catch (error) {
    console.error(
      "Unable to determine current network:",
      error,
    );

    return false;
  }
}

/**
 * Ensure MetaMask is on Sepolia before
 * performing a write transaction.
 */
async function ensureSepolia(): Promise<void> {
  const onSepolia =
    await isOnSepolia();

  if (!onSepolia) {
    throw new Error(
      "Please switch MetaMask to Ethereum Sepolia.",
    );
  }
}

/* =====================================================
   APPROVAL CHECK
   ===================================================== */

/**
 * AUTHORITATIVE ACCESS CHECK.
 *
 * This reads the deployed smart contract.
 *
 * localStorage is NOT used.
 */
export async function isHackathonOrganizationApproved(
  walletAddress: string,
): Promise<boolean> {
  if (
    !walletAddress ||
    !ethers.isAddress(walletAddress)
  ) {
    return false;
  }

  try {
    const provider =
      getReadOnlyProvider();

    const contract =
      getReadContract(
        provider,
      );

    const approved =
      await contract.isOrganizationApproved(
        walletAddress,
      );

    return Boolean(
      approved,
    );
  } catch (error) {
    console.error(
      "Unable to check hackathon organization authorization:",
      error,
    );

    return false;
  }
}

/* =====================================================
   GET ORGANIZATION
   ===================================================== */

/**
 * Read organization information directly
 * from the deployed registry.
 */
export async function getHackathonOrganizationOnChain(
  walletAddress: string,
): Promise<HackathonOrganizationOnChain | null> {
  if (
    !walletAddress ||
    !ethers.isAddress(walletAddress)
  ) {
    return null;
  }

  try {
    const provider =
      getReadOnlyProvider();

    const contract =
      getReadContract(
        provider,
      );

    const result =
      await contract.getOrganization(
        walletAddress,
      );

    return {
      wallet:
        String(result[0]),

      organizationName:
        String(result[1]),

      status:
        Number(result[2]),

      submittedAt:
        Number(result[3]),

      approvedAt:
        Number(result[4]),

      updatedAt:
        Number(result[5]),
    };
  } catch (error) {
    console.error(
      "Unable to fetch hackathon organization:",
      error,
    );

    return null;
  }
}

/* =====================================================
   REQUEST ORGANIZATION
   ===================================================== */

/**
 * Submit a new Hackathon Organization
 * application on-chain.
 */
export async function requestHackathonOrganization(
  organizationName: string,
): Promise<ethers.TransactionReceipt | null> {
  const normalizedName =
    organizationName.trim();

  if (!normalizedName) {
    throw new Error(
      "Organization name is required.",
    );
  }

  await ensureSepolia();

  const signer =
    await getSigner();

  const contract =
    getWriteContract(
      signer,
    );

  const transaction =
    await contract.requestOrganization(
      normalizedName,
    );

  return transaction.wait();
}

/* =====================================================
   ADMIN CHECK
   ===================================================== */

/**
 * Check whether a wallet is the admin
 * of the deployed registry.
 */
export async function isHackathonAdmin(
  walletAddress: string,
): Promise<boolean> {
  if (
    !walletAddress ||
    !ethers.isAddress(walletAddress)
  ) {
    return false;
  }

  try {
    const provider =
      getReadOnlyProvider();

    const contract =
      getReadContract(
        provider,
      );

    const admin =
      await contract.isAdmin(
        walletAddress,
      );

    return Boolean(
      admin,
    );
  } catch (error) {
    console.error(
      "Unable to check hackathon admin status:",
      error,
    );

    return false;
  }
}

/* =====================================================
   APPROVE ORGANIZATION
   ===================================================== */

/**
 * Admin-only blockchain transaction.
 */
export async function approveHackathonOrganization(
  organizationWallet: string,
): Promise<ethers.TransactionReceipt | null> {
  if (
    !ethers.isAddress(
      organizationWallet,
    )
  ) {
    throw new Error(
      "Invalid organization wallet address.",
    );
  }

  await ensureSepolia();

  const signer =
    await getSigner();

  const contract =
    getWriteContract(
      signer,
    );

  const transaction =
    await contract.approveOrganization(
      organizationWallet,
    );

  return transaction.wait();
}

/* =====================================================
   REJECT ORGANIZATION
   ===================================================== */

/**
 * Admin-only blockchain transaction.
 */
export async function rejectHackathonOrganization(
  organizationWallet: string,
): Promise<ethers.TransactionReceipt | null> {
  if (
    !ethers.isAddress(
      organizationWallet,
    )
  ) {
    throw new Error(
      "Invalid organization wallet address.",
    );
  }

  await ensureSepolia();

  const signer =
    await getSigner();

  const contract =
    getWriteContract(
      signer,
    );

  const transaction =
    await contract.rejectOrganization(
      organizationWallet,
    );

  return transaction.wait();
}

/* =====================================================
   REVOKE ORGANIZATION
   ===================================================== */

/**
 * Admin-only blockchain transaction.
 */
export async function revokeHackathonOrganization(
  organizationWallet: string,
): Promise<ethers.TransactionReceipt | null> {
  if (
    !ethers.isAddress(
      organizationWallet,
    )
  ) {
    throw new Error(
      "Invalid organization wallet address.",
    );
  }

  await ensureSepolia();

  const signer =
    await getSigner();

  const contract =
    getWriteContract(
      signer,
    );

  const transaction =
    await contract.revokeOrganization(
      organizationWallet,
    );

  return transaction.wait();
}