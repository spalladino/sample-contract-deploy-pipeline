# Sample contract deployment pipeline

This is a proof of concept for a smart contract deployment pipeline using Github Actions. The pipeline is composed a set of build, test, deployment, verification, and post-deploy configurable Hardhat scripts.

## Example

The following release spec in a pull request from branch `release/1.3` will compile all contracts, run tests, deploy a new implementation for the `Box` contract, verify its source code and binary, and create a new proposal for upgrading it.

```yaml
title: Upgrade to v1.3
network: goerli
deploy: prepare-upgrade Box
verify: verify-deployed
finish: propose-upgrade
audited: f37fb0c75b4ec2c13e063d257499e7dcc643e468
description: |
  Upgrades Box contract to v1.3.
  Bumps version identifier in the contract.
```

The deployment workflow autogenerates a [summary](https://github.com/spalladino/sample-contract-deploy-pipeline/actions/runs/3559747788) with deployment info and relevant links. It will also alert if there is a diff in the contracts between the audited commit and the deployed one.

> ### Upgrade to v1.3
> 
> **Network:** goerli
> **Commit:** [`8aa72d2b03db9015dcb74f65515840677e23357a`](https://github.com/spalladino/test-hardhat-project/tree/> 8aa72d2b03db9015dcb74f65515840677e23357a)
> 
> Upgrades Box contract to v1.3.
> Bumps version identifier in the contract.
> 
> #### Audit
> 
> Audited contracts at commit [`f37fb0c75b4ec2c13e063d257499e7dcc643e468`](https://github.com/spalladino/> test-hardhat-project/tree/f37fb0c75b4ec2c13e063d257499e7dcc643e468) :detective:
> Contracts have been modified since audit :warning:
> 
> ```diff
> diff --git a/contracts/Box.sol b/contracts/Box.sol
> index 1fa3762..bfedd5d 100644
> --- a/contracts/Box.sol
> +++ b/contracts/Box.sol
> @@ -25,7 +25,7 @@ contract Box is Initializable, OwnableUpgradeable, UUPSUpgradeable {
>      }
>  
>      function version() external pure returns (string memory) {
> -      return "v3";
> +      return "v1.3.7";
>      }
>  
>      function _authorizeUpgrade(address newImplementation)
> ```
> 
> ### Implementation contracts deployed
> 
> - Box at [`0x02C0AE8e78843B8c5389b57077EBD26632206Fe0`](https://goerli.etherscan.io/address/> 0x02C0AE8e78843B8c5389b57077EBD26632206Fe0)

The upgrade proposal is created in OpenZeppelin Defender:

![Sample upgrade proposal](imgs/sample-proposal.png)

And includes bytecode verification to close the loop with the deployed artifact:

![Sample artifact verification](imgs/sample-artifact-verified.png)

## How to use

To trigger a new release, create a new folder with the version identifier `vX.Y(.Z)` in the `releases` folder, with an `index.yml` file with the spec of the release. This includes:

- `title`: Title of the release
- `description`: Description of what this release is about
- `network`: The network where to deploy, needs to be defined in the hardhat config file
- `audited`: Optional commit in which the code was audited, used to show the diff with the deployed version
- `deploy`: Deployment command to execute
- `verify`: Verification command to execute
- `finish`: Wrap-up command to execute

All commands are passed to `yarn hardhat`, so any hardhat task can be used. For simplicity, some tasks are already defined:

- `deploy-proxy CONTRACT ARG1 ARG2...`: Deploys a contract as upgradeable and initializes it with ARGs
- `prepare-upgrade CONTRACT1 CONTRACT2`: Deploys new implementations for all CONTRACTs
- `verify-deployed`: Reads deployed contracts and verifies [source code in Etherscan](https://etherscan.io/verifyContract) and [artifacts in Defender](https://docs.openzeppelin.com/defender/admin#bytecode-verification)
- `propose-upgrade`: Creates a [batch proposal](https://docs.openzeppelin.com/defender/admin#batches) to simultaneously upgrade all contracts via a multisig in Defender

Alternatively, custom scripts can be used by passing them through hardhat's `run` command. This allows for more complex deployment scripts to be run. See [v1.4/deploy.ts](releases/v1.4/deploy.ts) for an example.

Once the release is defined, create a pull request from the `release/X.Y(.Z)` branch into master. This will trigger the [release](.github/workflows/release.yml) workflow, that includes the build, test, deployment, verification, and post-deploy jobs.

