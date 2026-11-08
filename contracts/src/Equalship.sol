// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20, ISwapRouter02} from "./interfaces/IExternal.sol";
import {SafeTransfer} from "./libraries/SafeTransfer.sol";

/// @title Equalship
/// @notice Savings circles on Robinhood Chain. Members bond $WIF, put in a fixed USDG amount every period,
/// and each contribution buys a basket of Stock Tokens straight into the member's own wallet.
/// Missed periods slash the bond: half is burned, half goes to the members who kept saving.
/// Members change the basket by burning $WIF as votes. A small fee on every contribution buys $WIF and burns it.
/// @dev The contract never holds a member's Stock Tokens. Swaps send output directly to the member.
contract Equalship {
    using SafeTransfer for IERC20;

    // Types

    struct Leg {
        address token; // asset the member receives
        uint16 weightBps; // share of the contribution, all legs sum to 10_000
        bytes path; // Uniswap v3 path, starts with USDG and ends with token
    }

    struct Circle {
        string name;
        address creator;
        uint64 start;
        uint32 period;
        uint16 maxMembers;
        uint16 memberCount;
        uint16 slashBps;
        uint128 contribution; // USDG per period, 6 decimals
        uint128 bond; // WIF bonded per member
        uint256 accRewardPerMember; // WIF per member, scaled by 1e18
        uint256 totalSaved; // USDG put in by all members
        uint256 proposalCount;
    }

    struct Member {
        bool active;
        uint64 nextDue; // first period index not yet paid or slashed
        uint32 streak;
        uint32 bestStreak;
        uint32 paidCount;
        uint32 missedCount;
        uint128 bondLeft;
        uint128 saved;
        uint256 rewardDebt;
    }

    struct Profile {
        uint32 totalPaid;
        uint32 bestStreak;
        uint32 missed;
        uint32 circlesJoined;
        uint64 firstPaidAt;
        uint64 lastPaidAt;
        uint128 totalSaved;
    }

    struct Proposal {
        address proposer;
        uint64 deadline;
        bool executed;
        uint16 yesVoters;
        uint256 yesWif;
        uint256 noWif;
    }

    // Constants

    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant MAX_LEGS = 5;
    uint256 public constant MAX_FEE_BPS = 200;
    uint32 public constant MIN_PERIOD = 1 hours;
    uint32 public constant MAX_PERIOD = 31 days;
    uint256 private constant ACC = 1e18;

    // Storage

    IERC20 public immutable usdg;
    IERC20 public immutable wif;
    ISwapRouter02 public immutable router;

    address public owner;
    address public keeper;
    uint16 public feeBps;

    uint256 public feePool; // USDG waiting to buy and burn WIF
    uint256 public totalSaved; // USDG across all circles
    uint256 public totalBonded; // WIF currently bonded
    uint256 public burnedFromFees;
    uint256 public burnedFromSlashes;
    uint256 public burnedFromVotes;
    uint256 public totalContributions;

    Circle[] private _circles;
    mapping(uint256 => Leg[]) private _legs;
    mapping(uint256 => address[]) private _memberList;
    mapping(uint256 => mapping(address => Member)) private _members;
    mapping(address => Profile) private _profiles;

    mapping(uint256 => mapping(uint256 => Proposal)) private _proposals;
    mapping(uint256 => mapping(uint256 => Leg[])) private _proposalLegs;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    uint256 private _lock = 1;

    // Events

    event CircleCreated(
        uint256 indexed circleId,
        address indexed creator,
        string name,
        uint256 contribution,
        uint256 bond,
        uint32 period
    );
    event Joined(uint256 indexed circleId, address indexed member, address indexed payer, uint256 bond);
    event Contributed(
        uint256 indexed circleId,
        address indexed member,
        uint64 period,
        uint256 amount,
        uint256 fee,
        uint32 streak
    );
    event Bought(
        uint256 indexed circleId,
        address indexed member,
        address indexed token,
        uint256 amountIn,
        uint256 amountOut
    );
    event Slashed(
        uint256 indexed circleId, address indexed member, uint32 periodsMissed, uint256 burned, uint256 shared
    );
    event RewardClaimed(uint256 indexed circleId, address indexed member, uint256 amount);
    event Left(uint256 indexed circleId, address indexed member, uint256 bondReturned);
    event BasketProposed(
        uint256 indexed circleId, uint256 indexed proposalId, address indexed proposer, uint64 deadline
    );
    event Voted(
        uint256 indexed circleId,
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 wifBurned
    );
    event BasketChanged(uint256 indexed circleId, uint256 indexed proposalId);
    event FeeBurned(uint256 usdgIn, uint256 wifBurned);
    event KeeperSet(address keeper);
    event OwnerSet(address owner);
    event FeeSet(uint16 feeBps);

    // Errors

    error NotOwner();
    error NotKeeper();
    error Reentrancy();
    error BadParams();
    error BadBasket();
    error UnknownCircle();
    error CircleFull();
    error AlreadyMember();
    error NotMember();
    error AlreadyPaid();
    error ProposalOpen();
    error NoProposal();
    error VotingClosed();
    error VotingOpen();
    error AlreadyVoted();
    error InsufficientOutput();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_lock != 1) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(IERC20 usdg_, IERC20 wif_, ISwapRouter02 router_, address keeper_, uint16 feeBps_) {
        if (feeBps_ > MAX_FEE_BPS) revert BadParams();
        usdg = usdg_;
        wif = wif_;
        router = router_;
        owner = msg.sender;
        keeper = keeper_;
        feeBps = feeBps_;
        emit OwnerSet(msg.sender);
        emit KeeperSet(keeper_);
        emit FeeSet(feeBps_);
    }

    // Circles

    /// @notice Create a circle and join it as the first member. The creator pays the bond.
    function createCircle(
        string calldata name,
        uint128 contribution,
        uint128 bond,
        uint32 period,
        uint16 maxMembers,
        uint16 slashBps,
        Leg[] calldata legs
    ) external nonReentrant returns (uint256 circleId) {
        uint256 nameLen = bytes(name).length;
        if (nameLen == 0 || nameLen > 48) revert BadParams();
        if (contribution < 1e6 || bond == 0) revert BadParams();
        if (period < MIN_PERIOD || period > MAX_PERIOD) revert BadParams();
        if (maxMembers < 2 || maxMembers > 50) revert BadParams();
        if (slashBps < 500 || slashBps > 5000) revert BadParams();

        circleId = _circles.length;
        Circle storage c = _circles.push();
        c.name = name;
        c.creator = msg.sender;
        c.start = uint64(block.timestamp);
        c.period = period;
        c.maxMembers = maxMembers;
        c.slashBps = slashBps;
        c.contribution = contribution;
        c.bond = bond;

        _setLegs(_legs[circleId], legs);

        emit CircleCreated(circleId, msg.sender, name, contribution, bond, period);
        _join(circleId, msg.sender, msg.sender);
    }

    /// @notice Join a circle by bonding WIF.
    function join(uint256 circleId) external nonReentrant {
        _join(circleId, msg.sender, msg.sender);
    }

    /// @notice Pay someone else's bond so they can join. Used for invites: a friend can bring a new saver in.
    function joinFor(uint256 circleId, address member) external nonReentrant {
        if (member == address(0)) revert BadParams();
        _join(circleId, member, msg.sender);
    }

    /// @notice Put in this period's contribution. Buys every basket leg into the caller's wallet.
    /// @param minOuts minimum output per leg, quoted off chain with slippage applied
    function contribute(uint256 circleId, uint256[] calldata minOuts) external nonReentrant {
        Circle storage c = _circle(circleId);
        Member storage m = _members[circleId][msg.sender];
        if (!m.active) revert NotMember();

        _settle(circleId, c, msg.sender, m);
        if (!m.active) revert NotMember();

        uint64 p = _currentPeriod(c);
        if (m.nextDue > p) revert AlreadyPaid();

        Leg[] storage legs = _legs[circleId];
        if (minOuts.length != legs.length) revert BadParams();

        uint256 amount = c.contribution;
        usdg.safeTransferFrom(msg.sender, address(this), amount);

        uint256 fee = (amount * feeBps) / 10_000;
        feePool += fee;
        uint256 rest = amount - fee;

        uint256 spent;
        uint256 n = legs.length;
        for (uint256 i; i < n; ++i) {
            uint256 legIn = i == n - 1 ? rest - spent : (rest * legs[i].weightBps) / 10_000;
            spent += legIn;
            uint256 out = _swap(legs[i].path, legIn, minOuts[i], msg.sender);
            emit Bought(circleId, msg.sender, legs[i].token, legIn, out);
        }

        // _settle reset the streak to zero if any period was missed
        m.streak += 1;
        if (m.streak > m.bestStreak) m.bestStreak = m.streak;
        m.nextDue = p + 1;
        m.paidCount += 1;
        m.saved += uint128(amount);

        c.totalSaved += amount;
        totalSaved += amount;
        totalContributions += 1;

        Profile storage pr = _profiles[msg.sender];
        pr.totalPaid += 1;
        pr.totalSaved += uint128(amount);
        if (m.streak > pr.bestStreak) pr.bestStreak = m.streak;
        if (pr.firstPaidAt == 0) pr.firstPaidAt = uint64(block.timestamp);
        pr.lastPaidAt = uint64(block.timestamp);

        emit Contributed(circleId, msg.sender, p, amount, fee, m.streak);
    }

    /// @notice Apply slashes for every period a member let pass without paying. Anyone can call it.
    function slash(uint256 circleId, address member) external nonReentrant {
        Circle storage c = _circle(circleId);
        Member storage m = _members[circleId][member];
        if (!m.active) revert NotMember();
        _settle(circleId, c, member, m);
    }

    /// @notice Claim WIF shared from other members' slashed bonds.
    function claim(uint256 circleId) external nonReentrant {
        Circle storage c = _circle(circleId);
        Member storage m = _members[circleId][msg.sender];
        if (!m.active) revert NotMember();
        _settle(circleId, c, msg.sender, m);
        _claim(circleId, c, msg.sender, m);
    }

    /// @notice Leave a circle. Missed periods are slashed first, then the rest of the bond and rewards come back.
    function leave(uint256 circleId) external nonReentrant {
        Circle storage c = _circle(circleId);
        Member storage m = _members[circleId][msg.sender];
        if (!m.active) revert NotMember();
        _settle(circleId, c, msg.sender, m);
        if (!m.active) return; // bond fully slashed, nothing left to return
        _claim(circleId, c, msg.sender, m);

        uint256 back = m.bondLeft;
        m.bondLeft = 0;
        m.active = false;
        c.memberCount -= 1;
        totalBonded -= back;
        if (back > 0) wif.safeTransfer(msg.sender, back);
        emit Left(circleId, msg.sender, back);
    }

    // Basket voting

    /// @notice Propose a new basket. Voting stays open for two periods, with a floor of one day.
    function proposeBasket(uint256 circleId, Leg[] calldata legs)
        external
        nonReentrant
        returns (uint256 proposalId)
    {
        Circle storage c = _circle(circleId);
        if (!_members[circleId][msg.sender].active) revert NotMember();
        if (c.proposalCount > 0) {
            Proposal storage last = _proposals[circleId][c.proposalCount - 1];
            if (!last.executed && block.timestamp <= last.deadline) revert ProposalOpen();
        }

        proposalId = c.proposalCount++;
        _setLegs(_proposalLegs[circleId][proposalId], legs);

        uint256 window = uint256(c.period) * 2;
        if (window < 1 days) window = 1 days;
        Proposal storage pr = _proposals[circleId][proposalId];
        pr.proposer = msg.sender;
        pr.deadline = uint64(block.timestamp + window);
        emit BasketProposed(circleId, proposalId, msg.sender, pr.deadline);
    }

    /// @notice Vote by burning WIF. 1 WIF burned is 1 vote. Only bonded members vote, one vote call each.
    function vote(uint256 circleId, uint256 proposalId, bool support, uint256 wifAmount)
        external
        nonReentrant
    {
        Circle storage c = _circle(circleId);
        if (proposalId >= c.proposalCount) revert NoProposal();
        if (!_members[circleId][msg.sender].active) revert NotMember();
        Proposal storage pr = _proposals[circleId][proposalId];
        if (block.timestamp > pr.deadline || pr.executed) revert VotingClosed();
        if (hasVoted[circleId][proposalId][msg.sender]) revert AlreadyVoted();
        if (wifAmount < 1e18) revert BadParams();

        hasVoted[circleId][proposalId][msg.sender] = true;
        wif.safeTransferFrom(msg.sender, DEAD, wifAmount);
        burnedFromVotes += wifAmount;

        if (support) {
            pr.yesWif += wifAmount;
            pr.yesVoters += 1;
        } else {
            pr.noWif += wifAmount;
        }
        emit Voted(circleId, proposalId, msg.sender, support, wifAmount);
    }

    /// @notice After the deadline, apply the basket if more WIF was burned for it than against it
    /// and at least half of the current members voted yes.
    function executeBasket(uint256 circleId, uint256 proposalId) external nonReentrant {
        Circle storage c = _circle(circleId);
        if (proposalId >= c.proposalCount) revert NoProposal();
        Proposal storage pr = _proposals[circleId][proposalId];
        if (pr.executed) revert VotingClosed();
        if (block.timestamp <= pr.deadline) revert VotingOpen();
        if (pr.yesWif <= pr.noWif || uint256(pr.yesVoters) * 2 < c.memberCount) revert BadBasket();

        pr.executed = true;
        Leg[] storage src = _proposalLegs[circleId][proposalId];
        Leg[] storage dst = _legs[circleId];
        while (dst.length > 0) dst.pop();
        for (uint256 i; i < src.length; ++i) {
            dst.push(src[i]);
        }
        emit BasketChanged(circleId, proposalId);
    }

    // Buyback and burn

    /// @notice Swap collected USDG fees for WIF and send it to the burn address.
    /// @dev Keeper only so the swap cannot be sandwiched with a caller chosen minimum.
    function buyAndBurn(bytes calldata path, uint256 amountIn, uint256 minWifOut)
        external
        nonReentrant
        returns (uint256 burned)
    {
        if (msg.sender != keeper && msg.sender != owner) revert NotKeeper();
        if (amountIn == 0 || amountIn > feePool) revert BadParams();
        if (_pathFirst(path) != address(usdg) || _pathLast(path) != address(wif)) revert BadBasket();
        feePool -= amountIn;
        burned = _swap(path, amountIn, minWifOut, DEAD);
        burnedFromFees += burned;
        emit FeeBurned(amountIn, burned);
    }

    // Admin

    function setKeeper(address keeper_) external onlyOwner {
        keeper = keeper_;
        emit KeeperSet(keeper_);
    }

    function setFee(uint16 feeBps_) external onlyOwner {
        if (feeBps_ > MAX_FEE_BPS) revert BadParams();
        feeBps = feeBps_;
        emit FeeSet(feeBps_);
    }

    function transferOwnership(address owner_) external onlyOwner {
        if (owner_ == address(0)) revert BadParams();
        owner = owner_;
        emit OwnerSet(owner_);
    }

    // Views

    function circleCount() external view returns (uint256) {
        return _circles.length;
    }

    function getCircle(uint256 circleId) external view returns (Circle memory c, Leg[] memory legs) {
        c = _circle(circleId);
        legs = _legs[circleId];
    }

    function currentPeriod(uint256 circleId) external view returns (uint64) {
        return _currentPeriod(_circle(circleId));
    }

    /// @notice Unix time the given period closes.
    function periodEnd(uint256 circleId, uint64 period) external view returns (uint256) {
        Circle storage c = _circle(circleId);
        return uint256(c.start) + (uint256(period) + 1) * c.period;
    }

    function getMember(uint256 circleId, address member) external view returns (Member memory) {
        return _members[circleId][member];
    }

    function members(uint256 circleId) external view returns (address[] memory) {
        return _memberList[circleId];
    }

    /// @notice Periods the member has let pass without paying and that have not been slashed yet.
    function missedPeriods(uint256 circleId, address member) public view returns (uint64) {
        Circle storage c = _circle(circleId);
        Member storage m = _members[circleId][member];
        if (!m.active) return 0;
        uint64 p = _currentPeriod(c);
        return p > m.nextDue ? p - m.nextDue : 0;
    }

    function pendingReward(uint256 circleId, address member) external view returns (uint256) {
        Circle storage c = _circle(circleId);
        Member storage m = _members[circleId][member];
        if (!m.active) return 0;
        return (c.accRewardPerMember - m.rewardDebt) / ACC;
    }

    function getProposal(uint256 circleId, uint256 proposalId)
        external
        view
        returns (Proposal memory pr, Leg[] memory legs)
    {
        pr = _proposals[circleId][proposalId];
        legs = _proposalLegs[circleId][proposalId];
    }

    // Proof of Commitment registry

    function profileOf(address account) external view returns (Profile memory) {
        return _profiles[account];
    }

    /// @notice True when the account has paid at least `minPaid` periods, reached a streak of `minStreak`,
    /// and paid within the last `maxIdle` seconds. Other apps can use this as a cheap filter for real users.
    function isCommitted(address account, uint32 minPaid, uint32 minStreak, uint64 maxIdle)
        external
        view
        returns (bool)
    {
        Profile storage pr = _profiles[account];
        if (pr.lastPaidAt == 0 || pr.totalPaid < minPaid || pr.bestStreak < minStreak) return false;
        return block.timestamp - pr.lastPaidAt <= maxIdle;
    }

    // Internal

    function _circle(uint256 circleId) internal view returns (Circle storage) {
        if (circleId >= _circles.length) revert UnknownCircle();
        return _circles[circleId];
    }

    function _currentPeriod(Circle storage c) internal view returns (uint64) {
        return uint64((block.timestamp - c.start) / c.period);
    }

    function _join(uint256 circleId, address member, address payer) internal {
        Circle storage c = _circle(circleId);
        Member storage m = _members[circleId][member];
        if (m.active) revert AlreadyMember();
        if (c.memberCount >= c.maxMembers) revert CircleFull();

        uint256 bond = c.bond;
        wif.safeTransferFrom(payer, address(this), bond);

        bool firstTime = m.paidCount == 0 && m.missedCount == 0 && m.bestStreak == 0;
        m.active = true;
        m.nextDue = _currentPeriod(c);
        m.streak = 0;
        m.bondLeft = uint128(bond);
        m.rewardDebt = c.accRewardPerMember;

        c.memberCount += 1;
        totalBonded += bond;
        if (firstTime) {
            _memberList[circleId].push(member);
            _profiles[member].circlesJoined += 1;
        }
        emit Joined(circleId, member, payer, bond);
    }

    function _settle(uint256 circleId, Circle storage c, address member, Member storage m) internal {
        uint64 p = _currentPeriod(c);
        if (p <= m.nextDue) return;
        uint64 missed = p - m.nextDue;
        m.nextDue = p;
        m.streak = 0;
        m.missedCount += uint32(missed);
        _profiles[member].missed += uint32(missed);

        uint256 penalty = (uint256(c.bond) * c.slashBps * missed) / 10_000;
        if (penalty > m.bondLeft) penalty = m.bondLeft;
        m.bondLeft -= uint128(penalty);
        totalBonded -= penalty;

        uint256 others = c.memberCount - 1;
        uint256 shared = others == 0 ? 0 : penalty / 2;
        uint256 burned = penalty - shared;

        if (shared > 0) {
            // the slashed member does not earn from their own penalty
            uint256 inc = (shared * ACC) / others;
            _claim(circleId, c, member, m);
            c.accRewardPerMember += inc;
            m.rewardDebt += inc;
        }
        if (burned > 0) {
            burnedFromSlashes += burned;
            wif.safeTransfer(DEAD, burned);
        }
        emit Slashed(circleId, member, uint32(missed), burned, shared);

        if (m.bondLeft == 0) {
            _claim(circleId, c, member, m);
            m.active = false;
            c.memberCount -= 1;
            emit Left(circleId, member, 0);
        }
    }

    function _claim(uint256 circleId, Circle storage c, address member, Member storage m) internal {
        uint256 owed = (c.accRewardPerMember - m.rewardDebt) / ACC;
        m.rewardDebt += owed * ACC;
        if (owed > 0) {
            wif.safeTransfer(member, owed);
            emit RewardClaimed(circleId, member, owed);
        }
    }

    function _swap(bytes memory path, uint256 amountIn, uint256 minOut, address recipient)
        internal
        returns (uint256 out)
    {
        if (amountIn == 0) return 0;
        usdg.safeApprove(address(router), amountIn);
        out = router.exactInput(
            ISwapRouter02.ExactInputParams({
                path: path, recipient: recipient, amountIn: amountIn, amountOutMinimum: minOut
            })
        );
        if (out < minOut) revert InsufficientOutput();
        usdg.safeApprove(address(router), 0);
    }

    function _setLegs(Leg[] storage dst, Leg[] calldata legs) internal {
        uint256 n = legs.length;
        if (n == 0 || n > MAX_LEGS) revert BadBasket();
        uint256 sum;
        for (uint256 i; i < n; ++i) {
            Leg calldata l = legs[i];
            bytes calldata path = l.path;
            if (l.weightBps == 0) revert BadBasket();
            if (path.length < 43 || (path.length - 20) % 23 != 0) revert BadBasket();
            if (_pathFirst(path) != address(usdg) || _pathLast(path) != l.token) revert BadBasket();
            if (l.token == address(usdg)) revert BadBasket();
            sum += l.weightBps;
            dst.push(l);
        }
        if (sum != 10_000) revert BadBasket();
    }

    function _pathFirst(bytes calldata path) internal pure returns (address a) {
        if (path.length < 20) revert BadBasket();
        a = address(bytes20(path[0:20]));
    }

    function _pathLast(bytes calldata path) internal pure returns (address a) {
        if (path.length < 20) revert BadBasket();
        a = address(bytes20(path[path.length - 20:path.length]));
    }
}
