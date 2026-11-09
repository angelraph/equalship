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

/// @notice Runs the rest of the flywheel on a live circle: buyback and burn, a basket proposal and a burn vote.
/// forge script script/DemoActions.s.sol --sig "run(address,uint256)" <EQUALSHIP> <CIRCLE_ID> --rpc-url <RPC> --broadcast --interactive
/// The signer must be the keeper (for the burn) and a member of the circle (for the proposal and vote).
/// Optional env: VOTE_WIF (18 decimals, default 1 WIF), SLASH (address of a member with missed periods).
contract DemoActions is Script {
    function run(address shipAddress, uint256 circleId) external {
        Equalship ship = Equalship(shipAddress);
        uint256 voteWif = vm.envOr("VOTE_WIF", uint256(1e18));
        address slashMember = vm.envOr("SLASH", address(0));

        // quote the burn locally before broadcasting
        uint256 pool = ship.feePool();
        uint256 minOut;
        if (pool > 0) {
            (uint256 q,,,) = IQuoterV2(Addresses.QUOTER_V2).quoteExactInput(Addresses.BURN_PATH(), pool);
            minOut = (q * 9500) / 10_000;
        }

        Equalship.Leg[] memory legs = new Equalship.Leg[](2);
        legs[0] = Equalship.Leg(Addresses.SPY, 5000, abi.encodePacked(Addresses.USDG, uint24(500), Addresses.SPY));
        legs[1] = Equalship.Leg(Addresses.QQQ, 5000, abi.encodePacked(Addresses.USDG, uint24(500), Addresses.QQQ));

        vm.startBroadcast();
        if (pool > 0) {
            uint256 burned = ship.buyAndBurn(Addresses.BURN_PATH(), pool, minOut);
            console2.log("WIF burned from fees", burned);
        }
        if (slashMember != address(0)) {
            ship.slash(circleId, slashMember);
            console2.log("slash applied");
        }
        uint256 pid = ship.proposeBasket(circleId, legs);
        IERC20(Addresses.WIF).approve(address(ship), voteWif);
        ship.vote(circleId, pid, true, voteWif);
        vm.stopBroadcast();
        console2.log("proposal", pid);
    }
}
