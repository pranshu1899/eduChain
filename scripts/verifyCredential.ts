import { network } from "hardhat";
import axios from "axios";

import { createCredentialHash } from "./credentialUtils.js";
import { uploadMetadataToIPFS } from "./ipfs.js";
import { createStudentDID } from "./didUtils.js";
import {
  createVerifiableCredential
} from "./verifiableCredential.js";

async function main() {
  const { ethers } = await network.connect();

  // =========================================================
  // SIGNERS
  // =========================================================

  const [
    authority,
    university,
    student
  ] = await ethers.getSigners();

  // =========================================================
  // DEPLOY
  // =========================================================

  const EduProof =
    await ethers.getContractFactory(
      "EduProof"
    );

  const eduProof =
    await EduProof.deploy();

  await eduProof.waitForDeployment();

  const contractAddress =
    await eduProof.getAddress();

  console.log(
    "EduProof deployed at:",
    contractAddress
  );

  // =========================================================
  // CREATE DIDs
  // =========================================================

  const studentDID =
    createStudentDID(
      student.address
    );

  const universityDID =
    createStudentDID(
      university.address
    );

  console.log(
    "Student DID:",
    studentDID
  );

  console.log(
    "University DID:",
    universityDID
  );

  // =========================================================
  // REGISTER UNIVERSITY
  // =========================================================

  await (
    await eduProof
      .connect(authority)
      .registerIssuer(
        university.address,
        "ABC University",
        "ABC-001"
      )
  ).wait();

  console.log(
    "University registered."
  );

  // =========================================================
  // AUTHORIZE UNIVERSITY
  // =========================================================

  await (
    await eduProof
      .connect(authority)
      .authorizeIssuer(
        university.address
      )
  ).wait();

  console.log(
    "University authorized."
  );

  // =========================================================
  // CREDENTIAL METADATA
  // =========================================================

  const metadata = {
    studentDID,

    credentialType:
      "B.Tech",

    institution:
      "ABC University",

    institutionId:
      "ABC-001",

    degree:
      "Bachelor of Technology",

    issueDate:
      "2026-08-21",

    version: 1
  };

  // =========================================================
  // CREATE HASH
  // =========================================================

  const credentialHash =
    createCredentialHash(
      metadata
    );

  console.log(
    "Credential hash:",
    credentialHash
  );

  // =========================================================
  // UNIVERSITY SIGNS HASH
  // =========================================================

  const signature =
    await university.signMessage(
      ethers.getBytes(
        credentialHash
      )
    );

  console.log(
    "Signature:",
    signature
  );

  // =========================================================
  // CREATE VERIFIABLE CREDENTIAL
  // =========================================================

  const verifiableCredential =
    createVerifiableCredential(
      studentDID,
      universityDID,
      "ABC University",
      metadata.credentialType,
      metadata.institutionId,
      metadata.degree,
      metadata.issueDate,
      metadata.version,
      credentialHash,
      signature
    );

  // =========================================================
  // UPLOAD VC TO IPFS
  // =========================================================

  const cid =
    await uploadMetadataToIPFS(
      verifiableCredential
    );

  const ipfsUri =
    `ipfs://${cid}`;

  console.log(
    "IPFS CID:",
    cid
  );

  console.log(
    "IPFS URI:",
    ipfsUri
  );

  // =========================================================
  // ISSUE CREDENTIAL
  // =========================================================

  const issueTx =
    await eduProof
      .connect(university)
      .issueCredential(
        metadata.studentDID,
        metadata.credentialType,
        metadata.institution,
        metadata.institutionId,
        metadata.degree,
        metadata.issueDate,
        credentialHash,
        signature,
        ipfsUri
      );

  await issueTx.wait();

  console.log(
    "Credential issued."
  );

  // =========================================================
  // READ CREDENTIAL
  // =========================================================

  const credentialId = 1;

  const credential =
    await eduProof.getCredential(
      credentialId
    );

  const blockchainHash =
    credential[9];

  const blockchainSignature =
    credential[10];

  const blockchainCID =
    credential[11];

  const issuer =
    credential[2];

  const blockchainDID =
    credential[3];

  const status =
    Number(credential[13]);

  console.log(
    "\nBlockchain CID:",
    blockchainCID
  );

  console.log(
    "Blockchain hash:",
    blockchainHash
  );

  // =========================================================
  // FETCH VC FROM IPFS
  // =========================================================

  const cidValue =
    blockchainCID.replace(
      "ipfs://",
      ""
    );

  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cidValue}`,
    `https://ipfs.io/ipfs/${cidValue}`
  ];

  let ipfsVC: any = null;

  console.log(
    "\nFetching Verifiable Credential..."
  );

  for (
    const gateway of gateways
  ) {
    try {
      console.log(
        "Trying:",
        gateway
      );

      const response =
        await axios.get(
          gateway,
          {
            timeout: 15000
          }
        );

      ipfsVC =
        response.data;

      break;
    } catch {
      console.log(
        "Gateway failed. Trying next..."
      );
    }
  }

  if (!ipfsVC) {
    throw new Error(
      "Could not retrieve Verifiable Credential from IPFS."
    );
  }

  console.log(
    "\nIPFS Verifiable Credential:"
  );

  console.log(
    JSON.stringify(
      ipfsVC,
      null,
      2
    )
  );

  // =========================================================
  // EXTRACT VC DATA
  // =========================================================

  const subject =
    ipfsVC.credentialSubject;

  const proof =
    ipfsVC.proof;

  if (
    !subject ||
    !proof
  ) {
    throw new Error(
      "Invalid Verifiable Credential structure."
    );
  }

  // =========================================================
  // RECREATE HASH FROM IPFS VC
  // =========================================================

  const recalculatedHash =
    createCredentialHash({
      studentDID:
        subject.id,

      credentialType:
        subject.credentialType,

      institution:
        subject.institution,

      institutionId:
        subject.institutionId,

      degree:
        subject.degree,

      issueDate:
        subject.issueDate,

      version:
        Number(
          ipfsVC.credentialVersion
        )
    });

  console.log(
    "\nRecalculated hash:",
    recalculatedHash
  );

  // =========================================================
  // HASH CHECKS
  // =========================================================

  const hashMatchesBlockchain =
    recalculatedHash ===
    blockchainHash;

  const hashMatchesProof =
    recalculatedHash ===
    proof.credentialHash;

  console.log(
    "Hash matches blockchain:",
    hashMatchesBlockchain
  );

  console.log(
    "Hash matches VC proof:",
    hashMatchesProof
  );

  // =========================================================
  // SIGNATURE CHECK
  // =========================================================

  const signatureMatchesBlockchain =
    proof.signature ===
    blockchainSignature;

  console.log(
    "Signature matches blockchain:",
    signatureMatchesBlockchain
  );

  // =========================================================
  // ISSUER CHECK
  // =========================================================

  const issuerAuthorized =
    await eduProof
      .isAuthorizedIssuer(
        issuer
      );

  console.log(
    "Issuer authorized:",
    issuerAuthorized
  );

  // =========================================================
  // STATUS CHECK
  // =========================================================

  const statusValid =
    status === 1;

  console.log(
    "Credential active:",
    statusValid
  );

  // =========================================================
  // ECDSA CHECK
  // =========================================================

  const signatureValid =
    await eduProof
      .verifyCredentialSignature(
        credentialId
      );

  console.log(
    "ECDSA signature valid:",
    signatureValid
  );

  // =========================================================
  // DID CHECK
  // =========================================================

  const didMatchesBlockchain =
    subject.id ===
    blockchainDID;

  console.log(
    "Student DID matches blockchain:",
    didMatchesBlockchain
  );

  // =========================================================
  // FINAL VERIFICATION
  // =========================================================

  const verified =
    hashMatchesBlockchain &&
    hashMatchesProof &&
    signatureMatchesBlockchain &&
    issuerAuthorized &&
    statusValid &&
    signatureValid &&
    didMatchesBlockchain;

  console.log(
    "\n================================"
  );

  console.log(
    verified
      ? "✅ CREDENTIAL VERIFIED"
      : "❌ CREDENTIAL INVALID"
  );

  console.log(
    "================================"
  );
}

main().catch((error) => {
  console.error(
    "\nVerification failed:"
  );

  console.error(
    error.response?.data ||
    error.message ||
    error
  );

  process.exitCode = 1;
});