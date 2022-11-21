const { expect } = require("chai");

describe("Box", function () {
  it("sets value at initialization", async function () {
    const [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('Box');
    const box = await upgrades.deployProxy(factory, [42, owner.address], { kind: 'uups' }).then(d => d.deployed());
    
    expect(await box.value().then(v => v.toNumber())).to.equal(42);
  });
});
