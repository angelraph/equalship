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
    address constant DEAD = 0x000000000000000000000000000000000000dEaD;

    function setUp() public {
        usdg = new MockToken("USDG", "USDG", 6);
        wif = new MockToken("World is Flat", "WIF", 18);
        nvda = new MockToken("NVDA", "NVDA", 18);
        spy = new MockToken("SPY", "SPY", 18);
        router = new MockRouter();
        ship = new Equalship(
            IERC20(address(usdg)), IERC20(address(wif)), ISwapRouter02(address(router)), keeper, 100
        );

        address[3] memory people = [ada, bo, cy];
        for (uint256 i; i < 3; ++i) {
            usdg.mint(people[i], 1000e6);
            wif.mint(people[i], 100_000e18);
            vm.startPrank(people[i]);
            usdg.approve(address(ship), type(uint256).max);
            wif.approve(address(ship), type(uint256).max);
            vm.stopPrank();
        }
    }

    function _path(address tokenOut) internal view returns (bytes memory) {
        return abi.encodePacked(address(usdg), uint24(500), tokenOut);
    }

    function _basket() internal view returns (Equalship.Leg[] memory legs) {
        legs = new Equalship.Leg[](2);
        legs[0] = Equalship.Leg(address(nvda), 6000, _path(address(nvda)));
        legs[1] = Equalship.Leg(address(spy), 4000, _path(address(spy)));
    }

    function _create() internal returns (uint256 id) {
        vm.prank(ada);
        id = ship.createCircle("Lagos Builders", CONTRIB, BOND, PERIOD, 10, 2500, _basket());
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

    function test_createAndJoin() public {
        uint256 id = _create();
        (Equalship.Circle memory c, Equalship.Leg[] memory legs) = ship.getCircle(id);
        assertEq(c.memberCount, 3);
        assertEq(legs.length, 2);
        assertEq(wif.balanceOf(address(ship)), 3 * uint256(BOND));
        assertEq(ship.totalBonded(), 3 * uint256(BOND));
        assertEq(ship.members(id).length, 3);
    }

    function test_contributeBuysIntoMemberWallet() public {
        uint256 id = _create();
        _pay(ada, id);
        // 1% fee, 99% split 60/40, mock rate 1:1
        assertEq(ship.feePool(), 0.1e6);
        assertEq(nvda.balanceOf(ada), 5.94e6);
        assertEq(spy.balanceOf(ada), 3.96e6);
        assertEq(nvda.balanceOf(address(ship)), 0);
        assertEq(usdg.balanceOf(address(ship)), 0.1e6);
        assertEq(ship.getMember(id, ada).streak, 1);
        assertEq(ship.profileOf(ada).totalPaid, 1);
    }

    function test_cannotPayTwiceInOnePeriod() public {
        uint256 id = _create();
        _pay(ada, id);
        uint256[] memory mins = new uint256[](2);
        vm.prank(ada);
        vm.expectRevert(Equalship.AlreadyPaid.selector);
        ship.contribute(id, mins);
    }

    function test_streakGrowsAcrossPeriods() public {
        uint256 id = _create();
        for (uint256 i; i < 4; ++i) {
            _pay(ada, id);
            vm.warp(block.timestamp + PERIOD);
        }
        assertEq(ship.getMember(id, ada).streak, 4);
        assertEq(ship.getMember(id, ada).bestStreak, 4);
        assertTrue(ship.isCommitted(ada, 4, 4, 2 days));
        assertFalse(ship.isCommitted(bo, 1, 1, 2 days));
    }

    function test_missedPeriodSlashesBurnsAndShares() public {
        uint256 id = _create();
        _pay(ada, id);
        _pay(bo, id);
        _pay(cy, id);
        vm.warp(block.timestamp + PERIOD);
        _pay(ada, id);
        _pay(bo, id);
        // cy misses period 1
        vm.warp(block.timestamp + PERIOD);
        assertEq(ship.missedPeriods(id, cy), 1);

        uint256 deadBefore = wif.balanceOf(DEAD);
        ship.slash(id, cy);

        uint256 penalty = (uint256(BOND) * 2500) / 10_000; // 250 WIF
        assertEq(wif.balanceOf(DEAD) - deadBefore, penalty / 2);
        assertEq(ship.getMember(id, cy).bondLeft, BOND - penalty);
        assertEq(ship.getMember(id, cy).streak, 0);
        assertEq(ship.pendingReward(id, ada), penalty / 4);
        assertEq(ship.pendingReward(id, bo), penalty / 4);
        assertEq(ship.pendingReward(id, cy), 0);

        uint256 before = wif.balanceOf(ada);
        vm.prank(ada);
        ship.claim(id);
        assertEq(wif.balanceOf(ada) - before, penalty / 4);
    }

    function test_contributeAfterMissSettlesAndRestartsStreak() public {
        uint256 id = _create();
        _pay(bo, id);
        vm.warp(block.timestamp + 3 * PERIOD);
        _pay(bo, id);
        Equalship.Member memory m = ship.getMember(id, bo);
        assertEq(m.streak, 1);
        assertEq(m.missedCount, 2);
        assertEq(m.bondLeft, BOND / 2);
    }

    function test_fullySlashedMemberIsRemoved() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 10 * PERIOD);
        ship.slash(id, cy);
        assertFalse(ship.getMember(id, cy).active);
        (Equalship.Circle memory c,) = ship.getCircle(id);
        assertEq(c.memberCount, 2);
    }

    function test_leaveReturnsBondAndRewards() public {
        uint256 id = _create();
        _pay(ada, id);
        vm.warp(block.timestamp + PERIOD);
        _pay(ada, id);
        ship.slash(id, cy); // cy missed period 0
        uint256 before = wif.balanceOf(ada);
        vm.prank(ada);
        ship.leave(id);
        uint256 share = ((uint256(BOND) * 2500) / 10_000 / 2) / 2;
        assertEq(wif.balanceOf(ada) - before, BOND + share);
        assertFalse(ship.getMember(id, ada).active);
    }

    function test_joinForSponsorsANewSaver() public {
        uint256 id = _create();
        address newbie = makeAddr("newbie");
        vm.prank(ada);
        ship.joinFor(id, newbie);
        assertTrue(ship.getMember(id, newbie).active);
        assertEq(ship.getMember(id, newbie).bondLeft, BOND);
    }

    function test_basketVoteBurnsAndApplies() public {
        uint256 id = _create();
        Equalship.Leg[] memory next = new Equalship.Leg[](1);
        next[0] = Equalship.Leg(address(spy), 10_000, _path(address(spy)));

        vm.prank(bo);
        uint256 pid = ship.proposeBasket(id, next);
        vm.prank(ada);
        ship.vote(id, pid, true, 5e18);
        vm.prank(bo);
        ship.vote(id, pid, true, 1e18);
        vm.prank(cy);
        ship.vote(id, pid, false, 3e18);
        assertEq(wif.balanceOf(DEAD), 9e18);
        assertEq(ship.burnedFromVotes(), 9e18);

        vm.expectRevert(Equalship.VotingOpen.selector);
        ship.executeBasket(id, pid);

        vm.warp(block.timestamp + 2 days + 1);
        ship.executeBasket(id, pid);
        (, Equalship.Leg[] memory legs) = ship.getCircle(id);
        assertEq(legs.length, 1);
        assertEq(legs[0].token, address(spy));
    }

    function test_basketVoteFailsWithoutMajority() public {
        uint256 id = _create();
        Equalship.Leg[] memory next = new Equalship.Leg[](1);
        next[0] = Equalship.Leg(address(spy), 10_000, _path(address(spy)));
        vm.prank(bo);
        uint256 pid = ship.proposeBasket(id, next);
        vm.prank(bo);
        ship.vote(id, pid, true, 1e18);
        vm.prank(cy);
        ship.vote(id, pid, false, 2e18);
        vm.warp(block.timestamp + 2 days + 1);
        vm.expectRevert(Equalship.BadBasket.selector);
        ship.executeBasket(id, pid);
    }

    function test_cannotVoteTwiceOrAsOutsider() public {
        uint256 id = _create();
        Equalship.Leg[] memory next = new Equalship.Leg[](1);
        next[0] = Equalship.Leg(address(spy), 10_000, _path(address(spy)));
        vm.prank(bo);
        uint256 pid = ship.proposeBasket(id, next);
        vm.prank(bo);
        ship.vote(id, pid, true, 1e18);
        vm.prank(bo);
        vm.expectRevert(Equalship.AlreadyVoted.selector);
        ship.vote(id, pid, true, 1e18);
        address outsider = makeAddr("outsider");
        vm.prank(outsider);
        vm.expectRevert(Equalship.NotMember.selector);
        ship.vote(id, pid, true, 1e18);
    }

    function test_buyAndBurnSendsWifToDead() public {
        uint256 id = _create();
        _pay(ada, id);
        _pay(bo, id);
        bytes memory path = abi.encodePacked(address(usdg), uint24(10_000), address(wif));
        router.setRate(800e18); // 800 WIF raw units per USDG raw unit, mock only
        vm.prank(keeper);
        uint256 burned = ship.buyAndBurn(path, 0.2e6, 0);
        assertEq(burned, 0.2e6 * 800);
        assertEq(wif.balanceOf(DEAD), burned);
        assertEq(ship.feePool(), 0);
        assertEq(ship.burnedFromFees(), burned);
    }

    function test_buyAndBurnIsKeeperOnly() public {
        uint256 id = _create();
        _pay(ada, id);
        bytes memory path = abi.encodePacked(address(usdg), uint24(10_000), address(wif));
        vm.prank(ada);
        vm.expectRevert(Equalship.NotKeeper.selector);
        ship.buyAndBurn(path, 0.1e6, 0);
    }

    function test_rejectsBadBaskets() public {
        Equalship.Leg[] memory legs = new Equalship.Leg[](1);
        legs[0] = Equalship.Leg(address(nvda), 9000, _path(address(nvda)));
        vm.prank(ada);
        vm.expectRevert(Equalship.BadBasket.selector);
        ship.createCircle("x", CONTRIB, BOND, PERIOD, 10, 2500, legs);

        legs[0] = Equalship.Leg(address(nvda), 10_000, _path(address(spy)));
        vm.prank(ada);
        vm.expectRevert(Equalship.BadBasket.selector);
        ship.createCircle("x", CONTRIB, BOND, PERIOD, 10, 2500, legs);
    }

    function test_circleFull() public {
        vm.prank(ada);
        uint256 id = ship.createCircle("Pair", CONTRIB, BOND, PERIOD, 2, 2500, _basket());
        vm.prank(bo);
        ship.join(id);
        vm.prank(cy);
        vm.expectRevert(Equalship.CircleFull.selector);
        ship.join(id);
    }

    function testFuzz_slashNeverExceedsBond(uint8 periodsMissed) public {
        uint256 id = _create();
        vm.warp(block.timestamp + uint256(periodsMissed) * PERIOD);
        ship.slash(id, cy);
        uint256 burned = wif.balanceOf(DEAD);
        assertLe(burned, BOND);
        Equalship.Member memory m = ship.getMember(id, cy);
        uint256 accounted =
            uint256(m.bondLeft) + burned + ship.pendingReward(id, ada) + ship.pendingReward(id, bo);
        assertApproxEqAbs(accounted, uint256(BOND), 2);
        // the contract always holds enough WIF for every bond and reward it owes
        assertGe(
            wif.balanceOf(address(ship)),
            ship.totalBonded() + ship.pendingReward(id, ada) + ship.pendingReward(id, bo)
        );
    }
}
