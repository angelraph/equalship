// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {Equalship} from "../src/Equalship.sol";
import {IERC20, ISwapRouter02} from "../src/interfaces/IExternal.sol";
import {Addresses} from "./Addresses.sol";

/// @notice forge script script/Deploy.s.sol --rpc-url <RPC> --broadcast --interactive
/// Forge asks for the deployer key. KEEPER defaults to the deployer. FEE_BPS defaults to 100 (1%).
contract Deploy is Script {
    function run() external returns (Equalship ship) {
        vm.startBroadcast();
        (, address deployer,) = vm.readCallers();
        address keeper = vm.envOr("KEEPER", deployer);
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(100)));

        ship = new Equalship(
            IERC20(Addresses.USDG),
            IERC20(Addresses.WIF),
            ISwapRouter02(Addresses.SWAP_ROUTER_02),
            keeper,
            feeBps
        );
        vm.stopBroadcast();

        console2.log("Equalship deployed at", address(ship));
    }
}
