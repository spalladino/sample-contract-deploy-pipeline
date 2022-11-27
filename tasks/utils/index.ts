import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';

const RELEASE_PATH = process.env.RELEASE_PATH;
const DEPLOYED_PATH = RELEASE_PATH ? `${RELEASE_PATH}/deployed.json` : null;
const RELEASE_INFO_PATH = RELEASE_PATH ? `${RELEASE_PATH}/index.yml` : null;
const ADDRESS_BOOK_PATH = `addresses.json`;

export type ContractDeploymentInfo = {
  address: string;
  implementation?: string;
}

export function getAddressBookEntry(chainId: number, contract: string): ContractDeploymentInfo {
  const addressBook = JSON.parse(readFileSync(ADDRESS_BOOK_PATH).toString());
  const info = (addressBook[chainId] || {})[contract];
  if (!info) throw new Error(`Could not find info for ${contract} on chain ${chainId}`);
  return info;
}

export function getReleaseDeploys(): Record<string, ContractDeploymentInfo> | undefined {
  if (DEPLOYED_PATH) {
    return JSON.parse(readFileSync(DEPLOYED_PATH).toString());
  }
}

export function getReleaseInfo() {
  if (RELEASE_INFO_PATH) {
    return parseYaml(readFileSync(RELEASE_INFO_PATH).toString());
  }
}

export function writeDeploy(chainId: number, name: string, data: Partial<ContractDeploymentInfo>) {
  if (DEPLOYED_PATH) {
    const deployed = existsSync(DEPLOYED_PATH) ? JSON.parse(readFileSync(DEPLOYED_PATH).toString()) : {};
    deployed[name] = { ...deployed[name], ... data };
    writeFileSync(DEPLOYED_PATH, JSON.stringify(deployed, null, 2));
  }

  if (ADDRESS_BOOK_PATH) {
    const addressBook = JSON.parse(readFileSync(ADDRESS_BOOK_PATH).toString());
    if (!addressBook[chainId]) addressBook[chainId] = {};
    addressBook[chainId][name] = { ...addressBook[chainId][name], ...data };
    writeFileSync(ADDRESS_BOOK_PATH, JSON.stringify(addressBook, null, 2));
  }
}
