// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AchievementRegistry
 * @notice Stores immutable cryptographic commitments for EduProof
 *         Proofs of Achievement.
 *
 * The actual achievement and evidence data remain off-chain.
 * Only the cryptographic Merkle root and ownership information
 * are anchored on Ethereum Sepolia.
 */
contract AchievementRegistry {
    // =========================================================
    // ACHIEVEMENT STATUS
    // =========================================================

    enum AchievementStatus {
        NONE,
        ANCHORED,
        REVOKED
    }

    // =========================================================
    // ACHIEVEMENT RECORD
    // =========================================================

    struct AchievementRecord {
        bytes32 achievementId;
        bytes32 merkleRoot;
        address owner;
        uint256 anchoredAt;
        AchievementStatus status;
    }

    /**
     * achievementId => achievement record
     *
     * The achievement ID is the unique identifier.
     */
    mapping(bytes32 => AchievementRecord)
        private achievementRecords;

    // =========================================================
    // ANALYTICS
    // =========================================================

    uint256 public totalAchievementsAnchored;
    uint256 public totalAchievementsRevoked;

    // =========================================================
    // EVENTS
    // =========================================================

    event AchievementAnchored(
        bytes32 indexed achievementId,
        bytes32 indexed merkleRoot,
        address indexed owner,
        uint256 timestamp
    );

    event AchievementRevoked(
        bytes32 indexed achievementId,
        address indexed owner,
        uint256 timestamp
    );

    // =========================================================
    // ANCHOR ACHIEVEMENT
    // =========================================================

    /**
     * @notice Permanently anchor an achievement commitment.
     *
     * @param achievementId Unique cryptographic ID of the achievement.
     * @param merkleRoot Merkle root representing the achievement's
     *                   evidence set.
     *
     * The transaction sender becomes the on-chain owner.
     *
     * No actual evidence or personal information is stored on-chain.
     */
    function anchorAchievement(
        bytes32 achievementId,
        bytes32 merkleRoot
    )
        external
        returns (bool)
    {
        require(
            achievementId != bytes32(0),
            "Invalid achievement ID"
        );

        require(
            merkleRoot != bytes32(0),
            "Invalid Merkle root"
        );

        AchievementRecord storage existing =
            achievementRecords[achievementId];

        require(
            existing.status == AchievementStatus.NONE,
            "Achievement already exists"
        );

        achievementRecords[achievementId] =
            AchievementRecord({
                achievementId: achievementId,
                merkleRoot: merkleRoot,
                owner: msg.sender,
                anchoredAt: block.timestamp,
                status: AchievementStatus.ANCHORED
            });

        totalAchievementsAnchored++;

        emit AchievementAnchored(
            achievementId,
            merkleRoot,
            msg.sender,
            block.timestamp
        );

        return true;
    }

    // =========================================================
    // VERIFY ACHIEVEMENT
    // =========================================================

    /**
     * @notice Verify an achievement against its on-chain record.
     */
    function verifyAchievement(
        bytes32 achievementId
    )
        external
        view
        returns (
            bool exists,
            bytes32 merkleRoot,
            address owner,
            uint256 anchoredAt,
            AchievementStatus status
        )
    {
        AchievementRecord memory record =
            achievementRecords[achievementId];

        exists =
            record.status != AchievementStatus.NONE;

        merkleRoot =
            record.merkleRoot;

        owner =
            record.owner;

        anchoredAt =
            record.anchoredAt;

        status =
            record.status;
    }

    // =========================================================
    // GET ACHIEVEMENT
    // =========================================================

    /**
     * @notice Return the complete achievement record.
     */
    function getAchievement(
        bytes32 achievementId
    )
        external
        view
        returns (
            bytes32 id,
            bytes32 merkleRoot,
            address owner,
            uint256 anchoredAt,
            AchievementStatus status
        )
    {
        AchievementRecord memory record =
            achievementRecords[achievementId];

        require(
            record.status != AchievementStatus.NONE,
            "Achievement does not exist"
        );

        return (
            record.achievementId,
            record.merkleRoot,
            record.owner,
            record.anchoredAt,
            record.status
        );
    }

    // =========================================================
    // VERIFY MERKLE ROOT
    // =========================================================

    /**
     * @notice Check whether a supplied Merkle root matches the
     *         achievement's anchored root.
     *
     * This allows the frontend/verifier to establish that the
     * evidence set being presented corresponds to the exact
     * achievement commitment stored on Ethereum.
     */
    function verifyMerkleRoot(
        bytes32 achievementId,
        bytes32 expectedMerkleRoot
    )
        external
        view
        returns (bool)
    {
        AchievementRecord memory record =
            achievementRecords[achievementId];

        return (
            record.status == AchievementStatus.ANCHORED &&
            record.merkleRoot == expectedMerkleRoot
        );
    }

    // =========================================================
    // OWNER CHECK
    // =========================================================

    /**
     * @notice Check whether an achievement belongs to
     *         a particular wallet.
     */
    function isAchievementOwner(
        bytes32 achievementId,
        address expectedOwner
    )
        external
        view
        returns (bool)
    {
        AchievementRecord memory record =
            achievementRecords[achievementId];

        return (
            record.status == AchievementStatus.ANCHORED &&
            record.owner == expectedOwner
        );
    }

    // =========================================================
    // ACTIVE CHECK
    // =========================================================

    /**
     * @notice Returns true only when an achievement is active.
     */
    function isAchievementActive(
        bytes32 achievementId
    )
        external
        view
        returns (bool)
    {
        return (
            achievementRecords[achievementId].status ==
            AchievementStatus.ANCHORED
        );
    }

    // =========================================================
    // REVOKE ACHIEVEMENT
    // =========================================================

    /**
     * @notice Revoke an anchored achievement.
     *
     * Only the wallet that originally anchored the achievement
     * can revoke it.
     *
     * The historical blockchain record remains intact.
     * Its status simply changes from ANCHORED to REVOKED.
     */
    function revokeAchievement(
        bytes32 achievementId
    )
        external
    {
        AchievementRecord storage record =
            achievementRecords[achievementId];

        require(
            record.status == AchievementStatus.ANCHORED,
            "Achievement not active"
        );

        require(
            record.owner == msg.sender,
            "Only achievement owner can revoke"
        );

        record.status =
            AchievementStatus.REVOKED;

        totalAchievementsRevoked++;

        emit AchievementRevoked(
            achievementId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // ROOT + OWNER VERIFICATION
    // =========================================================

    /**
     * @notice Verify both the Merkle root and owner.
     */
    function verifyAchievementProof(
        bytes32 achievementId,
        bytes32 expectedMerkleRoot,
        address expectedOwner
    )
        external
        view
        returns (bool)
    {
        AchievementRecord memory record =
            achievementRecords[achievementId];

        return (
            record.status == AchievementStatus.ANCHORED &&
            record.merkleRoot == expectedMerkleRoot &&
            record.owner == expectedOwner
        );
    }
}