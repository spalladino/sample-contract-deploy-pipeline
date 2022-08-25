pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Base.sol";

contract Box is BaseContract, Ownable {
  address public who;

  constructor(uint256 value, address initialWho) BaseContract(value) {
    require(initialWho != address(0), "Who cannot be zero");
    who = initialWho;
  }
}

