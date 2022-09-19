# Solidity Voting Scheme
A solidity implementation of the **TAVS** electronic voting scheme.
You can read the full paper [here](https://riunet.upv.es/bitstream/handle/10251/166370/Larrba-Flor?sequence=3).

To properly cite the TAVS protocol, please use the following information: 
```
@article{larriba2020two,
  title={A two authorities electronic vote scheme},
  author={Larriba, Antonio M and Sempere, Jos{\'e} M and L{\'o}pez, Dami{\'a}n},
  journal={Computers \& Security},
  volume={97},
  pages={101940},
  year={2020},
  publisher={Elsevier}
}
```

## TAVS Summary
A Two Authorities electronic Voting Scheme (TAVS) is an e-voting protocol that achieves universal verifiability with a reduced time-complexity both for the elector and the system.
TAVS employs the homomorphic properties of [RSA](https://en.wikipedia.org/wiki/RSA_(cryptosystem)) cryptosystem to implement a [Blind Signature Scheme](http://blog.koehntopp.de/uploads/Chaum.BlindSigForPayment.1982.PDF) that allows for anonymous voting.
The security of the scheme is derived from RSA itself and from the assumption that 2 unrelated entities exist.
An Identification Authority (IA) that checks the membership of a potential elector in the census; and, a Remote Polling Station (RPS) where the electors cast their votes.
As far as these two entities do not share information, the scheme remains secure.

While there are many instances of a problem where you acn find 2 antagonistic entities that will never share information.
There are also many scenarios where finding two unrelated entities might be impossible. 
For this reason, we implement TAVS using Solidity, where the RPS is replaced by an immutable smart contract.
Hence, solving the problem of finding two honest entities, since smart contracts are self-governed entities that only obey the source code. 
Solidity Voting Scheme (SVS) is this implementation, and it has been made public for auditability and to contribute to the open source community.
SVS is fully equivalent to TAVS and maintains all the e-voting features presented in the original paper. 
Since everything is public in blockchain, anyone can see the votes before the election ends.
This can be solved by giving the IA an additional RSA key to allow users to encrypt votes. 
The IA will free the private key after the election ends and the RPS will then compute the tally. 
However, this is outside the scope of this PoC.

:warning: This is a repository for research purposes. The code has not been audited.
Cryptography, and Smart contract development, are pretty sensible issue and only reputed and tested sources should be used in a production environment.
Use at your own risk!

## Code Organization
Roughly speaking, the code is organized as follows:

- `conracts/` contains the smart contracts that implement SVS:
  -  `BigNumber.sol`: Ethereum has no default support for big numbers. Thanks to [firoorg](https://github.com/firoorg/solidity-BigNumber) for the BigNumber library.
  -  `EelctionFactory.sol`: Implements, and handles, the creation of Election instances.
  -  `Election.sol`: Implements all the methods (vote, tally, verify) to carry out an Election in EVM networks.
- `deploy/` contains the main scripts to deploy the contracts in Mumbai network.
- `scripts/` contains a set of auxiliary functions both for implementing TAVS or for general smart contract development.
- `test/` contains all the tests (in Typescript) for the smart contracts. 
## Usage

### Installation
Assuming you have `node` and `npm` installed, you simply have to run:
```
npm install
```

### Compile Contracts
```
npx hardhat compile
```

### Running Tests
```
npx hardhat test
```

### Deploy
If you want to deploy the contracts in Mumbai Testnet, you need to configure the network in `hardhat.config.ts` and specify the private key in `env/.env`.
```
npx hardhat deploy --tags Main --network matic
```

### Verify
If you want to verify the deployed contracts, first you need to specify the `etherscan_api_key` in `hardhat.config.ts`.
Then, the `ElectionFactory` program can be simply verified by providing the address in which it was deployed.
```
npx hardhat verify 0xEBa9F87654171f88004f519CC18EfBD8A02e9421 --network mumbai
```
To verify the `Election` contract, since it was called with arguments, you need to provide the exact same arguments in the `deploy/arguments.js`, otherwise the verification will fail. 
```
npx hardhat verify --constructor-args verify/arguments.js --network mumbai  0x9E459651D2A14B100a310FDd542954bd9565dFC0
```

### Lint Code
You can simply run `npm run lint` to execute:

```
eslint --fix --ext .js,.jsx,.ts .
```

## Citation
This repository is part of a research article carried out by [ALFA](https://alfa.webs.upv.es/) research group.
Article yet to be published. The link will be here provided.
