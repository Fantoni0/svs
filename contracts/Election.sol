// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "./BigNumber.sol";

/**
    @title A contract that implements an Election process.
    @author Fantoni0
    @notice You can use this contract to create and abstract the details of a democratic election according to the TAVS voting scheme. https://www.sciencedirect.com/science/article/pii/S0167404820302169
    @custom:nonaudited This is an experimental contract that has NOT been audited.
*/
contract Election {
    string name;
    uint256 identifier;
    bytes pubKey;
    bytes modulo;
    uint256 startTime;
    uint256 completionTime;
    uint256 byteSizeVoteEncoding;
    uint256 byteSizeHashEncoding;

    Candidate[] candidates;                                         // List of Candidates participating in the election.
    Candidate public winner;                                        // Variable to store future election winner.
    mapping (address => Vote) public votes;                         // Mapping addresses to received votes.
    event NewVote(address voter, bytes hash, string candidate);     // Event to signal a new vote, for a specific candidate has been processed from an incoming address.

    /// Represents a ballot containing a signed and masked vote, and the inverse required to remove the masking.
    struct Ballot {
        bytes signedMaskedBallot;
        bytes inverseMask;
    }

    /// Represents an election Candidate.
    struct Candidate {
        string name;
        uint256 numVotes;
        uint256 id;
    }

    /// Represents a vote for a Candidate.
    struct Vote {
        address voter;
        Ballot ballot;
        Candidate candidate;
    }

    /**
        @notice Creates an instance of the Election contract.
        @param _name String identifier of the election.
        @param _identifier Numeric unique identifier of the election.
        @param _pubKey Public key used to verify the votes.
        @param _modulo RSA modulus used with the pubKey.
        @param _startTime Time when the election starts.
        @param _duration Duration of the election.
        @param _candidates Array of candidates presented to the election.
    */
    constructor (string memory _name,
                 uint256 _identifier,
                 bytes memory _pubKey,
                 bytes memory _modulo,
                 uint256 _startTime,
                 uint256 _duration,
                 string[] memory _candidates) {
        byteSizeVoteEncoding = 32; // Number of bytes encoding the vote.
        byteSizeHashEncoding = 32; // Number of bytes encoding the hash of the vote.
        name = _name;
        identifier = _identifier;
        pubKey = _pubKey;
        modulo = _modulo;
        if (_startTime > block.timestamp + _duration ) {
            startTime = _startTime;
        } else {
            startTime = block.timestamp;
        }
        completionTime =  startTime + _duration; // Time when the election ends and no more votes will be processed.
        // Add candidate for null/void votes.
        candidates.push(Candidate("Null Vote", 0, 0));
        for (uint256 i = 0; i < _candidates.length; i++) {
            candidates.push(Candidate(_candidates[i], 0, i+1));
        }
    }

    /**
        @notice Sends a vote to the Election contract.
        @dev Emits an event with the registered vote to later be indexed.
        @param signedMaskedBallot Bytes containing the signed and masked ballot.
        @param mask Bytes used to mask the signed ballot.
        @param inverseMask Inverse to the mask in modulo RSA used to remove the masking.
    */
    function sendVote (bytes memory signedMaskedBallot, bytes memory mask, bytes memory inverseMask) external {
        // Check timestamp before accepting the votes.votes
        require(block.timestamp < completionTime, "Election has already finished. No more votes accepted.");

        // Remove mask
        Ballot memory ballot = Ballot(signedMaskedBallot, inverseMask);

        BigNumber.instance memory bsignBallot = BigNumber._new(signedMaskedBallot, false, false );
        BigNumber.instance memory binvmask = BigNumber._new(inverseMask, false, false);
        BigNumber.instance memory bmod = BigNumber._new(modulo, false, false );

        BigNumber.instance memory unmasked = BigNumber.modmul(bsignBallot, binvmask, bmod);

        // Remove signature
        BigNumber.instance memory bpubKey = BigNumber._new(pubKey, false, false);
        BigNumber.instance memory cleanVote = BigNumber.prepare_modexp(unmasked, bpubKey, bmod);

        // Separate vote and hash
        bytes memory voteChoice;
        bytes memory voteHash;
        (voteChoice, voteHash) = separateVoteAndHash(cleanVote.val);

        // Verify Hash
        require(bytes32(voteHash) == keccak256(bytes.concat(voteChoice, mask)), "Invalid hash");

        // Vote is correct!
        string memory votedCandidate = string(removeLeadingZeros(voteChoice));
        uint idCandidate;
        bool found = false;
        for (uint256 i = 1;  !found &&i < candidates.length; i++){
            if (keccak256(abi.encodePacked(candidates[i].name)) == keccak256(abi.encodePacked(votedCandidate))){
                found = true;
                idCandidate = i;
            }
        }
        // If we couldn't find a candidate for the vote. We count it as null.@author
        if (!found) {
            idCandidate = 0;
        }
        candidates[idCandidate].numVotes++; // Count vote
        votes[msg.sender] = Vote(msg.sender, ballot, candidates[idCandidate]);
        emit NewVote(msg.sender, voteHash, candidates[idCandidate].name);
    }

    /**
        @notice Given a stream of bytes, separates the vote and the hash that identifies it.
        @dev Vote and hash sizes are flexible and can be tuned for different vote codifications and hash functions.
        @param data Bytestream containing the concatenated vote and hash.
        @return (vote, hash) Bytes containing respectively the vote and the hash already separated.
    */
    function separateVoteAndHash (bytes memory data) internal view returns (bytes memory, bytes memory) {
        bytes memory _voteChoice = new bytes(byteSizeVoteEncoding);
        bytes memory _voteHash = new bytes(byteSizeHashEncoding);
        for (uint i = 0; i < byteSizeVoteEncoding; i++) {
            _voteChoice[i] = data[i];
        }
        for (uint i = 0; i < byteSizeHashEncoding; i++) {
            _voteHash[i] = data[i + byteSizeVoteEncoding];
        }
        return (_voteChoice, _voteHash);
    }

    /**
        @notice Removes leading zeros from a bytestream.
        @dev When dealing with big numbers, we make use of a library that does not work well with leading zeroes.
        @param data Bytestream of data to remove leading zeroes from.
        @return Bytestream without leading zeroes.
    */
    function removeLeadingZeros(bytes memory data) internal pure returns (bytes memory) {
        uint zbytes = 0;
        bool leadingZeros = true;
        bool firstNonZero = false;
        uint pos;
        for (uint i = 0; i < data.length; i++) {
            if (data[i] == 0x00 && leadingZeros) {
                zbytes++;
            } else {
                leadingZeros = false;
            }
            if (data[i] != 0x00 && !firstNonZero) {
                pos = i;
               firstNonZero = true;
            }
        }
        bytes memory result = new bytes (data.length - zbytes);
        uint j = 0;
        for (uint i = pos; i < data.length; i++) {
               result[j] = data[i];
                j++;
        }
        return result;
    }

    /**
        @notice Computes the winner of the election.
        @dev The method should not be called until Election ends. In case of draw a phony Candidate with name Draw is returned.
        @return Candidate The candidate with most votes.
    */
    function computeWinner () public returns (Candidate memory) {
        require(block.timestamp > completionTime,
            "Election must be finished to compute tally.");
        if (bytes(winner.name).length != 0) {
            return winner;
        } else {
            Candidate memory prevWinner;
            for (uint256 i = 0; i < candidates.length; i++){
                if ( candidates[i].numVotes >= winner.numVotes ) {
                    prevWinner = winner;
                    winner = candidates[i];
                }
            }
            if (prevWinner.numVotes == winner.numVotes) {
                winner = Candidate("Draw", winner.numVotes, candidates.length + 1);
            }
            return winner;
        }
    }

    /**
        @notice Compute number of bytes required to represent a given uint256.
        @param x Number to be represented.
        @return Number of bytes required to represent x.
    */
    function computeNumberBytes (uint256 x) internal pure returns (uint256) {
        uint256 numberOfBytes = 0;
        while (x != 0) {
            x = x >> 8;
            numberOfBytes++;
        }
        return numberOfBytes;
    }
}
