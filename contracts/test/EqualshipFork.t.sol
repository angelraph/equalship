// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {Equalship} from "../src/Equalship.sol";
import {IERC20, ISwapRouter02} from "../src/interfaces/IExternal.sol";
import {Addresses} from "../script/Addresses.sol";

interface IQuoter {
    function quoteExactInput(bytes memory path, uint256 amountIn)
        external
        returns (uint256 amountOut, uint160[] memory, uint32[] memory, uint256);
}

interface ISupply {
    function totalSupply() external view returns (uint256);
}

/// @notice Runs against Robinhood Chain mainnet state. Skipped unless ROBINHOOD_RPC_URL is set.
contract EqualshipForkTest is Test {
    Equalship ship;
    address ada = makeAddr("ada");
    address bo = makeAddr("bo");
    address keeper = makeAddr("keeper");
    IERC20 usdg = IERC20(Addresses.USDG);
    IERC20 wif = IERC20(Addresses.WIF);

    function setUp() public {
        string memory rpc = vm.envOr("ROBINHOOD_RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(rpc);
        ship = new Equalship(
            usdg, wif, Addresses.WETH, ISwapRouter02(Addresses.SWAP_ROUTER_02), keeper, 100, 10_000, 100
        );
        deal(Addresses.USDG, ada, 100e6);
        deal(Addresses.WIF, ada, 50_000e18);
        vm.deal(bo, 1 ether);
        vm.startPrank(ada);
        usdg.approve(address(ship), type(uint256).max);
        wif.approve(address(ship), type(uint256).max);
        vm.stopPrank();
    }

    function _legs() internal pure returns (Equalship.Leg[] memory legs) {
        legs = new Equalship.Leg[](2);
        legs[0] = Equalship.Leg(Addresses.NVDA, 5000, abi.encodePacked(Addresses.USDG, uint24(500), Addresses.NVDA));
        legs[1] = Equalship.Leg(Addresses.SPY, 5000, abi.encodePacked(Addresses.USDG, uint24(500), Addresses.SPY));
    }

    function _minOuts(uint256 contribution) internal returns (uint256[] memory mins) {
        Equalship.Leg[] memory legs = _legs();
        uint256 rest = contribution - (contribution * ship.feeBps()) / 10_000;
        uint256 half = (rest * 5000) / 10_000;
        mins = new uint256[](2);
        (uint256 q0,,,) = IQuoter(Addresses.QUOTER_V2).quoteExactInput(legs[0].path, half);
        (uint256 q1,,,) = IQuoter(Addresses.QUOTER_V2).quoteExactInput(legs[1].path, rest - half);
        mins[0] = (q0 * 9800) / 10_000;
        mins[1] = (q1 * 9800) / 10_000;
    }

    function test_fork_fullV2Loop() public {
        // a no-slash daily circle, 1 USDG per day, 5 WIF bond
        vm.prank(ada);
        uint256 id = ship.createCircle("Fork Circle", 1e6, 5e18, 1 days, 10, 0, _legs());

        // ada saves with USDG: real NVDA and SPY land in her wallet
        uint256[] memory mins = _minOuts(1e6);
        vm.prank(ada);
        ship.contribute(id, mins);
        assertGt(IERC20(Addresses.NVDA).balanceOf(ada), 0);
        assertGt(IERC20(Addresses.SPY).balanceOf(ada), 0);
        assertEq(IERC20(Addresses.NVDA).balanceOf(address(ship)), 0);

        // bo joins with ETH only: the bond is bought from the real $WIF pool
        (uint256 wifQuote,,,) = IQuoter(Addresses.QUOTER_V2).quoteExactInput(ship.ethToWif(), 0.002 ether);
        emit log_named_uint("WIF per 0.002 ETH", wifQuote);
        assertGt(wifQuote, 5e18, "0.002 ETH covers a 5 WIF bond");
        vm.prank(bo);
        ship.joinWithETH{value: 0.002 ether}(id, (wifQuote * 9500) / 10_000);
        assertEq(ship.getMember(id, bo).bondLeft, 5e18);
        assertGt(wif.balanceOf(bo), 0, "extra WIF refunded");

        // bo saves with ETH only
        (uint256 usdgQuote,,,) = IQuoter(Addresses.QUOTER_V2).quoteExactInput(ship.ethToUsdg(), 0.001 ether);
        emit log_named_uint("USDG per 0.001 ETH", usdgQuote);
        uint256[] memory minsBo = _minOuts(1e6);
        vm.prank(bo);
        ship.contributeWithETH{value: 0.001 ether}(id, 1e6, minsBo);
        assertGt(IERC20(Addresses.NVDA).balanceOf(bo), 0);
        assertEq(address(ship).balance, 0);

        // next day the keeper auto-saves for ada
        vm.prank(ada);
        ship.setAutoSave(id, true);
        vm.warp(block.timestamp + 1 days);
        uint256[] memory minsAuto = _minOuts(1e6);
        uint256 nvdaBefore = IERC20(Addresses.NVDA).balanceOf(ada);
        vm.prank(keeper);
        ship.contributeFor(id, ada, minsAuto);
        assertGt(IERC20(Addresses.NVDA).balanceOf(ada), nvdaBefore);
        assertEq(ship.getMember(id, ada).streak, 2);

        // the fee pool buys real WIF and burns it: total supply goes down
        uint256 supplyBefore = ISupply(Addresses.WIF).totalSupply();
        uint256 pool = ship.feePool();
        vm.prank(keeper);
        uint256 burned = ship.buyAndBurn(Addresses.BURN_PATH(), pool, 1);
        emit log_named_uint("WIF burned from fees", burned);
        assertEq(supplyBefore - ISupply(Addresses.WIF).totalSupply(), burned);

        // both leave and get their full bonds back
        uint256 adaWif = wif.balanceOf(ada);
        vm.prank(ada);
        ship.leave(id);
        assertEq(wif.balanceOf(ada) - adaWif, 5e18);
        uint256 boWif = wif.balanceOf(bo);
        vm.prank(bo);
        ship.leave(id);
        assertEq(wif.balanceOf(bo) - boWif, 5e18);
        assertEq(ship.totalBonded(), 0);
    }
}
