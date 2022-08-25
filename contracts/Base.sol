pragma solidity ^0.8.0;

contract BaseContract {
  uint256 immutable base;

  constructor(uint256 value) {
    base = value;
  }

  function getBaseValue() public view returns (uint256) {
    return base;
  }
}