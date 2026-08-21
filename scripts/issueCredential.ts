import { network } from "hardhat";

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
  // CREATE STUDENT DID
  // =========================================================

  const studentDID =
    createStudentDID(
      student.address
    );

  // =========================================================
  // CREATE UNIVERSITY DID
  // =========================================================

  const universityDID =
    createStudentDID(
      university.address
    );

  console.log(
    "Authority:",
    authority.address
  );

  console.log(
    "University:",
    university.address
  );

  console.log(
    "University DID:",
    universityDID
  );

  console.log(
    "Student:",
    student.address
  );

  console.log(
    "Student DID:",
    studentDID
  );

  // =========================================================
  // DEPLOY EDUPROOF
  // =========================================================

  const EduProof =
    await ethers.getContractFactory(
      "EduProof"
    );

  const eduProof =
    await EduProof.deploy();

  await eduProof.waitForDeployment();

  console.log(
    "EduProof deployed at:",
    await eduProof.getAddress()
  );

  // =========================================================
  // REGISTER UNIVERSITY
  // =========================================================

  const registerTx =
    await eduProof
      .connect(authority)
      .registerIssuer(
        university.address,
        "ABC University",
        "ABC-001"
      );

  await registerTx.wait();

  console.log(
    "University registered."
  );

  // =========================================================
  // AUTHORIZE UNIVERSITY
  // =========================================================

  const authorizeTx =
    await eduProof
      .connect(authority)
      .authorizeIssuer(
        university.address
      );

  await authorizeTx.wait();

  console.log(
    "University authorized."
  );

  // =========================================================
  // CHECK AUTHORIZATION
  // =========================================================

  const authorized =
    await eduProof.isAuthorizedIssuer(
      university.address
    );

  console.log(
    "Is university authorized:",
    authorized
  );

  // =========================================================
  // MANUAL CREDENTIAL METADATA
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

    version: 1,
  };

  console.log(
    "\nCredential metadata:",
    metadata
  );

  // =========================================================
  // CREATE CREDENTIAL HASH
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
      metadata.studentDID,
      universityDID,
      metadata.institution,
      metadata.credentialType,
      metadata.institutionId,
      metadata.degree,
      metadata.issueDate,
      metadata.version,
      credentialHash,
      signature
    );

  console.log(
    "\nVerifiable Credential:"
  );

  console.log(
    JSON.stringify(
      verifiableCredential,
      null,
      2
    )
  );

  // =========================================================
  // UPLOAD VERIFIABLE CREDENTIAL TO IPFS
  // =========================================================

  const cid =
    await uploadMetadataToIPFS(
      verifiableCredential
    );

  const ipfsUri =
    `ipfs://${cid}`;

  console.log(
    "\nIPFS CID:",
    cid
  );

  console.log(
    "IPFS URI:",
    ipfsUri
  );

  // =========================================================
  // ISSUE CREDENTIAL ON BLOCKCHAIN
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

  const receipt =
    await issueTx.wait();

  console.log(
    "\nCredential issued."
  );

  console.log(
    "Transaction:",
    receipt?.hash
  );

  // =========================================================
  // READ CREDENTIAL FROM BLOCKCHAIN
  // =========================================================

  const credential =
    await eduProof.getCredential(1);

  console.log(
    "\nBlockchain Credential:"
  );

  console.log(
    credential
  );

  // =========================================================
  // VERIFY SIGNATURE
  // =========================================================

  const signatureValid =
    await eduProof
      .verifyCredentialSignature(1);

  console.log(
    "\nSignature valid:",
    signatureValid
  );

  // =========================================================
  // VERSION HISTORY
  // =========================================================

  const history =
    await eduProof.getVersionHistory(1);

  console.log(
    "Version history:",
    history
  );
}

main().catch((error) => {
  console.error(
    "\nError:",
    error
  );

  process.exitCode = 1;
});