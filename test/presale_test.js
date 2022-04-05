const { expect, assert } = require("chai");
const { ethers, web3 } = require("hardhat");
const truffleAssert = require('truffle-assertions');
const {MerkleTree} = require('merkletreejs');
const keccak256 = require('keccak256');
let reserveList = require("./addressesAndTokens");

describe("projectName Presale", function () {
  
  let projectName, totalSupply;
  let presaleConfig, dutchAuctionConfig, publicSaleConfig;
  let auctionPrice;
  let provider;
  let addr4,addr2,addr3;
  let claimingAddress, hexProof, leafNodes, merkleTree, upperlimit;

  before(async function () {

    let ProjectName = await ethers.getContractFactory("CryptoDivas");  
    projectName = await ProjectName.deploy("ipfs://QmezoosjRhhrEG1ZdZRMqD2orFFBGcy7cGe5ervyLxBUdF",
    "0x1abbd2457d497fb5054bf780aba3e67de04596e7c6ddec13afbbd57654e74a8f", 100, 9999);

    [owner, addr2, addr3, addr4] = await ethers.getSigners();
    upperlimit = 4000;
    let whitelistAddresses = 
      [addr4.address, "3",
      addr2.address, "2" ,
      addr3.address, upperlimit.toString() ];

    leafNodes = whitelistAddresses.map(addr => keccak256(addr));
    merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs: true});

    const rootHash = merkleTree.getRoot();
    rootString = rootHash.toString('hex');
    console.log("root =", rootString);

    await projectName.setMerkleRoot('0x'+rootString);

    presaleConfig = await projectName.presaleConfig();
    dutchAuctionConfig = await projectName.dutchAuctionConfig();
    totalSupply = await projectName.MAX_SUPPLY();
  });

  it("owner can reserve", async()=>{

    await projectName.connect(owner).reserve(reserveList.addresses , reserveList.tokens);

    let balance = await projectName.balanceOf(reserveList.addresses[0]);
    
    assert.equal(balance , 100);
  })

  it("supports ERC2981", async () => {
    await projectName.supportsInterface("0x2a55205a").then( res =>{
      assert(res, true);
    });
  })

  it("presales correctly", async()=>{

    let blockNumBefore = await web3.eth.getBlockNumber();
    let blockBefore = await web3.eth.getBlock(blockNumBefore);
    let timestampBefore = blockBefore.timestamp;

    let n;
    n = await projectName.MAX_SUPPLY();
    let supplyLimit = (n/2);
    
    await projectName.configurePresale(timestampBefore + 10000, timestampBefore + 20000,
      ethers.utils.parseEther('0.001'), 4050);

    presaleConfig = await projectName.presaleConfig();
    let mintFee = (presaleConfig.mintPrice).toString();

    claimingAddress = keccak256(addr2.address);
    hexProof = merkleTree.getHexProof(claimingAddress);
    console.log("hexProof =",hexProof);
    await projectName.setPresaleActivation(true);

    // Presale not active
    try{
      await projectName.connect(addr2).buyPresale(hexProof, 1, {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Presale not active'");
    }

    await ethers.provider.send('evm_increaseTime', [10000]);
    await ethers.provider.send('evm_mine');

    console.log("hexProof",hexProof);

    await projectName.setPresaleActivation(false);

    try{
      await projectName.connect(addr2).buyPresale(hexProof, 1, {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with custom error 'PresaleDeactivated()'");
    }

    await projectName.setPresaleActivation(true);
    
    await truffleAssert.passes( projectName.connect(addr2).buyPresale( hexProof, 1, {value: mintFee}));

    try{
      // Other user can't use the previous signature
      await projectName.connect(addr4).buyPresale( hexProof, 1 , {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with custom error 'InvalidProof()'");
    }

    claimingAddress = keccak256(addr4.address);
    hexProof = merkleTree.getHexProof(claimingAddress);
    
    try{
      // Invalid signature
      await projectName.connect(addr2).buyPresale( hexProof, 1, {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with custom error 'InvalidProof()'");
    }

    claimingAddress = keccak256(addr2.address);
    hexProof = merkleTree.getHexProof(claimingAddress);

    try{
      // Invalid signature
      await projectName.connect(addr2).buyPresale( hexProof, 0, {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Should mint atleast 1 NFT'");
    }

    let lowerMintFee = (presaleConfig.mintPrice - 1).toString()
    try{
      await projectName.connect(addr2).buyPresale( hexProof, 1, {value: lowerMintFee});
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Incorrect ETH provided'");
    }

    await truffleAssert.passes( projectName.connect(addr2).buyPresale( hexProof, 1, {value: mintFee}));
    
    mintFee = (presaleConfig.mintPrice*2).toString();
    try{
      // Mint limit exceeded
      await projectName.connect(addr2).buyPresale( hexProof, 2 , {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Mint limit exceeded'");
    }

    try{
      // Total Supply limit reached
      await projectName.connect(addr2).buyPresale( hexProof, totalSupply+1, {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with custom error 'InvalidLimit()'");
    }

    try{
      // Presale Supply limit reached
      await projectName.connect(addr2).buyPresale( hexProof, presaleConfig.supplyLimit+1 , {value: mintFee})
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with custom error 'InvalidLimit()'");
    }

    n = 4000;
    claimingAddress = keccak256(addr3.address);
    hexProof = merkleTree.getHexProof(claimingAddress);

    await projectName.setWhitelistUpperLimit(upperlimit);

    mintFee = (presaleConfig.mintPrice*n).toString();
    await truffleAssert.passes( projectName.connect(addr3).buyPresale( hexProof, upperlimit, {value: mintFee}));

  })

  it("mint tokens by owner", async () => {

    let remaining = await projectName.totalLeftToMint();

    try{
    await projectName.connect(addr2).mintTokensOwner(remaining);
    } catch(error) {
      expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
    }

    await truffleAssert.passes( projectName.mintTokensOwner(remaining));
  })

  // it("gets tokens owner by user", async () =>{
  //   let tokensList = await projectName.tokensOwnedBy(addr2.address);
  //   console.log("List of tokens owned by id:");
  //   for(let i=0 ; i< tokensList.length; i++){
  //     console.log(tokensList[i].toNumber());
  //   }
  // })

  // it("gets total left to mint", async () =>{
  //   let tokenLeft = await projectName.totalLeftToMint();
  //   assert.equal(tokenLeft, 9497);
  // })

})