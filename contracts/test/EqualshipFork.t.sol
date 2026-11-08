// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {Equalship} from "../src/Equalship.sol";
import {IERC20, ISwapRouter02} from "../src/interfaces/IExternal.sol";
import {Addresses} from "../script/Addresses.sol";

/// @notice Runs against Robinhood Chain mainnet state. Skipped unless ROBINHOOD_RPC_URL is set.
contract EqualshipForkTest is Test {
    Equalship ship;
    address ada = makeAddr("ada");
    address keeper = makeAddr("keeper");

    function setUp() public {
        string memory rpc = vm.envOr("ROBINHOOD_RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(rpc);
        ship = new Equalship(
            IERC20(Addresses.USDG),
            IERC20(Addresses.WIF),
            ISwapRouter02(Addresses.SWAP_ROUTER_02),
            keeper,
            100
        );
        deal(Addresses.USDG, ada, 100e6);
        deal(Addresses.WIF, ada, 50_000e18);
        vm.startPrank(ada);
        IERC20(Addresses.USDG).approve(address(ship), type(uint256).max);
        IERC20(Addresses.WIF).approve(address(ship), type(uint256).max);
        vm.stopPrank();
    }

    function test_fork_contributeBuysRealStockTokens() public {
        Equalship.Leg[] memory legs = new Equalship.Leg[](2);
        legs[0] = Equalship.Leg(
            Addresses.NVDA, 5000, abi.encodePacked(Addresses.USDG, uint24(500), Addresses.NVDA)
        );
        legs[1] =
            Equalship.Leg(Addresses.SPY, 5000, abi.encodePacked(Addresses.USDG, uint24(500), Addresses.SPY));

        vm.prank(ada);
        uint256 id = ship.createCircle("Fork Circle", 20e6, 1000e18, 1 days, 10, 2500, legs);

        uint256[] memory mins = new uint256[](2);
        vm.prank(ada);
        ship.contribute(id, mins);

        uint256 nvda = IERC20(Addresses.NVDA).balanceOf(ada);
        uint256 spy = IERC20(Addresses.SPY).balanceOf(ada);
        emit log_named_uint("NVDA received (1e18)", nvda);
        emit log_named_uint("SPY received (1e18)", spy);
        assertGt(nvda, 0);
        assertGt(spy, 0);
        assertEq(IERC20(Addresses.NVDA).balanceOf(address(ship)), 0);
        assertEq(ship.feePool(), 0.2e6);

        vm.prank(keeper);
        uint256 burned = ship.buyAndBurn(Addresses.BURN_PATH(), 0.2e6, 1);
        emit log_named_uint("WIF burned (1e18)", burned);
        assertGt(burned, 0);
    }
}
