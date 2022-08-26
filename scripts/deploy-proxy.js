const { ethers, upgrades } = require('hardhat');

async function main() {
  const owner = process.env.OWNER;
  const factory = await ethers.getContractFactory('Box');
  const instance = await upgrades.deployProxy(factory, [42, owner], { kind: 'uups' }).then(d => d.deployed());
  console.log(`Deployed Box at`, instance.address);
}

main().catch(console.error);