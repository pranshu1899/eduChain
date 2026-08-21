import { expect } from "chai";
import { network } from "hardhat";

describe("EduProof - Issuer Registry", function () {

  async function deployEduProofFixture() {
    const { ethers } = await network.connect();

    const [authority, university, randomUser] =
      await ethers.getSigners();

    const EduProof =
      await ethers.getContractFactory("EduProof");

    const eduProof =
      await EduProof.deploy();

    return {
      eduProof,
      authority,
      university,
      randomUser,
    };
  }

  it("should set deployer as authority", async function () {
    const {
      eduProof,
      authority,
    } = await deployEduProofFixture();

    expect(
      await eduProof.authority()
    ).to.equal(authority.address);
  });

  it("authority can authorize a university", async function () {
    const {
      eduProof,
      authority,
      university,
    } = await deployEduProofFixture();

    await eduProof
      .connect(authority)
      .authorizeIssuer(university.address);

    expect(
      await eduProof.isAuthorizedIssuer(
        university.address
      )
    ).to.equal(true);
  });

  it("authority can revoke a university", async function () {
    const {
      eduProof,
      authority,
      university,
    } = await deployEduProofFixture();

    await eduProof
      .connect(authority)
      .authorizeIssuer(university.address);

    await eduProof
      .connect(authority)
      .revokeIssuer(university.address);

    expect(
      await eduProof.isAuthorizedIssuer(
        university.address
      )
    ).to.equal(false);
  });

  it("random user cannot authorize an issuer", async function () {
    const {
      eduProof,
      university,
      randomUser,
    } = await deployEduProofFixture();

    await expect(
      eduProof
        .connect(randomUser)
        .authorizeIssuer(university.address)
    ).to.be.revertedWith(
      "Not authorized authority"
    );
  });
});