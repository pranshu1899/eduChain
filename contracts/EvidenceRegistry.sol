// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

/**
 * @title EvidenceRegistry
 * @notice Stores cryptographic commitments for EduProof evidence.
 *
 * The actual evidence remains off-chain.
 * Only its cryptographic hash and ownership information
 * are anchored on Ethereum.
 */
contract EvidenceRegistry {

    // =========================================================
    // EVIDENCE STATUS
    // =========================================================

    enum EvidenceStatus {
        NONE,
        ANCHORED,
        REVOKED
    }

    // =========================================================
    // EVIDENCE
    // =========================================================

    struct EvidenceRecord {

        bytes32 evidenceHash;

        address owner;

        uint256 anchoredAt;

        EvidenceStatus status;
    }

    /**
     * evidenceHash => evidence record
     *
     * The hash itself becomes the unique identifier
     * for the evidence commitment.
     */
    mapping(bytes32 => EvidenceRecord)
        private evidenceRecords;

    // =========================================================
    // ANALYTICS
    // =========================================================

    uint256 public totalEvidenceAnchored;

    uint256 public totalEvidenceRevoked;

    // =========================================================
    // EVENTS
    // =========================================================

    event EvidenceAnchored(
        bytes32 indexed evidenceHash,
        address indexed owner,
        uint256 timestamp
    );

    event EvidenceRevoked(
        bytes32 indexed evidenceHash,
        address indexed owner,
        uint256 timestamp
    );

    // =========================================================
    // ANCHOR EVIDENCE
    // =========================================================

    /**
     * @notice Permanently anchor an evidence commitment.
     *
     * The transaction sender becomes the on-chain owner
     * of the evidence commitment.
     *
     * No actual evidence data is stored on-chain.
     */
    function anchorEvidence(
        bytes32 evidenceHash
    )
        external
        returns (bool)
    {
        require(
            evidenceHash != bytes32(0),
            "Invalid evidence hash"
        );

        EvidenceRecord storage existing =
            evidenceRecords[evidenceHash];

        require(
            existing.status == EvidenceStatus.NONE,
            "Evidence already exists"
        );

        evidenceRecords[evidenceHash] =
            EvidenceRecord({
                evidenceHash: evidenceHash,
                owner: msg.sender,
                anchoredAt: block.timestamp,
                status: EvidenceStatus.ANCHORED
            });

        totalEvidenceAnchored++;

        emit EvidenceAnchored(
            evidenceHash,
            msg.sender,
            block.timestamp
        );

        return true;
    }

    // =========================================================
    // VERIFY EVIDENCE
    // =========================================================

    /**
     * @notice Verify an evidence hash against its
     * on-chain commitment.
     */
    function verifyEvidence(
        bytes32 evidenceHash
    )
        external
        view
        returns (
            bool exists,
            address owner,
            uint256 anchoredAt,
            EvidenceStatus status
        )
    {
        EvidenceRecord memory record =
            evidenceRecords[evidenceHash];

        exists =
            record.status != EvidenceStatus.NONE;

        owner =
            record.owner;

        anchoredAt =
            record.anchoredAt;

        status =
            record.status;
    }

    // =========================================================
    // GET EVIDENCE
    // =========================================================

    /**
     * @notice Return the complete evidence record.
     */
    function getEvidence(
        bytes32 evidenceHash
    )
        external
        view
        returns (
            bytes32 hash,
            address owner,
            uint256 anchoredAt,
            EvidenceStatus status
        )
    {
        EvidenceRecord memory record =
            evidenceRecords[evidenceHash];

        require(
            record.status != EvidenceStatus.NONE,
            "Evidence does not exist"
        );

        return (
            record.evidenceHash,
            record.owner,
            record.anchoredAt,
            record.status
        );
    }

    // =========================================================
    // REVOKE EVIDENCE
    // =========================================================

    /**
     * @notice Revoke an evidence commitment.
     *
     * Only the wallet that originally anchored the evidence
     * can revoke it.
     */
    function revokeEvidence(
        bytes32 evidenceHash
    )
        external
    {
        EvidenceRecord storage record =
            evidenceRecords[evidenceHash];

        require(
            record.status == EvidenceStatus.ANCHORED,
            "Evidence not active"
        );

        require(
            record.owner == msg.sender,
            "Only evidence owner can revoke"
        );

        record.status =
            EvidenceStatus.REVOKED;

        totalEvidenceRevoked++;

        emit EvidenceRevoked(
            evidenceHash,
            msg.sender,
            block.timestamp
        );
    }

    // =========================================================
    // OWNER CHECK
    // =========================================================

    /**
     * @notice Check whether an evidence hash was anchored
     * by a particular wallet.
     */
    function isEvidenceOwner(
        bytes32 evidenceHash,
        address expectedOwner
    )
        external
        view
        returns (bool)
    {
        EvidenceRecord memory record =
            evidenceRecords[evidenceHash];

        return
            record.status == EvidenceStatus.ANCHORED &&
            record.owner == expectedOwner;
    }

    // =========================================================
    // ACTIVE CHECK
    // =========================================================

    /**
     * @notice Returns true only for an active anchor.
     */
    function isEvidenceActive(
        bytes32 evidenceHash
    )
        external
        view
        returns (bool)
    {
        return
            evidenceRecords[evidenceHash].status ==
            EvidenceStatus.ANCHORED;
    }
}