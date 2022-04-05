const { ethers } = require("hardhat");
const hre = require("hardhat");
let secret = require("../secret");
let data = require("../test/addressesAndTokens");

async function main() {

    const CD = await hre.ethers.getContractFactory("CryptoDivas");
    const cd = await CD.deploy("ipfs://ipfshash","0xprovenancehash", 100, 10000); 

    // await cd.setMerkleRoot("0xe07a37777568d45b24e801eff1ce0ed74408e8ede20266105543c8929bce161f");

    await cd.deployed();
    console.log("Deployed to : ", cd.address);

  }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });