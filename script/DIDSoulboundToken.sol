// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DIDSoulboundToken
 * @notice Non-transferable ERC-721 token representing a verified SatuIdentitas DID.
 *         Once minted, the token is permanently bound to the recipient wallet.
 *         Based on ERC-5114 Soulbound Badge concept.
 *
 * @dev Deployed on Sepolia testnet alongside DIDRegistry.
 *      Token URI points to IPFS certificate (Pinata).
 */
contract DIDSoulboundToken is ERC721, Ownable {

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice Next token ID to be minted
    uint256 private _nextTokenId;

    /// @notice DID → tokenId mapping
    mapping(string => uint256) public didToTokenId;

    /// @notice tokenId → DID string
    mapping(uint256 => string) public tokenIdToDid;

    /// @notice tokenId → IPFS CID of the DID certificate
    mapping(uint256 => string) public tokenURI_map;

    /// @notice DIDRegistry contract address (only it can trigger mints)
    address public didRegistry;

    // ── Events ───────────────────────────────────────────────────────────────

    event SoulboundMinted(address indexed soul, string did, uint256 tokenId, string ipfsHash);

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(address _didRegistry) ERC721("SatuIdentitas DID", "SIDID") Ownable(msg.sender) {
        didRegistry = _didRegistry;
        _nextTokenId = 1;
    }

    // ── Minting ──────────────────────────────────────────────────────────────

    /**
     * @notice Mint a Soulbound Token for a verified DID.
     * @param soul    Wallet address to bind the token to.
     * @param did     The Decentralized Identifier string.
     * @param ipfsHash IPFS CID of the DID certificate JSON.
     */
    function mintSoulbound(
        address soul,
        string calldata did,
        string calldata ipfsHash
    ) external {
        require(
            msg.sender == didRegistry || msg.sender == owner(),
            "SBT: caller not authorized"
        );
        require(didToTokenId[did] == 0, "SBT: DID already has a token");

        uint256 tokenId = _nextTokenId++;
        _safeMint(soul, tokenId);

        didToTokenId[did] = tokenId;
        tokenIdToDid[tokenId] = did;
        tokenURI_map[tokenId] = ipfsHash;

        emit SoulboundMinted(soul, did, tokenId, ipfsHash);
    }

    // ── Soulbound: block all transfers ───────────────────────────────────────

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Allow minting (from == address(0)) but block all other transfers
        require(from == address(0), "SBT: token is non-transferable");
        return super._update(to, tokenId, auth);
    }

    // ── Token URI ────────────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory ipfsHash = tokenURI_map[tokenId];
        return string(abi.encodePacked("ipfs://", ipfsHash));
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setDidRegistry(address _didRegistry) external onlyOwner {
        didRegistry = _didRegistry;
    }
}
