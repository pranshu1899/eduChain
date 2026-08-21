import { network } from "hardhat";

import { createCredentialHash } from "./credentialUtils.js";
import { uploadMetadataToIPFS } from "./ipfs.js";
import { createStudentDID } from "./didUtils.js";
import {
  createVerifiableCredential,
} from "./verifiableCredential.js";

async function main() {
  const { ethers } = await network.connect();

  // =========================================================
  // EXISTING SEPOLIA CONTRACT
  // =========================================================

  const CONTRACT_ADDRESS =
    "0x75f4c5489E34CC1d1c67E3c302dDD76a86956e8a";

  // =========================================================
  // SIGNERS
  // =========================================================

  const [authority] = await ethers.getSigners();

  console.log("Authority:", authority.address);

  // =========================================================
  // UNIVERSITY
  // =========================================================
  //
  // For this Sepolia test, the deployer/authority wallet is also
  // acting as the university issuer.
  //
  // This avoids needing a second private key just for testing.
  // =========================================================

  const university = authority;
  const student = authority;

  const universityDID =
    createStudentDID(university.address);

  const studentDID =
    createStudentDID(student.address);

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
  // CONNECT TO EXISTING EDUPROOF CONTRACT
  // =========================================================

  const EduProof =
    await ethers.getContractFactory("EduProof");

  const eduProof =
    EduProof.attach(CONTRACT_ADDRESS);

  console.log(
    "\nEduProof connected at:",
    CONTRACT_ADDRESS
  );

  // =========================================================
  // CHECK / REGISTER UNIVERSITY
  // =========================================================

  const existingIssuer =
    await eduProof.getIssuer(university.address);

  console.log(
    "\nExisting issuer:",
    existingIssuer
  );

  // =========================================================
  // REGISTER UNIVERSITY IF NECESSARY
  // =========================================================

  try {
    const authorized =
      await eduProof.isAuthorizedIssuer(
        university.address
      );

    console.log(
      "Already authorized:",
      authorized
    );

    if (!authorized) {
      console.log(
        "University is not authorized. Registering..."
      );

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
    }
  } catch (error) {
    console.log(
      "\nIssuer setup check failed."
    );

    console.log(
      "This usually means the contract already has issuer data."
    );
  }

  // =========================================================
  // CHECK AUTHORIZATION
  // =========================================================

  const authorized =
    await eduProof.isAuthorizedIssuer(
      university.address
    );

  console.log(
    "\nIs university authorized:",
    authorized
  );

  if (!authorized) {
    throw new Error(
      "University is not authorized on this Sepolia contract."
    );
  }

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
  // UPLOAD VC TO IPFS
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
  // ISSUE CREDENTIAL ON EXISTING CONTRACT
  // =========================================================

  console.log(
    "\nIssuing credential on Sepolia..."
  );

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
    "\nCredential issued successfully."
  );

  console.log(
    "Transaction:",
    receipt?.hash
  );

  // =========================================================
  // READ CREDENTIAL
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

  console.log(
    "\n================================"
  );

  console.log(
    "SEP0LIA CREDENTIAL READY"
  );

  console.log(
    "================================"
  );
}

main().catch((error) => {
  console.error(
    "\nError:",
    error
  );

  process.exitCode = 1;
});