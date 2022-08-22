// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

//import "./ownable.sol";
import "./Election.sol";

contract ElectionFactory {

    Election[] public elections;
    mapping (uint256 => Election) public idToElection; // ¿Hace falta si ya existe un array?
    event NewElection(address electionAddress, address indexed creator, uint256 indexed id, string indexed name); // Indexed allows to later filter results from events.


    // Public functions
    function getElections () external view returns (Election[] memory) {
        return elections;
    }

    function getElection (uint256 _id) external view returns (Election) {
        return elections[_id];
    }

    // Private functions
    function createElection(string memory _name,
                             bytes memory _pubKey,
                             bytes memory _modulo,
                             uint256 _startTime,
                             uint256 _duration,
                             string[] memory _candidates) public returns (uint) {

        require(_duration >= 60 minutes, "No elections shorter than 1 hour allowed");
        require(_duration <= 5760 minutes, "No elections longer than 4 days allowed");


        uint256 id = elections.length;
        Election election = new Election(_name,
                                            id,
                                        _pubKey,
                                        _modulo,
                                        _startTime,
                                        _duration,
                                        _candidates);
        elections.push(election);
        idToElection[id] = election;
        emit NewElection(address(election), msg.sender, id, _name);
        return id;
    }

}
