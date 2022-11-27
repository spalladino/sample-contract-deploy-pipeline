// SPDX-License-Identifier: WTFPL
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Greeter is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    string internal greeting;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory initialGreeting, address initialOwner) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _transferOwnership(initialOwner);
        greeting = initialGreeting;
    }

    function setGreeting(string memory newValue) external onlyOwner {
      greeting = newValue;
    }

    function version() external pure returns (string memory) {
      return "v1.4.0";
    }

    function greet() external view returns (string memory) {
      return greeting;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

}