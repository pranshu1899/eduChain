// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HackathonOrganizationRegistry
 * @notice
 * Registry for approved hackathon organizations and
 * batch certificate Merkle-root anchoring.
 *
 * IMPORTANT:
 * Personal student information, DID data and certificate
 * contents are NOT stored on-chain.
 *
 * Only cryptographic commitments and minimal registry
 * information are stored on-chain.
 */
contract HackathonOrganizationRegistry {
    /* =====================================================
       ADMIN
       ===================================================== */

    address public immutable admin;

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "HackathonRegistry: not admin"
        );
        _;
    }

    /* =====================================================
       ORGANIZATION STATUS
       ===================================================== */

    enum OrganizationStatus {
        NONE,
        PENDING,
        APPROVED,
        REJECTED,
        REVOKED
    }

    struct Organization {
        address wallet;
        string organizationName;
        OrganizationStatus status;
        uint256 submittedAt;
        uint256 approvedAt;
        uint256 updatedAt;
    }

    mapping(address => Organization)
        private organizations;

    /* =====================================================
       BATCH
       ===================================================== */

    struct CertificateBatch {
        bytes32 batchId;
        address organization;
        bytes32 merkleRoot;
        uint256 certificateCount;
        uint256 anchoredAt;
        string metadataURI;
        bool exists;
    }

    mapping(bytes32 => CertificateBatch)
        private certificateBatches;

    /* =====================================================
       EVENTS
       ===================================================== */

    event OrganizationRequested(
        address indexed organization,
        string organizationName,
        uint256 submittedAt
    );

    event OrganizationApproved(
        address indexed organization,
        string organizationName,
        uint256 approvedAt
    );

    event OrganizationRejected(
        address indexed organization,
        uint256 updatedAt
    );

    event OrganizationRevoked(
        address indexed organization,
        uint256 updatedAt
    );

    event CertificateBatchAnchored(
        bytes32 indexed batchId,
        address indexed organization,
        bytes32 indexed merkleRoot,
        uint256 certificateCount,
        uint256 anchoredAt
    );

    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor() {
        admin = msg.sender;
    }

    /* =====================================================
       ORGANIZATION APPLICATION
       ===================================================== */

    /**
     * @notice Request authorization as a hackathon
     * organization.
     *
     * The organization wallet becomes the identity
     * of the organization.
     */
    function requestOrganization(
        string calldata organizationName
    ) external {
        require(
            bytes(organizationName).length > 0,
            "HackathonRegistry: name required"
        );

        Organization storage organization =
            organizations[msg.sender];

        require(
            organization.status !=
                OrganizationStatus.APPROVED,
            "HackathonRegistry: already approved"
        );

        require(
            organization.status !=
                OrganizationStatus.PENDING,
            "HackathonRegistry: request already pending"
        );

        uint256 timestamp = block.timestamp;

        organization.wallet =
            msg.sender;

        organization.organizationName =
            organizationName;

        organization.status =
            OrganizationStatus.PENDING;

        organization.submittedAt =
            timestamp;

        organization.updatedAt =
            timestamp;

        emit OrganizationRequested(
            msg.sender,
            organizationName,
            timestamp
        );
    }

    /* =====================================================
       ADMIN APPROVAL
       ===================================================== */

    function approveOrganization(
        address organizationWallet
    ) external onlyAdmin {
        Organization storage organization =
            organizations[
                organizationWallet
            ];

        require(
            organization.status ==
                OrganizationStatus.PENDING,
            "HackathonRegistry: not pending"
        );

        uint256 timestamp =
            block.timestamp;

        organization.status =
            OrganizationStatus.APPROVED;

        organization.approvedAt =
            timestamp;

        organization.updatedAt =
            timestamp;

        emit OrganizationApproved(
            organizationWallet,
            organization.organizationName,
            timestamp
        );
    }

    /* =====================================================
       ADMIN REJECTION
       ===================================================== */

    function rejectOrganization(
        address organizationWallet
    ) external onlyAdmin {
        Organization storage organization =
            organizations[
                organizationWallet
            ];

        require(
            organization.status ==
                OrganizationStatus.PENDING,
            "HackathonRegistry: not pending"
        );

        organization.status =
            OrganizationStatus.REJECTED;

        organization.updatedAt =
            block.timestamp;

        emit OrganizationRejected(
            organizationWallet,
            block.timestamp
        );
    }

    /* =====================================================
       ADMIN REVOCATION
       ===================================================== */

    function revokeOrganization(
        address organizationWallet
    ) external onlyAdmin {
        Organization storage organization =
            organizations[
                organizationWallet
            ];

        require(
            organization.status ==
                OrganizationStatus.APPROVED,
            "HackathonRegistry: not approved"
        );

        organization.status =
            OrganizationStatus.REVOKED;

        organization.updatedAt =
            block.timestamp;

        emit OrganizationRevoked(
            organizationWallet,
            block.timestamp
        );
    }

    /* =====================================================
       ORGANIZATION STATUS
       ===================================================== */

    function isOrganizationApproved(
        address organizationWallet
    ) public view returns (bool) {
        return
            organizations[
                organizationWallet
            ].status ==
            OrganizationStatus.APPROVED;
    }

    /* =====================================================
       ORGANIZATION DETAILS
       ===================================================== */

    function getOrganization(
        address organizationWallet
    )
        external
        view
        returns (
            address wallet,
            string memory organizationName,
            OrganizationStatus status,
            uint256 submittedAt,
            uint256 approvedAt,
            uint256 updatedAt
        )
    {
        Organization storage organization =
            organizations[
                organizationWallet
            ];

        return (
            organization.wallet,
            organization.organizationName,
            organization.status,
            organization.submittedAt,
            organization.approvedAt,
            organization.updatedAt
        );
    }

    /* =====================================================
       BATCH CERTIFICATE ANCHORING
       ===================================================== */

    /**
     * @notice Anchor a batch of certificates using one
     * Merkle root.
     *
     * The individual certificate hashes are kept off-chain.
     * Only their collective Merkle root is anchored here.
     */
    function anchorCertificateBatch(
        bytes32 batchId,
        bytes32 merkleRoot,
        uint256 certificateCount,
        string calldata metadataURI
    ) external {
        require(
            isOrganizationApproved(msg.sender),
            "HackathonRegistry: organization not approved"
        );

        require(
            batchId != bytes32(0),
            "HackathonRegistry: invalid batch id"
        );

        require(
            merkleRoot != bytes32(0),
            "HackathonRegistry: invalid Merkle root"
        );

        require(
            certificateCount > 0,
            "HackathonRegistry: no certificates"
        );

        require(
            !certificateBatches[
                batchId
            ].exists,
            "HackathonRegistry: batch already exists"
        );

        certificateBatches[
            batchId
        ] = CertificateBatch({
            batchId: batchId,
            organization: msg.sender,
            merkleRoot: merkleRoot,
            certificateCount: certificateCount,
            anchoredAt: block.timestamp,
            metadataURI: metadataURI,
            exists: true
        });

        emit CertificateBatchAnchored(
            batchId,
            msg.sender,
            merkleRoot,
            certificateCount,
            block.timestamp
        );
    }

    /* =====================================================
       BATCH VERIFICATION
       ===================================================== */

    function getCertificateBatch(
        bytes32 batchId
    )
        external
        view
        returns (
            bytes32 id,
            address organization,
            bytes32 merkleRoot,
            uint256 certificateCount,
            uint256 anchoredAt,
            string memory metadataURI,
            bool exists
        )
    {
        CertificateBatch storage batch =
            certificateBatches[
                batchId
            ];

        return (
            batch.batchId,
            batch.organization,
            batch.merkleRoot,
            batch.certificateCount,
            batch.anchoredAt,
            batch.metadataURI,
            batch.exists
        );
    }

    function verifyCertificateBatch(
        bytes32 batchId,
        bytes32 expectedMerkleRoot
    ) external view returns (bool) {
        CertificateBatch storage batch =
            certificateBatches[
                batchId
            ];

        return
            batch.exists &&
            batch.merkleRoot ==
            expectedMerkleRoot;
    }

    /* =====================================================
       ADMIN CHECK
       ===================================================== */

    function isAdmin(
        address account
    ) external view returns (bool) {
        return account == admin;
    }
}