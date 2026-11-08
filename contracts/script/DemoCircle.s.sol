// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {Equalship} from "../src/Equalship.sol";
import {IERC20} from "../src/interfaces/IExternal.sol";
import {Addresses} from "./Addresses.sol";

interface IQuoterV2 {
    function quoteExactInput(bytes memory path, uint256 amountIn)
        external
        returns (uint256 amountOut, uint160[] memory, uint32[] memory, uint256);
}

/// @notice Creates a demo circle on a deployed Equalship and makes the first save.
/// forge script script/DemoCircle.s.sol --rpc-url robinhood --broadcast
/// Needs PRIVATE_KEY and EQUALSHIP. Optional: CONTRIBUTION (USDG, 6 decimals, default 1 USDG),
/// BOND (WIF, 18 decimals, default 1000 WIF), PERIOD (seconds, default 3600).
contract DemoCircle is Script {
    function run() external returns (uint256 circleId) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        Equalship ship = Equalship(vm.envAddress("EQUALSHIP"));
        uint128 contribution = uint128(vm.envOr("CONTRIBUTION", uint256(1e6)));
        uint128 bond = uint128(vm.envOr("BOND", uint256(1000e18)));
        uint32 period = uint32(vm.envOr("PERIOD", uint256(3600)));

        Equalship.Leg[] memory legs = new Equalship.Leg[](2);
        legs[0] = Equalship.Leg(Addresses.NVDA, 5000, abi.encodePacked(Addresses.USDG, uint24(500), Addresses.NVDA));
        legs[1] = Equalship.Leg(Addresses.SPY, 5000, abi.encodePacked(Addresses.USDG, uint24(500), Addresses.SPY));

        // Quotes run as local simulation only, before broadcasting starts.
        uint256 rest = contribution - (uint256(contribution) * ship.feeBps()) / 10_000;
        uint256[] memory minOuts = new uint256[](2);
        uint256 half = (rest * 5000) / 10_000;
        (uint256 q0,,,) = IQuoterV2(Addresses.QUOTER_V2).quoteExactInput(legs[0].path, half);
        (uint256 q1,,,) = IQuoterV2(Addresses.QUOTER_V2).quoteExactInput(legs[1].path, rest - half);
        minOuts[0] = (q0 * 9800) / 10_000;
        minOuts[1] = (q1 * 9800) / 10_000;

        vm.startBroadcast(pk);
        IERC20(Addresses.WIF).approve(address(ship), bond);
        IERC20(Addresses.USDG).approve(address(ship), contribution);
        circleId = ship.createCircle("Equalship Demo", contribution, bond, period, 20, 2500, legs);
        ship.contribute(circleId, minOuts);
        vm.stopBroadcast();

        console2.log("Demo circle id", circleId);
    }
}
