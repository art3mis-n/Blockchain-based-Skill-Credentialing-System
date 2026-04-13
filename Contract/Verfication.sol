// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

/// @title CertChain v2 — Blockchain Certificate Verification
/// @notice Adds expiry, revocation, digital signature storage, batch counters
contract Verification {
    constructor() { owner = msg.sender; }

    address public owner;
    uint32 public count_Exporters;
    uint32 public count_hashes;

    struct Record {
        uint    blockNumber;
        uint    minetime;
        uint    expiryTime;   // 0 = no expiry; else unix timestamp
        bool    revoked;
        string  info;
        string  ipfs_hash;
        bytes   signature;    // optional ECDSA sig from issuer wallet
    }

    struct Exporter_Record {
        uint   blockNumber;
        string info;
    }

    mapping(bytes32 => Record)           private docHashes;
    mapping(address => Exporter_Record)  private Exporters;

    event addHash(address indexed _exporter, string _ipfsHash, uint _expiryTime);
    event HashRevoked(bytes32 indexed _hash, address indexed _by);

    modifier onlyOwner()    { require(msg.sender == owner, "Not owner"); _; }
    modifier validAddr(address a) { require(a != address(0), "Zero address"); _; }
    modifier canAdd()       { require(Exporters[msg.sender].blockNumber != 0, "Not authorised"); _; }
    modifier isAuthor(bytes32 h) {
        require(
            keccak256(abi.encodePacked(Exporters[msg.sender].info)) ==
            keccak256(abi.encodePacked(docHashes[h].info)),
            "Not your document"
        ); _;
    }

    // ── Exporter management ─────────────────────────────
    function add_Exporter(address _add, string calldata _info) external onlyOwner {
        require(Exporters[_add].blockNumber == 0, "Already registered");
        Exporters[_add] = Exporter_Record(block.number, _info);
        ++count_Exporters;
    }
    function delete_Exporter(address _add) external onlyOwner {
        require(Exporters[_add].blockNumber != 0, "Not found");
        delete Exporters[_add];
        --count_Exporters;
    }
    function alter_Exporter(address _add, string calldata _info) external onlyOwner {
        require(Exporters[_add].blockNumber != 0, "Not found");
        Exporters[_add].info = _info;
    }
    function changeOwner(address _new) external onlyOwner validAddr(_new) { owner = _new; }

    // ── Certificate issuance (v2 — with expiry + signature) ──
    function addDocHash(bytes32 hash, string calldata _ipfs, uint _expirySecs, bytes calldata _sig) public canAdd {
        require(docHashes[hash].blockNumber == 0, "Already registered");
        uint expiry = _expirySecs > 0 ? block.timestamp + _expirySecs : 0;
        docHashes[hash] = Record(block.number, block.timestamp, expiry, false, Exporters[msg.sender].info, _ipfs, _sig);
        ++count_hashes;
        emit addHash(msg.sender, _ipfs, expiry);
    }

    // Backward-compatible (original signature)
    function addDocHash(bytes32 hash, string calldata _ipfs) public canAdd {
        require(docHashes[hash].blockNumber == 0, "Already registered");
        docHashes[hash] = Record(block.number, block.timestamp, 0, false, Exporters[msg.sender].info, _ipfs, bytes(""));
        ++count_hashes;
        emit addHash(msg.sender, _ipfs, 0);
    }

    // ── Revocation ──────────────────────────────────────
    function revokeHash(bytes32 _hash) external isAuthor(_hash) canAdd {
        require(docHashes[_hash].minetime != 0 && !docHashes[_hash].revoked, "Cannot revoke");
        docHashes[_hash].revoked = true;
        emit HashRevoked(_hash, msg.sender);
    }

    // ── Delete ──────────────────────────────────────────
    function deleteHash(bytes32 _hash) public isAuthor(_hash) canAdd {
        require(docHashes[_hash].minetime != 0, "Not found");
        delete docHashes[_hash];
        --count_hashes;
    }

    // ── Read functions ──────────────────────────────────
    /// @return blockNum, mineTime, expiryTime, info, ipfsHash, revoked
    function findDocHash(bytes32 _hash) external view returns (uint,uint,uint,string memory,string memory,bool) {
        Record storage r = docHashes[_hash];
        return (r.blockNumber, r.minetime, r.expiryTime, r.info, r.ipfs_hash, r.revoked);
    }

    /// @return "VALID" | "REVOKED" | "EXPIRED" | "NOT_FOUND"
    function getCertStatus(bytes32 _hash) external view returns (string memory) {
        Record storage r = docHashes[_hash];
        if (r.blockNumber == 0) return "NOT_FOUND";
        if (r.revoked)          return "REVOKED";
        if (r.expiryTime > 0 && block.timestamp > r.expiryTime) return "EXPIRED";
        return "VALID";
    }

    function getSignature(bytes32 _hash) external view returns (bytes memory) { return docHashes[_hash].signature; }
    function getExporterInfo(address _add) external view returns (string memory) { return Exporters[_add].info; }
}
