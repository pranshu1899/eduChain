import { BrowserProvider, Contract } from "ethers";
import EduProofArtifact from "../abi/EduProof.json";
import {
  EDUProof_CONTRACT_ADDRESS,
  SEPOLIA_CHAIN_ID,
} from "./contract";

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const network = await provider.getNetwork();

  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    throw new Error("Please switch MetaMask to Ethereum Sepolia.");
  }

  const signer = await provider.getSigner();

  const contract = new Contract(
    EDUProof_CONTRACT_ADDRESS,
    EduProofArtifact.abi,
    signer
  );

  return {
    provider,
    signer,
    contract,
    address: await signer.getAddress(),
  };
}