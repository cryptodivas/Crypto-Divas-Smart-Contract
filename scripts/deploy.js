const { ethers } = require("hardhat");

async function main() {

    const CD = await ethers.getContractFactory("CryptoDivas");
    // const CD = await ethers.getContractFactory("Treasury");

    //
    // const padded = ethers.utils.hexZeroPad("0x", 32)
    // console.log("padded = ",padded); // 0x0000000000000000000000000000000000000000000000000000000000000000

    const cd = await CD.deploy("ipfs://QmRsRcJucYGrSpgp5tWno9vEd9KXMhVFeJPFMsL1ujVKNJ","0xaf369ffdf2faa028ca323f2762fca38dc0425bace953978c2b4c293189ef66a1","0x9550dd40ed8c29bbbafe1744be53c905e3df8951c698dc529999fd17f45bcc04",1649668182, 100, 1000); 

    // const cd = await CD.attach("0xDF19f15c7DD76651186cC114a43938304D00a5AF");

    // await cd.withdrawAll();

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