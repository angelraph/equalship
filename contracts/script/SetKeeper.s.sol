// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";

interface IOwned {
    function owner() external view returns (address);
    function keeper() external view returns (address);
    function setKeeper(address) external;
}

/// Hands the keeper role to a separate low balance wallet.
/// forge script script/SetKeeper.s.sol --sig "run(address,address)" <EQUALSHIP> <KEEPER> --rpc-url $RPC --broadcast --interactive
contract SetKeeper is Script {
    function run(address ship, address newKeeper) external {
        vm.startBroadcast();
        (, address signer,) = vm.readCallers();
        console2.log("Signing wallet", signer);
        console2.log("Contract owner", IOwned(ship).owner());
        require(signer == IOwned(ship).owner(), "This key is not the owner wallet. Nothing was sent.");
        IOwned(ship).setKeeper(newKeeper);
        vm.stopBroadcast();
        console2.log("New keeper", newKeeper);
    }
}
