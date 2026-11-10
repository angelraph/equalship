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

/// @notice Creates the flagship circle on a deployed Equalship and makes the first save, paid in ETH.
/// forge script script/DemoCircle.s.sol --sig "run(address)" <EQUALSHIP> --rpc-url <RPC> --broadcast --interactive
/// Defaults are safe for the creator's money: a daily period, no slashing (the bond always comes back in
/// full on leave), a 5 WIF bond and a 1 USDG save.
/// Optional env: CONTRIBUTION (USDG, 6 decimals), BOND (WIF, 18 decimals), PERIOD (seconds), SLASH_BPS.
contract DemoCircle is Script {
    function run(address shipAddress) external returns (uint256 circleId) {
        Equalship ship = Equalship(shipAddress);
        uint128 contribution = uint128(vm.envOr("CONTRIBUTION", uint256(1e6)));
        uint128 bond = uint128(vm.envOr("BOND", uint256(5e18)));
        uint32 period = uint32(vm.envOr("PERIOD", uint256(1 days)));
        uint16 slashBps = uint16(vm.envOr("SLASH_BPS", uint256(0)));

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

        // ETH needed for the save: enough for the contribution plus 5%, the extra USDG is refunded.
        (uint256 usdgPerMilliEth,,,) = IQuoterV2(Addresses.QUOTER_V2).quoteExactInput(ship.ethToUsdg(), 1e15);
        uint256 ethIn = (uint256(contribution) * 105 * 1e15) / (100 * usdgPerMilliEth);
        console2.log("ETH for the first save (wei)", ethIn);

        vm.startBroadcast();
        IERC20(Addresses.WIF).approve(address(ship), bond);
        circleId = ship.createCircle("WIF Holders Savings Circle", contribution, bond, period, 50, slashBps, legs);
        ship.contributeWithETH{value: ethIn}(circleId, contribution, minOuts);
        vm.stopBroadcast();

        console2.log("Flagship circle id", circleId);
    }
}
