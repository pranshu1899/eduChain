// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract EduProof {

    // =========================================================
    // AUTHORITY
    // =========================================================

    address public authority;

    // =========================================================
    // ISSUER
    // =========================================================

    enum IssuerStatus {
        NONE,
        PENDING,
        AUTHORIZED,
        SUSPENDED,
        REVOKED,
        REJECTED
    }

    struct Issuer {
        address wallet;
        string institutionName;
        string institutionId;
        IssuerStatus status;
    }

    mapping(address => Issuer) public issuers;

    // Stores every wallet that has ever requested/been registered.
    address[] private issuerRequestList;

    // =========================================================
    // CREDENTIAL
    // =========================================================

    enum CredentialStatus {
        NONE,
        ACTIVE,
        SUPERSEDED,
        REVOKED
    }

    struct Credential {
        uint256 id;
        uint256 rootCredentialId;
        address issuer;
        string studentDID;
        string credentialType;
        string institution;
        string institutionId;
        string degree;
        string issueDate;
        bytes32 credentialHash;
        bytes signature;
        string cid;
        uint256 version;
        CredentialStatus status;
        uint256 issuedAt;
        uint256 previousVersionId;
    }

    mapping(uint256 => Credential) public credentials;

    uint256 private nextCredentialId = 1;

    mapping(uint256 => uint256[])
        private credentialVersions;

    // =========================================================
    // ANALYTICS
    // =========================================================

    uint256 public totalCredentialsIssued;
    uint256 public totalCredentialsUpdated;
    uint256 public totalCredentialsRevoked;

    uint256 public totalIssuersRegistered;
    uint256 public totalIssuersAuthorized;

    mapping(address => uint256)
        public issuerCredentialsIssued;

    mapping(address => uint256)
        public issuerCredentialsUpdated;

    mapping(address => uint256)
        public issuerCredentialsRevoked;

    // =========================================================
    // EVENTS
    // =========================================================

    event IssuerRequested(
        address indexed issuer,
        string institutionName,
        string institutionId
    );

    event IssuerRegistered(
        address indexed issuer,
        string institutionName,
        string institutionId
    );

    event IssuerAuthorized(
        address indexed issuer
    );

    event IssuerRejected(
        address indexed issuer
    );

    event IssuerSuspended(
        address indexed issuer
    );

    event IssuerRevoked(
        address indexed issuer
    );

    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed issuer,
        string studentDID,
        uint256 version
    );

    event CredentialUpdated(
        uint256 indexed oldCredentialId,
        uint256 indexed newCredentialId,
        address indexed issuer,
        uint256 version
    );

    event CredentialRevoked(
        uint256 indexed credentialId,
        address indexed issuer
    );

    event CredentialVerified(
        uint256 indexed credentialId,
        address indexed verifier,
        bool valid,
        uint256 timestamp
    );

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor() {
        authority = msg.sender;
    }

    // =========================================================
    // MODIFIERS
    // =========================================================

    modifier onlyAuthority() {
        require(
            msg.sender == authority,
            "Not authorized authority"
        );
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            issuers[msg.sender].status ==
                IssuerStatus.AUTHORIZED,
            "Issuer not authorized"
        );
        _;
    }

    // =========================================================
    // ISSUER REQUEST
    // =========================================================

    /*
        Anyone can request to become a university issuer.

        The wallet starts in PENDING status.
        Only the authority can approve or reject it.
    */
    function requestIssuer(
        string calldata institutionName,
        string calldata institutionId
    )
        external
    {
        require(
            bytes(institutionName).length > 0,
            "Institution name required"
        );

        require(
            bytes(institutionId).length > 0,
            "Institution ID required"
        );

        IssuerStatus currentStatus =
            issuers[msg.sender].status;

        require(
            currentStatus == IssuerStatus.NONE ||
            currentStatus == IssuerStatus.REJECTED,
            "Issuer request already exists"
        );

        issuers[msg.sender] = Issuer({
            wallet: msg.sender,
            institutionName: institutionName,
            institutionId: institutionId,
            status: IssuerStatus.PENDING
        });

        issuerRequestList.push(msg.sender);

        totalIssuersRegistered++;

        emit IssuerRequested(
            msg.sender,
            institutionName,
            institutionId
        );

        emit IssuerRegistered(
            msg.sender,
            institutionName,
            institutionId
        );
    }

    // =========================================================
    // ADMIN / AUTHORITY ISSUER MANAGEMENT
    // =========================================================

    /*
        Existing direct registration functionality.

        The authority can still directly register an issuer.
    */
    function registerIssuer(
        address issuer,
        string calldata institutionName,
        string calldata institutionId
    )
        external
        onlyAuthority
    {
        require(
            issuer != address(0),
            "Invalid issuer"
        );

        require(
            bytes(institutionName).length > 0,
            "Institution name required"
        );

        require(
            bytes(institutionId).length > 0,
            "Institution ID required"
        );

        require(
            issuers[issuer].status ==
                IssuerStatus.NONE,
            "Issuer already exists"
        );

        issuers[issuer] = Issuer({
            wallet: issuer,
            institutionName: institutionName,
            institutionId: institutionId,
            status: IssuerStatus.PENDING
        });

        issuerRequestList.push(issuer);

        totalIssuersRegistered++;

        emit IssuerRegistered(
            issuer,
            institutionName,
            institutionId
        );
    }

    // =========================================================
    // APPROVE ISSUER
    // =========================================================

    function authorizeIssuer(
        address issuer
    )
        external
        onlyAuthority
    {
        require(
            issuers[issuer].status ==
                IssuerStatus.PENDING,
            "Issuer not pending"
        );

        issuers[issuer].status =
            IssuerStatus.AUTHORIZED;

        totalIssuersAuthorized++;

        emit IssuerAuthorized(issuer);
    }

    // =========================================================
    // REJECT ISSUER
    // =========================================================

    function rejectIssuer(
        address issuer
    )
        external
        onlyAuthority
    {
        require(
            issuers[issuer].status ==
                IssuerStatus.PENDING,
            "Issuer not pending"
        );

        issuers[issuer].status =
            IssuerStatus.REJECTED;

        emit IssuerRejected(issuer);
    }

    // =========================================================
    // SUSPEND ISSUER
    // =========================================================

    function suspendIssuer(
        address issuer
    )
        external
        onlyAuthority
    {
        require(
            issuers[issuer].status ==
                IssuerStatus.AUTHORIZED,
            "Issuer not authorized"
        );

        issuers[issuer].status =
            IssuerStatus.SUSPENDED;

        emit IssuerSuspended(issuer);
    }

    // =========================================================
    // REVOKE ISSUER
    // =========================================================

    function revokeIssuer(
        address issuer
    )
        external
        onlyAuthority
    {
        require(
            issuers[issuer].status !=
                IssuerStatus.NONE,
            "Issuer does not exist"
        );

        issuers[issuer].status =
            IssuerStatus.REVOKED;

        emit IssuerRevoked(issuer);
    }

    // =========================================================
    // GET PENDING ISSUER REQUESTS
    // =========================================================

    function getPendingIssuerRequests()
        external
        view
        onlyAuthority
        returns (address[] memory)
    {
        uint256 pendingCount = 0;

        for (
            uint256 i = 0;
            i < issuerRequestList.length;
            i++
        ) {
            if (
                issuers[
                    issuerRequestList[i]
                ].status ==
                IssuerStatus.PENDING
            ) {
                pendingCount++;
            }
        }

        address[] memory pendingIssuers =
            new address[](pendingCount);

        uint256 index = 0;

        for (
            uint256 i = 0;
            i < issuerRequestList.length;
            i++
        ) {
            address issuer =
                issuerRequestList[i];

            if (
                issuers[issuer].status ==
                IssuerStatus.PENDING
            ) {
                pendingIssuers[index] = issuer;
                index++;
            }
        }

        return pendingIssuers;
    }

    // =========================================================
    // GET ISSUER
    // =========================================================

    function isAuthorizedIssuer(
        address issuer
    )
        external
        view
        returns (bool)
    {
        return
            issuers[issuer].status ==
            IssuerStatus.AUTHORIZED;
    }

    function getIssuer(
        address issuer
    )
        external
        view
        returns (
            address wallet,
            string memory institutionName,
            string memory institutionId,
            IssuerStatus status
        )
    {
        Issuer memory issuerData =
            issuers[issuer];

        return (
            issuerData.wallet,
            issuerData.institutionName,
            issuerData.institutionId,
            issuerData.status
        );
    }

    // =========================================================
    // ISSUE CREDENTIAL
    // =========================================================

    function issueCredential(
        string calldata studentDID,
        string calldata credentialType,
        string calldata institution,
        string calldata institutionId,
        string calldata degree,
        string calldata issueDate,
        bytes32 credentialHash,
        bytes calldata signature,
        string calldata cid
    )
        external
        onlyAuthorizedIssuer
        returns (uint256)
    {
        require(
            bytes(studentDID).length > 0,
            "Invalid student DID"
        );

        require(
            credentialHash != bytes32(0),
            "Invalid credential hash"
        );

        require(
            signature.length > 0,
            "Invalid signature"
        );

        uint256 credentialId =
            nextCredentialId++;

        Credential memory newCredential =
            Credential({
                id: credentialId,
                rootCredentialId: credentialId,
                issuer: msg.sender,
                studentDID: studentDID,
                credentialType: credentialType,
                institution: institution,
                institutionId: institutionId,
                degree: degree,
                issueDate: issueDate,
                credentialHash: credentialHash,
                signature: signature,
                cid: cid,
                version: 1,
                status: CredentialStatus.ACTIVE,
                issuedAt: block.timestamp,
                previousVersionId: 0
            });

        credentials[credentialId] =
            newCredential;

        credentialVersions[
            credentialId
        ].push(credentialId);

        totalCredentialsIssued++;

        issuerCredentialsIssued[
            msg.sender
        ]++;

        emit CredentialIssued(
            credentialId,
            msg.sender,
            studentDID,
            1
        );

        return credentialId;
    }

    // =========================================================
    // GET CREDENTIAL
    // =========================================================

    function getCredential(
        uint256 credentialId
    )
        external
        view
        returns (Credential memory)
    {
        require(
            credentials[credentialId].status !=
                CredentialStatus.NONE,
            "Credential does not exist"
        );

        return credentials[credentialId];
    }

    // =========================================================
    // UPDATE CREDENTIAL
    // =========================================================

    function updateCredential(
        uint256 credentialId,
        string calldata newStudentDID,
        string calldata newCredentialType,
        string calldata newInstitution,
        string calldata newInstitutionId,
        string calldata newDegree,
        string calldata newIssueDate,
        bytes32 newCredentialHash,
        bytes calldata newSignature,
        string calldata newCid
    )
        external
        onlyAuthorizedIssuer
        returns (uint256)
    {
        Credential storage currentCredential =
            credentials[credentialId];

        require(
            currentCredential.status ==
                CredentialStatus.ACTIVE,
            "Credential not active"
        );

        require(
            currentCredential.issuer ==
                msg.sender,
            "Only original issuer can update"
        );

        require(
            newCredentialHash != bytes32(0),
            "Invalid credential hash"
        );

        require(
            newSignature.length > 0,
            "Invalid signature"
        );

        uint256 rootId =
            currentCredential.rootCredentialId;

        uint256 newCredentialId =
            nextCredentialId++;

        uint256 newVersion =
            currentCredential.version + 1;

        currentCredential.status =
            CredentialStatus.SUPERSEDED;

        Credential memory updatedCredential =
            Credential({
                id: newCredentialId,
                rootCredentialId: rootId,
                issuer: msg.sender,
                studentDID: newStudentDID,
                credentialType: newCredentialType,
                institution: newInstitution,
                institutionId: newInstitutionId,
                degree: newDegree,
                issueDate: newIssueDate,
                credentialHash: newCredentialHash,
                signature: newSignature,
                cid: newCid,
                version: newVersion,
                status: CredentialStatus.ACTIVE,
                issuedAt: block.timestamp,
                previousVersionId: credentialId
            });

        credentials[newCredentialId] =
            updatedCredential;

        credentialVersions[rootId]
            .push(newCredentialId);

        totalCredentialsUpdated++;

        issuerCredentialsUpdated[
            msg.sender
        ]++;

        emit CredentialUpdated(
            credentialId,
            newCredentialId,
            msg.sender,
            newVersion
        );

        emit CredentialIssued(
            newCredentialId,
            msg.sender,
            newStudentDID,
            newVersion
        );

        return newCredentialId;
    }

    // =========================================================
    // REVOKE CREDENTIAL
    // =========================================================

    function revokeCredential(
        uint256 credentialId
    )
        external
        onlyAuthorizedIssuer
    {
        Credential storage credential =
            credentials[credentialId];

        require(
            credential.status ==
                CredentialStatus.ACTIVE,
            "Credential not active"
        );

        require(
            credential.issuer ==
                msg.sender,
            "Only issuer can revoke"
        );

        credential.status =
            CredentialStatus.REVOKED;

        totalCredentialsRevoked++;

        issuerCredentialsRevoked[
            msg.sender
        ]++;

        emit CredentialRevoked(
            credentialId,
            msg.sender
        );
    }

    // =========================================================
    // VERSION HISTORY
    // =========================================================

    function getVersionHistory(
        uint256 credentialId
    )
        external
        view
        returns (uint256[] memory)
    {
        require(
            credentials[credentialId].status !=
                CredentialStatus.NONE,
            "Credential does not exist"
        );

        uint256 rootId =
            credentials[credentialId]
                .rootCredentialId;

        return credentialVersions[rootId];
    }

    // =========================================================
    // SIGNATURE VERIFICATION
    // =========================================================

    function verifyCredentialSignature(
        uint256 credentialId
    )
        public
        view
        returns (bool)
    {
        Credential memory credential =
            credentials[credentialId];

        require(
            credential.status !=
                CredentialStatus.NONE,
            "Credential does not exist"
        );

        bytes32 ethSignedHash =
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    credential.credentialHash
                )
            );

        (
            bytes32 r,
            bytes32 s,
            uint8 v
        ) = _splitSignature(
            credential.signature
        );

        address signer =
            ecrecover(
                ethSignedHash,
                v,
                r,
                s
            );

        return signer == credential.issuer;
    }

    // =========================================================
    // RECORD VERIFICATION
    // =========================================================

    function recordVerification(
        uint256 credentialId
    )
        external
        returns (bool)
    {
        Credential memory credential =
            credentials[credentialId];

        require(
            credential.status !=
                CredentialStatus.NONE,
            "Credential does not exist"
        );

        bool valid =
            credential.status ==
                CredentialStatus.ACTIVE &&
            issuers[credential.issuer].status ==
                IssuerStatus.AUTHORIZED &&
            verifyCredentialSignature(
                credentialId
            );

        emit CredentialVerified(
            credentialId,
            msg.sender,
            valid,
            block.timestamp
        );

        return valid;
    }

    // =========================================================
    // ANALYTICS
    // =========================================================

    function getGlobalAnalytics()
        external
        view
        returns (
            uint256 credentialsIssued,
            uint256 credentialsUpdated,
            uint256 credentialsRevoked,
            uint256 issuersRegistered,
            uint256 issuersAuthorized
        )
    {
        return (
            totalCredentialsIssued,
            totalCredentialsUpdated,
            totalCredentialsRevoked,
            totalIssuersRegistered,
            totalIssuersAuthorized
        );
    }

    function getIssuerAnalytics(
        address issuer
    )
        external
        view
        returns (
            uint256 issued,
            uint256 updated,
            uint256 revoked
        )
    {
        return (
            issuerCredentialsIssued[issuer],
            issuerCredentialsUpdated[issuer],
            issuerCredentialsRevoked[issuer]
        );
    }

    // =========================================================
    // SIGNATURE HELPER
    // =========================================================

    function _splitSignature(
        bytes memory signature
    )
        internal
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(
            signature.length == 65,
            "Invalid signature length"
        );

        assembly ("memory-safe") {
            r := mload(
                add(signature, 32)
            )

            s := mload(
                add(signature, 64)
            )

            v := byte(
                0,
                mload(
                    add(signature, 96)
                )
            )
        }

        if (v < 27) {
            v += 27;
        }

        require(
            v == 27 || v == 28,
            "Invalid signature"
        );
    }
}