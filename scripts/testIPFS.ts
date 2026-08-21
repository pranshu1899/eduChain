import { uploadMetadataToIPFS } from "./ipfs.js";

async function main() {
  const metadata = {
    studentDID: "did:eduproof:student123",
    credentialType: "B.Tech",
    institution: "ABC University",
    degree: "Bachelor of Technology",
    issueDate: "2026-08-21",
    version: 1,
  };

  const cid =
    await uploadMetadataToIPFS(metadata);

  console.log(
    "IPFS CID:",
    cid
  );

  console.log(
    "IPFS URI:",
    `ipfs://${cid}`
  );
}

main().catch((error) => {
  console.error(
    "IPFS upload failed:",
    error.response?.data || error.message
  );

  process.exitCode = 1;
});