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

### ERC721A for maximum gas optimization.

Based on the repo : https://github.com/chiru-labs/ERC721A/blob/main/contracts/ERC721A.sol


### Merkle tree data structure for whitelisting

The merkle root hash is used to verify whether a particular user is part of the whitelist and how many NFTs the user is entitled to.

Merkle root hash can be generated using the npm library: https://www.npmjs.com/package/merkletreejs


### Provenance Hash coupled with randomization factor for NFT metadata integrity and fair distribution

A bytes32 variable called provenance hash is used to hash the NFT metadata url before performing randomization. It can be set in the function:
```
setProvenance(bytes32 provenanceHash)
```


This provenance hash cannot be updated after randomization is done using the function :
```
rollStartIndex()
```
This is used to counter NFT snipers, minimize gas wars and ensure a much fairer distribution of NFTs.

## Reveal NFT

The NFT base URL can only be set to the url where the hash of the url should be equal to the provenance hash.
After setting the base url the randomization function is performed.
This is done to make sure that no one has centralised control over the metadata.


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

Ensure that the .env file has been setup.

In deploy.js pass in the constructor arguments:
1. Dummy URI (The preveal NFT metadata url)
    * Example: "ipfs://QmRsRcJucYGrSpgp5tWno9vEd9KXMhVFeJPFMsL1ujVKNJ"
2. Provenance hash (The hash of the reveal NFT metadata)
    * Example: "0xaf369ffdf2faa028ca323f2762fca38dc0425bace953978c2b4c293189ef66a1"
3. Merkle Root Hash (For whitelisting)
    * Example: "0x9550dd40ed8c29bbbafe1744be53c905e3df8951c698dc529999fd17f45bcc04"
4. NFT Reveal Time (Timestamp in seconds post which NFT can be revealed)
    * Example: 1649668182
5. MAX OWNER RESERVE (Number of NFTs reserved for the owner)
    * Example: 100
6. MAX SUPPLY (Maximum supply of NFTs)
    * Example: 1000

Deploy script example: 
```
await cd.deploy("ipfs://QmRsRcJucYGrSpgp5tWno9vEd9KXMhVFeJPFMsL1ujVKNJ","0xaf369ffdf2faa028ca323f2762fca38dc0425bace953978c2b4c293189ef66a1","0x9550dd40ed8c29bbbafe1744be53c905e3df8951c698dc529999fd17f45bcc04",1649668182, 100, 1000);
```

To deploy the smart contract to a network, run the command :

```
npx hardhat run --network [enter network (from hardhat.config.js) here] scripts/deploy.js
```