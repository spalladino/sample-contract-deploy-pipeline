const { readFileSync, writeFileSync, existsSync } = require('fs');

const RELEASE_PATH = process.env.RELEASE_PATH;
const DEPLOYED_PATH = RELEASE_PATH ? `${RELEASE_PATH}/deployed.json` : null;
const RELEASE_INFO_PATH = RELEASE_PATH ? `${RELEASE_PATH}/info.yml` : null;
const ADDRESS_BOOK_PATH = `addresses.json`;

function getContractInfo(chainId, contract) {
  const addressBook = JSON.parse(readFileSync(ADDRESS_BOOK_PATH));
  const info = (addressBook[chainId] || {})[contract];
  if (!info) throw new Error(`Could not find info for ${contract} on chain ${chainId}`);
  return info;
}

function getReleaseDeploys() {
  if (DEPLOYED_PATH) {
    return JSON.parse(readFileSync(DEPLOYED_PATH));
  }
}

function getReleaseInfo() {
  if (RELEASE_INFO_PATH) {
    return yaml.parse(readFileSync(RELEASE_INFO_PATH).toString());
  }
}

function writeDeploy(chainId, name, data) {
  if (DEPLOYED_PATH) {
    const deployed = existsSync(DEPLOYED_PATH) ? JSON.parse(readFileSync(DEPLOYED_PATH)) : {};
    deployed[name] = { ...deployed[name], ... data };
    writeFileSync(DEPLOYED_PATH, JSON.stringify(deployed, null, 2));
  }

  if (ADDRESS_BOOK_PATH) {
    const addressBook = JSON.parse(readFileSync(ADDRESS_BOOK_PATH));
    if (!addressBook[chainId]) addressBook[chainId] = {};
    addressBook[chainId][name] = { ...addressBook[chainId][name], ...data };
    writeFileSync(ADDRESS_BOOK_PATH, JSON.stringify(addressBook, null, 2));
  }
}

module.exports = {
  writeDeploy,
  getContractInfo,
  getReleaseDeploys,
  getReleaseInfo,
};