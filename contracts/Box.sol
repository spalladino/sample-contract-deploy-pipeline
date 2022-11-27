// SPDX-License-Identifier: WTFPL
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Box is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 initialValue, address initialOwner) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _transferOwnership(initialOwner);
        value = initialValue;
    }

    function setValue(uint256 newValue) external {
      value = newValue;
    }

    function version() external pure returns (string memory) {
      return "v1.3.7";
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

}