// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "./BigNumber.sol";

contract Election {

    string name; // Short Name
    uint256 identifier;
    bytes pubKey;
    bytes modulo;
    uint256 startTime;
    uint256 completionTime;
    uint256 byteSizeVoteEncoding;
    uint256 byteSizeHashEncoding;

    Candidate[] candidates;
    Candidate public winner;
    mapping (address => Vote) public votes;
    event NewVote(address voter, bytes hash, string candidate);

    struct Ballot {
        bytes signedMaskedBallot;
        bytes inverseMask;
    }

    struct Candidate {
        string name;
        uint256 numVotes;
        uint256 id;
    }

    struct Vote {
        address voter;
        Ballot ballot;
        Candidate candidate;
    }

    constructor (string memory _name,
                 uint256 _identifier,
                 bytes memory _pubKey,
                 bytes memory _modulo,
                 uint256 _startTime,
                 uint256 _duration,
                 string[] memory _candidates) {
        byteSizeVoteEncoding = 32;
        byteSizeHashEncoding = 32;
        name = _name;
        identifier = _identifier;
        pubKey = _pubKey;
        modulo = _modulo;
        if (_startTime > block.timestamp + _duration ) {
            startTime = _startTime;
        } else {
            startTime = block.timestamp;
        }
        completionTime =  startTime + _duration;
        // Add candidate for null/void votes.
        candidates.push(Candidate("Null Vote", 0, 0));
        for (uint256 i = 0; i < _candidates.length; i++) {
            candidates.push(Candidate(_candidates[i], 0, i+1));
        }
    }

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

    function computeNumberBytes (uint256 x) internal pure returns (uint256) {
        uint256 numberOfBytes = 0;
        while (x != 0) {
            x = x >> 8;
            numberOfBytes++;
        }
        return numberOfBytes;
    }
}
ss