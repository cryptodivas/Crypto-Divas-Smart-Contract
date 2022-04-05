# Cryptodivas NFT

## Initial setup

Install the npm dependencies using the command :
```
npm i
```
Create a .env file
In the 'hardhat.config.js' file the params inherited from process.env should be added in the .env file


## Smart contracts

The smart contracts can be found in the 'contracts' directory.

Uses ERC721A for maximum gas optimization.

Uses merkle tree data structure for whitelisting.


## Test cases

The test cases are in the 'test' directory.

To run the test cases, run the command :

```
npx hardhat test
```

## Code coverage

To run the solidity code coverage, run the command :

```
npx hardhat coverage
```

A 'coverage' folder will be created contain all information regarding coverage.
An index.html file in the coverage folder can be used to view the coverage of each smart contract with a UI.

## Deployment

Ensure that the .env file has been setup

To deploy the smart contract to a network, run the command :

```
npx hardhat run --network [enter network (from hardhat.config.js) here] scripts/deploy.js
```