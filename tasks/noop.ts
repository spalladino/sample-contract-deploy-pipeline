import { task } from 'hardhat/config';

task('noop')
  .setDescription('No action')
  .setAction(() => Promise.resolve());