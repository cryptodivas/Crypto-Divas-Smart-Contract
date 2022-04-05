const ProjectName = artifacts.require("CryptoDivas");
const { expect, assert } = require("chai");
const { ethers, web3 } = require("hardhat");
const truffleAssert = require('truffle-assertions');
let list = require("./addressesAndTokens");

/* Uncomment after transferring AContract.sol and AContractImp721.sol from Helper contracts ==> contracts directory */
/* For the 'can transfer tokens to contract' test */
// const AContract = artifacts.require("AContract");
// const AContractImp721 = artifacts.require("AContractImp721");

describe("ProjectName Public Sale (Dutch Auction)", function () {

  let projectName, balance;
  let presaleConfig, dutchAuctionConfig, publicSaleConfig;
  let auctionPrice;
  let provider;
  let leftToMint;

  before(async function () {
    accounts = await web3.eth.getAccounts();
    projectName = await ProjectName.new("ipfs://QmezoosjRhhrEG1ZdZRMqD2orFFBGcy7cGe5ervyLxBUdF",
    "0xff", 100, 500);

    presaleConfig = await projectName.presaleConfig();
    dutchAuctionConfig = await projectName.dutchAuctionConfig();
    auctionPrice  = await projectName.getCurrentAuctionPrice();
    provider = ethers.getDefaultProvider();

    /* Uncomment for the 'can transfer tokens to contract' test  */
    // aContract = await AContract.new(); 
    // aContractImpl721 = await AContractImp721.new();

  });

  it("check name, symbol", async()=>{
    let name = await projectName.name();
    let symbol = await projectName.symbol();
    console.log("name =", name , " ,symbol = ",symbol);
  })

  it("auctions correctly", async()=>{

    let blockNumBefore = await web3.eth.getBlockNumber();
    let blockBefore = await web3.eth.getBlock(blockNumBefore);
    let timestampBefore = blockBefore.timestamp;

    await projectName.setPublicSaleActivation(true);

    await projectName.configureDutchAuction(timestampBefore + 10000, 60,
      ethers.utils.parseEther('0.0000001'), ethers.utils.parseEther('0.00000001'), ethers.utils.parseEther('0.000000001'));
    
    dutchAuctionConfig = await projectName.dutchAuctionConfig();
    let mintFee;
    let n; //number of nfts

    n=8;
    mintFee = (auctionPrice * n).toString();
 
    //sale not active
    await truffleAssert.reverts( projectName.buyPublic(n, {value: mintFee}));

    auctionPrice = await projectName.getCurrentAuctionPrice();
    assert.equal(auctionPrice, dutchAuctionConfig.startPrice.toString());

    await ethers.provider.send('evm_increaseTime', [10000]);
    await ethers.provider.send('evm_mine');
    
    auctionPrice  = await projectName.getCurrentAuctionPrice();
    mintFee = (auctionPrice * (n+1)).toString();

    await projectName.setPublicSaleActivation(false);

    try{
    await projectName.buyPublic(n, {value: mintFee});
    } catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with custom error 'PublicSaleDeactivated()'");
    }

    await projectName.setPublicSaleActivation(true);

    await truffleAssert.passes( projectName.buyPublic(n, {value: mintFee}));

    let owner = await projectName.ownerOf(n-1);
    assert.equal(owner, accounts[0]);

    try{
      await projectName.ownerOf(n+1);
    } catch(error){
      expect(error.message).to.equal("VM Exception while processing transaction: reverted with custom error 'OwnerQueryForNonexistentToken()'");
    }

    auctionPrice  = await projectName.getCurrentAuctionPrice();
    mintFee = (auctionPrice * n).toString();
    //insufficient payment
    await truffleAssert.reverts( projectName.buyPublic(n+1, {value: mintFee}));

    n = await projectName.MAX_SUPPLY();

    auctionPrice  = await projectName.getCurrentAuctionPrice();
    mintFee = (auctionPrice * n).toString();
    //supply maxed out
    await truffleAssert.reverts( projectName.buyPublic(n, {value: mintFee}));

    await ethers.provider.send('evm_increaseTime', [100000]);
    await ethers.provider.send('evm_mine');

    auctionPrice  = await projectName.getCurrentAuctionPrice();
    //Price remains at bottom price after reaching bottom price
    assert.equal(auctionPrice.toString() , dutchAuctionConfig.bottomPrice.toString());
  })

  it("rolls start index", async()=>{
    let n = await projectName.totalLeftToMint();
    leftToMint = n;

    while(n>0){
      if(n <= 400){
      auctionPrice  = await projectName.getCurrentAuctionPrice();
      mintFee = (auctionPrice * n).toString();
      await truffleAssert.passes( projectName.buyPublic(n, {value: mintFee}));
      console.log("transferred", n ," tokens to", accounts[0]);
      n = 0;
      } else{
        auctionPrice  = await projectName.getCurrentAuctionPrice();
        mintFee = (auctionPrice * 400).toString();
        await truffleAssert.passes( projectName.buyPublic(400, {value: mintFee}));
        console.log("transferred 400 tokens to", accounts[0]);
        n -=400;
      }
    }

    try{
      await projectName.randomizedStartIndex();
    }catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'All tokens are not yet minted'");
    }

    let left = await projectName.totalLeftToMint()
    auctionPrice  = await projectName.getCurrentAuctionPrice();
    mintFee = (auctionPrice * left).toString();

    try {
     await projectName.buyPublic(left, {value: mintFee});
    } catch(e) {
      // Should mint atleast 1 NFT
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Should mint atleast 1 NFT'");
    }

    let blockNumBefore = await web3.eth.getBlockNumber();
    let blockBefore = await web3.eth.getBlock(blockNumBefore);
    let timestampBefore = blockBefore.timestamp;

    await projectName.setNFTRevealTime(timestampBefore + 10000);

    try {
    await projectName.rollStartIndex();
    } catch(e) {
      // Roll index can be performed only after NFT Reveal time has passed
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'NFT Reveal time not reached yet'");
    }

    await ethers.provider.send('evm_increaseTime', [10000]);
    await ethers.provider.send('evm_mine');

    // NFT Reveal time has passed
    await truffleAssert.passes(projectName.setProvenance("0x33b5a37c7ad1c85013b61bf46c645ada6d26e0ff1675c773758e6c33564523bd"));
    await truffleAssert.passes( projectName.rollStartIndex());

    try{
      await projectName.setProvenance("0x33b5a37c7ad1c85013b61bf46c645ada6d26e0ff1675c773758e6c33564523bd");
    }catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Starting index already set'");
    }

    let startIndex = await projectName.randomizedStartIndex();
    console.log("randomized start index", startIndex.toNumber());

    try{
      await projectName.randomizedStartIndex();
    }catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Index already set'");
    }

  })

  
  it("token uri before setting base uri", async()=>{
    
    await projectName.setDummyURL('abcdefg');
    let dummyURI = await projectName.dummyURI();
    let tokenUri = await projectName.tokenURI(1);

    assert.equal(tokenUri, dummyURI);

  })

  it("sets correct base uri", async()=>{
    
    try{
      await projectName.setBaseURI("abcd")
    }catch(e){
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Doesn't match with the provenance hash'");
    }

    await truffleAssert.passes(await projectName.setBaseURI("ipfs://QmarLsVA3caLyS1WhwyPtpsunQJ7P1AgC4dxbmSbmz7N4s/json/"));
  })

  it("token uri after setting base uri", async()=>{
    
    await projectName.setDummyURL('abcdefg');
    let dummyURI = await projectName.dummyURI();
    let tokenUri = await projectName.tokenURI(1);

    assert.notEqual(tokenUri, dummyURI);
  })

  it("sets owners correctly after transferring tokens", async()=>{
    
    for(let i = 10; i<50; i += 10){
      await projectName.transferFrom(accounts[0], accounts[1], i);
    }

    for(let i = 50; i<=100; i += 10){
      await projectName.transferFrom(accounts[0],accounts[1], i);
    }

    for(let i = 1; i<= 100; i++){
      if(i%10 == 0) {
        owner = await projectName.ownerOf(i);
        assert.equal(owner, accounts[1]);
        continue
      }

      owner = await projectName.ownerOf(i);
      assert.equal(owner, accounts[0]);
    }
  })

  it("can batch transfer", async() =>{
    await projectName.batchTransfer(list.addresses10, [1,2,3,4,5,6,7,8,9,11]);
  })

  it("supports ERC2981", async()=>{
    let check = await projectName.supportsInterface("0x2a55205a"); // IERC2981
    assert.equal(check, true);

    check = await projectName.supportsInterface("0x80ac58cd");  //IERC721
    assert.equal(check, true);
  })

  it("can approve and transfer tokens", async()=>{
    // let theion = await projectName.ownerOf(15);
    // console.log("owner of 15=",theion);
    // console.log("accounts[0]=",accounts[0]);

    await projectName.approve(accounts[2], 17);
    await projectName.transferFrom(accounts[0], accounts[3], 17, {from:accounts[2]});
    let owner = await projectName.ownerOf(17);
    assert.equal(owner, accounts[3]);

    await projectName.setApprovalForAll(accounts[2], true); // from accounts[0] (owner)
    await projectName.transferFrom(accounts[0], accounts[3], 59, {from:accounts[2]});
    owner = await projectName.ownerOf(59);
    assert.equal(owner, accounts[3]);

  })

  it("can burn tokens", async()=>{

    try{
      await projectName.burn(17, {from:accounts[2]});
    } catch(e){  
      expect(e.message).to.equal("VM Exception while processing transaction: reverted with custom error 'TransferCallerNotOwnerNorApproved()'");
    }

    await projectName.burn(17, {from:accounts[3]});

    // await projectName.burn(59, {from:accounts[1]});
    await projectName.approve(accounts[2], 59, {from:accounts[3]});

    await truffleAssert.passes( projectName.burn(59, {from:accounts[2]}));

    let numberBurned = await projectName._numberBurned(accounts[3]);
    assert.equal(numberBurned, 2);

    numberBurned = await projectName._numberBurned(accounts[2]);
    assert.equal(numberBurned, 0);

    let numberMinted = await projectName._numberMinted(accounts[2]);
    assert.equal(numberMinted, 0);

  })

  /* Uncomment after uncommenting AContract and AContractImpl721 on line 3,4*/

  // it("can transfer tokens to contract", async()=>{

  //   try{
  //     await projectName.safeTransferFrom(accounts[0], aContract.address, 18, "0xff");
  //   } catch(e){
  //     expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'ERC721: transfer to non ERC721Receiver implementer'");
  //   }

  //   await projectName.safeTransferFrom(accounts[0], aContractImpl721.address, 18, "0xff");

    
  //   let totalMinted = await projectName._totalMinted();
  //   assert.equal(totalMinted,500);
  // })

})