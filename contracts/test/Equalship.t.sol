// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {Equalship} from "../src/Equalship.sol";
import {IERC20, ISwapRouter02} from "../src/interfaces/IExternal.sol";
import {MockToken, MockRouter} from "./mocks/Mocks.sol";

contract EqualshipTest is Test {
    Equalship ship;
    MockToken usdg;
    MockToken wif;
    MockToken weth;
    MockToken nvda;
    MockToken spy;
    MockRouter router;

    address keeper = makeAddr("keeper");
    address ada = makeAddr("ada");
    address bo = makeAddr("bo");
    address cy = makeAddr("cy");

    uint128 constant CONTRIB = 10e6; // 10 USDG
    uint128 constant BOND = 1000e18; // 1000 WIF
    uint32 constant PERIOD = 1 days;
    uint256 constant GRACE = PERIOD / 4;

    function setUp() public {
        usdg = new MockToken("USDG", "USDG", 6);
        wif = new MockToken("World is Flat", "WIF", 18);
        weth = new MockToken("WETH", "WETH", 18);
        nvda = new MockToken("NVDA", "NVDA", 18);
        spy = new MockToken("SPY", "SPY", 18);
        router = new MockRouter(address(weth));
        ship = new Equalship(
            IERC20(address(usdg)),
            IERC20(address(wif)),
            address(weth),
            ISwapRouter02(address(router)),
            keeper,
            100,
            10_000,
            100
        );

        address[3] memory people = [ada, bo, cy];
        for (uint256 i; i < 3; ++i) {
            usdg.mint(people[i], 1000e6);
            wif.mint(people[i], 100_000e18);
            vm.deal(people[i], 10 ether);
            vm.startPrank(people[i]);
            usdg.approve(address(ship), type(uint256).max);
            wif.approve(address(ship), type(uint256).max);
            vm.stopPrank();
        }
    }

    // helpers

    function _path(address tokenOut) internal view returns (bytes memory) {
        return abi.encodePacked(address(usdg), uint24(500), tokenOut);
    }

    function _basket() internal view returns (Equalship.Leg[] memory legs) {
        legs = new Equalship.Leg[](2);
        legs[0] = Equalship.Leg(address(nvda), 6000, _path(address(nvda)));
        legs[1] = Equalship.Leg(address(spy), 4000, _path(address(spy)));
    }

    function _create(uint16 slashBps) internal returns (uint256 id) {
        vm.prank(ada);
        id = ship.createCircle("Lagos Builders", CONTRIB, BOND, PERIOD, 10, slashBps, _basket());
        vm.prank(bo);
        ship.join(id);
        vm.prank(cy);
        ship.join(id);
    }

    function _pay(address who, uint256 id) internal {
        uint256[] memory mins = new uint256[](2);
        vm.prank(who);
        ship.contribute(id, mins);
    }

    // basics

    function test_createAndJoin() public {
        uint256 id = _create(2500);
        (Equalship.Circle memory c, Equalship.Leg[] memory legs) = ship.getCircle(id);
        assertEq(c.memberCount, 3);
        assertEq(legs.length, 2);
        assertEq(wif.balanceOf(address(ship)), 3 * uint256(BOND));
        assertEq(ship.totalBonded(), 3 * uint256(BOND));
    }

    function test_contributeBuysIntoMemberWallet() public {
        uint256 id = _create(2500);
        _pay(ada, id);
        assertEq(ship.feePool(), 0.1e6);
        assertEq(nvda.balanceOf(ada), 5.94e6);
        assertEq(spy.balanceOf(ada), 3.96e6);
        assertEq(nvda.balanceOf(address(ship)), 0);
        assertEq(usdg.balanceOf(address(ship)), 0.1e6); // only the fee pool stays
        assertEq(ship.getMember(id, ada).streak, 1);
    }

    function test_cannotPayTwiceInOnePeriod() public {
        uint256 id = _create(2500);
        _pay(ada, id);
        uint256[] memory mins = new uint256[](2);
        vm.prank(ada);
        vm.expectRevert(Equalship.AlreadyPaid.selector);
        ship.contribute(id, mins);
    }

    function test_streakGrowsAcrossPeriods() public {
        uint256 id = _create(2500);
        for (uint256 i; i < 4; ++i) {
            _pay(ada, id);
            vm.warp(block.timestamp + PERIOD);
        }
        assertEq(ship.getMember(id, ada).streak, 4);
        assertTrue(ship.isCommitted(ada, 4, 4, 2 days));
        assertFalse(ship.isCommitted(bo, 1, 1, 2 days));
    }

    // grace window

    function test_lateSaveWithinGraceKeepsStreak() public {
        uint256 id = _create(2500);
        _pay(ada, id); // period 0
        // period 1 closes, ada saves an hour into period 2: still within the 6 hour grace
        vm.warp(block.timestamp + 2 * PERIOD + 1 hours);
        assertEq(ship.missedPeriods(id, ada), 0);
        _pay(ada, id); // pays period 1 late
        _pay(ada, id); // pays period 2
        Equalship.Member memory m = ship.getMember(id, ada);
        assertEq(m.streak, 3);
        assertEq(m.missedCount, 0);
        assertEq(m.bondLeft, BOND);
    }

    function test_missPastGraceIsSettled() public {
        uint256 id = _create(2500);
        _pay(cy, id); // period 0
        vm.warp(block.timestamp + 2 * PERIOD + GRACE + 1); // period 1 is past its grace
        assertEq(ship.missedPeriods(id, cy), 1);
        uint256 supplyBefore = wif.totalSupply();
        ship.slash(id, cy);
        uint256 penalty = (uint256(BOND) * 2500) / 10_000;
        assertEq(ship.getMember(id, cy).bondLeft, BOND - penalty);
        assertEq(supplyBefore - wif.totalSupply(), penalty / 2, "half really burned");
        assertEq(ship.pendingReward(id, ada), penalty / 4);
        assertEq(ship.pendingReward(id, bo), penalty / 4);
        assertEq(ship.burnedFromSlashes(), penalty / 2);
    }

    // custody guarantees

    function test_noSlashCircleNeverTakesTheBond() public {
        uint256 id = _create(0);
        vm.warp(block.timestamp + 30 * PERIOD); // a month of missed periods
        ship.slash(id, cy);
        Equalship.Member memory m = ship.getMember(id, cy);
        assertEq(m.bondLeft, BOND);
        assertEq(m.streak, 0);
        assertTrue(m.active);
        uint256 before = wif.balanceOf(cy);
        vm.prank(cy);
        ship.leave(id);
        assertEq(wif.balanceOf(cy) - before, BOND, "full bond back");
    }

    function test_leaveAnyTimeReturnsFullBondWhenNothingMissed() public {
        uint256 id = _create(2500);
        _pay(bo, id);
        vm.warp(block.timestamp + 3 hours);
        uint256 before = wif.balanceOf(bo);
        vm.prank(bo);
        ship.leave(id);
        assertEq(wif.balanceOf(bo) - before, BOND);
        assertEq(ship.totalBonded(), 2 * uint256(BOND));
    }

    function testFuzz_noSlashLeaveAlwaysFull(uint16 periods, uint8 paid) public {
        uint256 id = _create(0);
        for (uint256 i; i < paid % 5; ++i) {
            _pay(cy, id);
            vm.warp(block.timestamp + PERIOD);
        }
        vm.warp(block.timestamp + uint256(periods) * 1 hours);
        uint256 before = wif.balanceOf(cy);
        vm.prank(cy);
        ship.leave(id);
        assertEq(wif.balanceOf(cy) - before, BOND);
    }

    function testFuzz_slashNeverExceedsBondAndContractStaysSolvent(uint8 periodsMissed) public {
        uint256 id = _create(2500);
        vm.warp(block.timestamp + uint256(periodsMissed) * PERIOD + GRACE + 1);
        uint256 supplyBefore = wif.totalSupply();
        ship.slash(id, cy);
        uint256 burned = supplyBefore - wif.totalSupply();
        assertLe(burned, BOND);
        Equalship.Member memory m = ship.getMember(id, cy);
        uint256 accounted = uint256(m.bondLeft) + burned + ship.pendingReward(id, ada) + ship.pendingReward(id, bo);
        assertApproxEqAbs(accounted, uint256(BOND), 2);
        assertGe(wif.balanceOf(address(ship)), ship.totalBonded() + ship.pendingReward(id, ada) + ship.pendingReward(id, bo));
    }

    // ETH paths

    function test_joinWithEthBuysBondAndRefundsExtra() public {
        vm.prank(ada);
        uint256 id = ship.createCircle("Pair", CONTRIB, BOND, PERIOD, 10, 0, _basket());
        address newbie = makeAddr("newbie");
        vm.deal(newbie, 1 ether);
        router.setRate(1500e18); // 1 ETH buys 1500 WIF
        uint256 supplyBefore = wif.totalSupply();
        vm.prank(newbie);
        ship.joinWithETH{value: 1 ether}(id, 1400e18);
        assertTrue(ship.getMember(id, newbie).active);
        assertEq(ship.getMember(id, newbie).bondLeft, BOND);
        assertEq(wif.balanceOf(newbie), 500e18, "extra WIF refunded");
        assertEq(ship.wifBoughtForBonds(), 1500e18);
        assertEq(wif.totalSupply() - supplyBefore, 1500e18); // mock mints what the market would sell
        assertEq(address(ship).balance, 0, "no ETH left in the contract");
    }

    function test_joinWithEthRejectsMinBelowBond() public {
        vm.prank(ada);
        uint256 id = ship.createCircle("Pair", CONTRIB, BOND, PERIOD, 10, 0, _basket());
        vm.prank(bo);
        vm.expectRevert(Equalship.BadParams.selector);
        ship.joinWithETH{value: 1 ether}(id, BOND - 1);
    }

    function test_contributeWithEthRefundsExtraUsdg() public {
        uint256 id = _create(0);
        router.setRate(12e6); // 1 ETH (1e18 wei) buys 12 USDG
        uint256 usdgBefore = usdg.balanceOf(bo);
        uint256[] memory mins = new uint256[](2);
        vm.prank(bo);
        // the mock applies the same rate to the basket swaps, so check the USDG refund only
        ship.contributeWithETH{value: 1 ether}(id, 10e6, mins);
        assertEq(usdg.balanceOf(bo) - usdgBefore, 2e6, "2 USDG extra refunded");
        assertEq(ship.getMember(id, bo).paidCount, 1);
        assertEq(address(ship).balance, 0);
    }

    // auto-save

    function test_autoSaveOnlyKeeperAndOnlyWhenOn() public {
        uint256 id = _create(0);
        uint256[] memory mins = new uint256[](2);
        vm.prank(keeper);
        vm.expectRevert(Equalship.AutoSaveOff.selector);
        ship.contributeFor(id, bo, mins);

        vm.prank(bo);
        ship.setAutoSave(id, true);

        vm.prank(cy);
        vm.expectRevert(Equalship.NotKeeper.selector);
        ship.contributeFor(id, bo, mins);

        vm.prank(keeper);
        ship.contributeFor(id, bo, mins);
        assertEq(nvda.balanceOf(bo), 5.94e6, "basket goes to the member");
        assertEq(nvda.balanceOf(keeper), 0);

        vm.prank(bo);
        ship.setAutoSave(id, false);
        vm.warp(block.timestamp + PERIOD);
        vm.prank(keeper);
        vm.expectRevert(Equalship.AutoSaveOff.selector);
        ship.contributeFor(id, bo, mins);
    }

    function test_leaveTurnsAutoSaveOff() public {
        uint256 id = _create(0);
        vm.prank(bo);
        ship.setAutoSave(id, true);
        vm.prank(bo);
        ship.leave(id);
        assertFalse(ship.autoSave(id, bo));
    }

    // burns

    function test_voteBurnsRealSupply() public {
        uint256 id = _create(2500);
        Equalship.Leg[] memory next = new Equalship.Leg[](1);
        next[0] = Equalship.Leg(address(spy), 10_000, _path(address(spy)));
        vm.prank(bo);
        uint256 pid = ship.proposeBasket(id, next);
        uint256 supplyBefore = wif.totalSupply();
        vm.prank(ada);
        ship.vote(id, pid, true, 5e18);
        vm.prank(bo);
        ship.vote(id, pid, true, 1e18);
        vm.prank(cy);
        ship.vote(id, pid, false, 3e18);
        assertEq(supplyBefore - wif.totalSupply(), 9e18);
        assertEq(ship.burnedFromVotes(), 9e18);
        vm.warp(block.timestamp + 2 days + 1);
        ship.executeBasket(id, pid);
        (, Equalship.Leg[] memory legs) = ship.getCircle(id);
        assertEq(legs[0].token, address(spy));
    }

    function test_buyAndBurnLowersSupply() public {
        uint256 id = _create(0);
        _pay(ada, id);
        _pay(bo, id);
        bytes memory path = abi.encodePacked(address(usdg), uint24(10_000), address(wif));
        router.setRate(800e18);
        vm.prank(keeper);
        uint256 bought = ship.buyAndBurn(path, 0.2e6, 0);
        // the mock mints the bought WIF, then the contract burns it: net supply unchanged, balance zero
        assertEq(ship.burnedFromFees(), bought);
        assertEq(wif.balanceOf(address(ship)), 3 * uint256(BOND), "only bonds remain");
        assertEq(ship.feePool(), 0);
    }

    function test_buyAndBurnIsKeeperOnly() public {
        uint256 id = _create(0);
        _pay(ada, id);
        bytes memory path = abi.encodePacked(address(usdg), uint24(10_000), address(wif));
        vm.prank(ada);
        vm.expectRevert(Equalship.NotKeeper.selector);
        ship.buyAndBurn(path, 0.1e6, 0);
    }

    // validation

    function test_rejectsBadBasketsAndSlashAboveCap() public {
        Equalship.Leg[] memory legs = new Equalship.Leg[](1);
        legs[0] = Equalship.Leg(address(nvda), 9000, _path(address(nvda)));
        vm.prank(ada);
        vm.expectRevert(Equalship.BadBasket.selector);
        ship.createCircle("x", CONTRIB, BOND, PERIOD, 10, 0, legs);

        vm.prank(ada);
        vm.expectRevert(Equalship.BadParams.selector);
        ship.createCircle("x", CONTRIB, BOND, PERIOD, 10, 5001, _basket());
    }

    function test_circleFull() public {
        vm.prank(ada);
        uint256 id = ship.createCircle("Pair", CONTRIB, BOND, PERIOD, 2, 0, _basket());
        vm.prank(bo);
        ship.join(id);
        vm.prank(cy);
        vm.expectRevert(Equalship.CircleFull.selector);
        ship.join(id);
    }

    function test_canSaveView() public {
        uint256 id = _create(0);
        assertTrue(ship.canSave(id, ada));
        _pay(ada, id);
        assertFalse(ship.canSave(id, ada));
        vm.warp(block.timestamp + PERIOD);
        assertTrue(ship.canSave(id, ada));
    }
}
