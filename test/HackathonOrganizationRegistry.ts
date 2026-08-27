import { expect } from "chai";
import { network } from "hardhat";

describe("HackathonOrganizationRegistry", function () {
  async function deployRegistry() {
    const { ethers } =
      await network.connect();

    const [
      admin,
      organization,
      student,
      attacker,
    ] = await ethers.getSigners();

    const Registry =
      await ethers.getContractFactory(
        "HackathonOrganizationRegistry",
      );

    const registry =
      await Registry.deploy();

    await registry.waitForDeployment();

    return {
      ethers,
      registry,
      admin,
      organization,
      student,
      attacker,
    };
  }

  /* =====================================================
     DEPLOYMENT
     ===================================================== */

  it("sets the deployer as admin", async function () {
    const {
      registry,
      admin,
    } = await deployRegistry();

    expect(
      await registry.admin(),
    ).to.equal(
      admin.address,
    );
  });

  /* =====================================================
     ORGANIZATION REQUEST
     ===================================================== */

  it("allows an organization to submit an application", async function () {
    const {
      registry,
      organization,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Microsoft Hackathon",
      );

    const result =
      await registry.getOrganization(
        organization.address,
      );

    expect(result.wallet).to.equal(
      organization.address,
    );

    expect(
      result.organizationName,
    ).to.equal(
      "Microsoft Hackathon",
    );

    expect(result.status).to.equal(1);
  });

  /* =====================================================
     ADMIN APPROVAL
     ===================================================== */

  it("allows the admin to approve an organization", async function () {
    const {
      registry,
      organization,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Hackathon Org",
      );

    await registry
      .approveOrganization(
        organization.address,
      );

    expect(
      await registry.isOrganizationApproved(
        organization.address,
      ),
    ).to.equal(true);

    const result =
      await registry.getOrganization(
        organization.address,
      );

    expect(result.status).to.equal(2);
  });

  /* =====================================================
     ONLY ADMIN APPROVAL
     ===================================================== */

  it("prevents non-admin accounts from approving organizations", async function () {
    const {
      registry,
      organization,
      attacker,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Hackathon Org",
      );

    await expect(
      registry
        .connect(attacker)
        .approveOrganization(
          organization.address,
        ),
    ).to.be.revertedWith(
      "HackathonRegistry: not admin",
    );
  });

  /* =====================================================
     REJECTION
     ===================================================== */

  it("allows the admin to reject an application", async function () {
    const {
      registry,
      organization,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Rejected Hackathon",
      );

    await registry
      .rejectOrganization(
        organization.address,
      );

    const result =
      await registry.getOrganization(
        organization.address,
      );

    expect(result.status).to.equal(3);

    expect(
      await registry.isOrganizationApproved(
        organization.address,
      ),
    ).to.equal(false);
  });

  /* =====================================================
     REVOCATION
     ===================================================== */

  it("allows the admin to revoke an approved organization", async function () {
    const {
      registry,
      organization,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Revocable Hackathon",
      );

    await registry
      .approveOrganization(
        organization.address,
      );

    await registry
      .revokeOrganization(
        organization.address,
      );

    const result =
      await registry.getOrganization(
        organization.address,
      );

    expect(result.status).to.equal(4);

    expect(
      await registry.isOrganizationApproved(
        organization.address,
      ),
    ).to.equal(false);
  });

  /* =====================================================
     BATCH ANCHORING
     ===================================================== */

  it("allows an approved organization to anchor a certificate batch", async function () {
    const {
      registry,
      organization,
      ethers,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Batch Hackathon",
      );

    await registry
      .approveOrganization(
        organization.address,
      );

    const batchId =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "BATCH-001",
        ),
      );

    const merkleRoot =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "MERKLE-ROOT-001",
        ),
      );

    await registry
      .connect(organization)
      .anchorCertificateBatch(
        batchId,
        merkleRoot,
        100,
        "ipfs://batch-001",
      );

    const result =
      await registry.getCertificateBatch(
        batchId,
      );

    expect(result.id).to.equal(
      batchId,
    );

    expect(
      result.organization,
    ).to.equal(
      organization.address,
    );

    expect(
      result.merkleRoot,
    ).to.equal(
      merkleRoot,
    );

    expect(
      result.certificateCount,
    ).to.equal(100);

    expect(
      result.metadataURI,
    ).to.equal(
      "ipfs://batch-001",
    );

    expect(result.exists).to.equal(
      true,
    );
  });

  /* =====================================================
     UNAUTHORIZED BATCH
     ===================================================== */

  it("prevents an unapproved wallet from anchoring a batch", async function () {
    const {
      registry,
      organization,
      ethers,
    } = await deployRegistry();

    const batchId =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "UNAUTHORIZED-BATCH",
        ),
      );

    const merkleRoot =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "ROOT",
        ),
      );

    await expect(
      registry
        .connect(organization)
        .anchorCertificateBatch(
          batchId,
          merkleRoot,
          10,
          "",
        ),
    ).to.be.revertedWith(
      "HackathonRegistry: organization not approved",
    );
  });

  /* =====================================================
     DUPLICATE BATCH
     ===================================================== */

  it("prevents the same batch from being anchored twice", async function () {
    const {
      registry,
      organization,
      ethers,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Duplicate Test Org",
      );

    await registry
      .approveOrganization(
        organization.address,
      );

    const batchId =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "DUPLICATE-BATCH",
        ),
      );

    const merkleRoot =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "DUPLICATE-ROOT",
        ),
      );

    await registry
      .connect(organization)
      .anchorCertificateBatch(
        batchId,
        merkleRoot,
        5,
        "",
      );

    await expect(
      registry
        .connect(organization)
        .anchorCertificateBatch(
          batchId,
          merkleRoot,
          5,
          "",
        ),
    ).to.be.revertedWith(
      "HackathonRegistry: batch already exists",
    );
  });

  /* =====================================================
     BATCH VERIFICATION
     ===================================================== */

  it("verifies the Merkle root of an anchored batch", async function () {
    const {
      registry,
      organization,
      ethers,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Verification Test Org",
      );

    await registry
      .approveOrganization(
        organization.address,
      );

    const batchId =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "VERIFY-BATCH",
        ),
      );

    const merkleRoot =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "VERIFY-ROOT",
        ),
      );

    await registry
      .connect(organization)
      .anchorCertificateBatch(
        batchId,
        merkleRoot,
        25,
        "",
      );

    expect(
      await registry.verifyCertificateBatch(
        batchId,
        merkleRoot,
      ),
    ).to.equal(true);

    const incorrectRoot =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "WRONG-ROOT",
        ),
      );

    expect(
      await registry.verifyCertificateBatch(
        batchId,
        incorrectRoot,
      ),
    ).to.equal(false);
  });

  /* =====================================================
     REVOKED ORGANIZATION
     ===================================================== */

  it("prevents a revoked organization from anchoring new batches", async function () {
    const {
      registry,
      organization,
      ethers,
    } = await deployRegistry();

    await registry
      .connect(organization)
      .requestOrganization(
        "Revoked Org",
      );

    await registry
      .approveOrganization(
        organization.address,
      );

    await registry
      .revokeOrganization(
        organization.address,
      );

    const batchId =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "REVOKED-BATCH",
        ),
      );

    const merkleRoot =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "REVOKED-ROOT",
        ),
      );

    await expect(
      registry
        .connect(organization)
        .anchorCertificateBatch(
          batchId,
          merkleRoot,
          10,
          "",
        ),
    ).to.be.revertedWith(
      "HackathonRegistry: organization not approved",
    );
  });
});