// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "./Election.sol";

/**
    @title A contract that implements the Factory pattern for the Election contract.
    @author Fantoni0
    @notice You can use this contract to create, manage and store elections according to the TAVS voting scheme. https://www.sciencedirect.com/science/article/pii/S0167404820302169
    @custom:nonaudited This is an experimental contract that has NOT been audited.
*/
contract ElectionFactory {

    Election[] public elections;                                                                                    // List of elections created.
    mapping (uint256 => Election) public idToElection;                                                              // Mapping election ids to Election instnaces
    event NewElection(address electionAddress, address indexed creator, uint256 indexed id, string indexed name);   // Indexed allows to later filter results from events.


    /**
        @notice Returns the list of elections.
        @return List of elections.
    */
    function getElections () external view returns (Election[] memory) {
        return elections;
    }

    /**
        @notice Returns an specific election indexed by id.
        @dev The id is actually the position in the array for indexing efficiency.
        @param _id Id of the election.
        @return Election.
    */
    function getElection (uint256 _id) external view returns (Election) {
        return elections[_id];
    }

    /**
        @notice Creates an instance of the class Election.
        @param _name String identifier of the election.
        @param _pubKey Public key used to verify the votes.
        @param _modulo RSA modulus used with the pubKey.
        @param _startTime Time when the election starts.
        @param _duration Duration of the election.
        @param _candidates List of presented candidates in the election.
        @return Election id.
    */
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
