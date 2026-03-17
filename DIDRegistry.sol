// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DIDRegistry {
    struct Identity {
        string did;
        string idHash; // Hash of NIK or KK to preserve privacy
        uint256 timestamp;
        address owner;
    }

    mapping(string => Identity) public identities;
    event DIDRegistered(string did, string idHash, address indexed owner);

    function registerDID(string memory _did, string memory _idHash) public {
        require(bytes(identities[_did].did).length == 0, "DID already registered");
        
        identities[_did] = Identity({
            did: _did,
            idHash: _idHash,
            timestamp: block.timestamp,
            owner: msg.sender
        });

        emit DIDRegistered(_did, _idHash, msg.sender);
    }

    function getIdentity(string memory _did) public view returns (string memory, string memory, uint256, address) {
        Identity memory id = identities[_did];
        require(bytes(id.did).length != 0, "DID not found");
        return (id.did, id.idHash, id.timestamp, id.owner);
    }
}
