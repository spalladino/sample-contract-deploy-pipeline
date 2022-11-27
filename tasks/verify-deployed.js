const { execSync } = require('child_process');
const { getReleaseDeploys } = require('./utils');

async function main(args, hre) {
  const workflowUrl = args.referenceUrl || process.env.ARTIFACT_REFERENCE_URL || execSync(`git config --get remote.origin.url`).toString().trim();
  const deployed = getReleaseDeploys() || {};
  
  const { defender } = hre;
  const errs = [];

  // On Etherscan, we verify the proxy address, since the Defender upgrades plugin
  // will automatically verify both proxy and implementation. However, if we only
  // deployed an implementation, we want to verify it as well.
  for (const [name, { address, implementation }] of Object.entries(deployed)) {
    const addressToVerify = address || implementation;
    console.error(`\nVerifying source for ${name} at ${addressToVerify} on Etherscan`);
    try {
      await hre.run("verify:verify", { address: addressToVerify, noCompile: true });
    } catch(err) {
      if (err.message === 'Contract source code already verified') {
        console.error(`Source code already verified`);
      } else {
        console.error(`Error verifying source code: ${err.message}`);
        errs.push([name, err]);
      }
    }
  }

  // On Defender, we only care about implementation contracts for verifying bytecode.
  for (const [name, { address, implementation }] of Object.entries(deployed)) {
    const addressToVerify = implementation || address;
    console.error(`\nVerifying artifact for ${name} at ${addressToVerify} on Defender`);
    try {
      const response = await defender.verifyDeployment(addressToVerify, name, workflowUrl);
      console.error(`Bytecode match for ${name} is ${response.matchType}`);
    } catch (err) {
      console.error(`Error verifying artifact: ${err.message}`);
      errs.push([name, err]);
    }
  }

  if (errs.length > 0) {
    throw new Error(`Some verifications failed:\n${errs.map(([name, err]) => `${name}: ${err.message}`)}`);
  }
}

task('verify-deployed')
  .addOptionalParam('referenceUrl', 'URL to link to for artifact verification (defaults to $ARTIFACT_REFERENCE_URL the remote.origin.url of the repository)')
  .setDescription('Verifies deployed implementations in Etherscan and Defender')
  .setAction(main);