// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title Covenant Floor on Cronos
/// @notice A new FELT token on Cronos EVM (chain 25). Not the Supra FELT asset.
///         Payouts match the Supra floor. Draws must not use block.prevrandao.
///         Supra dVRF 3.0 is the randomness this house is built for:
///         ISupraRouter.generateRequest(functionSig, rngCount, confirmations, clientSeed, clientWallet).
///         The callback delivers the numbers. Cronos is not on Supra's published dVRF network list,
///         so the router address stays unset and a draw reverts until that router exists.
contract Felt {
    string public constant name = "FELT";
    string public constant symbol = "FELT";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    constructor(address treasury) {
        _mint(treasury, 1_000_000_000 * 1e6);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "allowance");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0) && balanceOf[from] >= amount, "felt");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == from || allowance[from][msg.sender] >= amount, "burn");
        if (msg.sender != from && allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= amount;
        }
        require(balanceOf[from] >= amount, "burn");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }
}

contract CovenantFloor {
    uint256 public constant UNIT = 1e6;
    uint256 public constant MIN_BET = 1e6;
    uint256 public constant MAX_BET = 500_000 * 1e6;
    uint256 public constant KENO_MAX = 10_000 * 1e6;
    uint256 public constant POKER_MAX_ANTE = 5_000 * 1e6;
    uint256 public constant SCROLL = 1_000 * 1e6;
    uint256 public constant JOB_REVIEW = 48 hours;

    Felt public immutable felt;
    address[3] public owners;
    address public buyback;
    address public burnSink;

    uint256 public bank;
    uint256 public burned;
    uint256 public buybackPot;
    uint256 public stakers;
    uint256 public nonce;

    mapping(address => uint256) public vault;
    mapping(address => Hilo) public hilo;
    mapping(address => Mines) public mines;
    mapping(address => Bj) public bj;
    mapping(address => Poker) public poker;

    uint256 public round = 1;
    uint256 public pot;
    uint256 public totalTickets;
    address[] public ticketOwners;
    mapping(address => uint256) public tickets;

    uint256 public nextJob = 1;
    Job[] public jobs;

    struct Hilo { uint64 card; uint256 stake; uint32 mult; bool alive; }
    struct Mines { uint256 stake; uint8 cells; uint8 mineCount; uint32 mult; bool alive; uint256 revealed; }
    struct Bj { uint8 phase; uint8 active; uint8[8] cards; uint8[2] counts; uint256[2] bets; bool[2] naturals; uint8 dealerCount; uint8[8] dealer; uint8 used; }
    struct Poker { uint8 phase; uint256 ante; uint8[2] hole; uint8[2] dealer; uint8[5] board; uint8 boardCount; uint8[52] deck; uint8 left; }
    struct Job { uint256 id; address creator; address worker; uint256 pay; uint64 deadline; uint64 submittedAt; uint8 state; string brief; string work; string reason; }

    struct Proposal { address to; uint256 amount; bool[3] sigs; bool open; }
    Proposal public proposal;

    event Play(address indexed player, string game, uint256 stake, uint256 payout, string detail);
    event HouseSent(uint256 amount, address to);

    modifier bankOk(uint256 need) {
        require(bank >= need, "bank");
        _;
    }

    constructor(Felt token, address[3] memory three, address buybackWallet, address burnWallet) {
        felt = token;
        owners = three;
        buyback = buybackWallet;
        burnSink = burnWallet;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount");
        require(felt.transferFrom(msg.sender, address(this), amount), "transfer");
        vault[msg.sender] += amount;
    }

    function withdraw(uint256 amount) external {
        require(vault[msg.sender] >= amount && amount > 0, "vault");
        vault[msg.sender] -= amount;
        require(felt.transfer(msg.sender, amount), "transfer");
    }

    function fundHouse(uint256 amount) external {
        require(felt.transferFrom(msg.sender, address(this), amount), "transfer");
        bank += amount;
    }

    function _take(address player, uint256 stake) internal {
        require(vault[player] >= stake, "vault");
        vault[player] -= stake;
        bank += stake;
        nonce += 1;
    }

    function _credit(address player, uint256 amount) internal {
        if (amount == 0) return;
        require(bank >= amount, "bank");
        bank -= amount;
        vault[player] += amount;
    }

    function _skim(uint256 stake, uint256 payout) internal {
        if (payout >= stake) return;
        uint256 profit = stake - payout;
        uint256 burnAmt = profit * 1500 / 10000;
        uint256 buyAmt = profit * 500 / 10000;
        uint256 stakeAmt = profit * 1000 / 10000;
        uint256 take = burnAmt + buyAmt + stakeAmt;
        if (take == 0) return;
        require(bank >= take, "bank");
        bank -= take;
        burned += burnAmt;
        buybackPot += buyAmt;
        stakers += stakeAmt;
    }

    /// @dev Not a draw. Cronos has no Supra dVRF router published. Do not hash prevrandao.
    function _roll(uint256) internal pure returns (uint256) {
        revert("dVRF router is not set");
    }

    function _check(uint256 stake) internal pure {
        require(stake >= MIN_BET && stake <= MAX_BET, "bet");
    }

    function dice(uint8 mode, uint256 target, uint256 stake) external bankOk(stake * 36) {
        _check(stake);
        _take(msg.sender, stake);
        uint256 sum = _roll(6) + 1 + _roll(6) + 1;
        bool win;
        if (mode == 0) win = sum < 7;
        else if (mode == 1) win = sum > 7;
        else if (mode == 2) win = sum == 7;
        else {
            require(target >= 2 && target <= 12, "sum");
            win = sum == target;
        }
        uint256 payout;
        if (win) {
            if (mode == 0 || mode == 1) payout = stake * 230 / 100;
            else if (mode == 2) payout = stake * 576 / 100;
            else {
                uint256 ways = target <= 7 ? target - 1 : 13 - target;
                payout = stake * 36 * 96 / ways / 100;
            }
        }
        _credit(msg.sender, payout);
        _skim(stake, payout);
        emit Play(msg.sender, "dice", stake, payout, "");
    }

    function roulette(uint8 kind, uint256 pick, uint256 stake) external bankOk(stake * 36) {
        _check(stake);
        _take(msg.sender, stake);
        uint256 n = _roll(37);
        uint256 payout = _roulette(kind, pick, n, stake);
        _credit(msg.sender, payout);
        _skim(stake, payout);
        emit Play(msg.sender, "roulette", stake, payout, "");
    }

    function _roulette(uint8 kind, uint256 pick, uint256 n, uint256 stake) internal pure returns (uint256) {
        if (kind == 0) {
            require(pick <= 36, "n");
            return pick == n ? stake * 36 : 0;
        }
        if (n == 0) return 0;
        if (kind == 1) return _red(n) ? stake * 2 : 0;
        if (kind == 2) return _red(n) ? 0 : stake * 2;
        if (kind == 3) return n % 2 == 0 ? stake * 2 : 0;
        if (kind == 4) return n % 2 == 1 ? stake * 2 : 0;
        require(kind == 5 && pick >= 1 && pick <= 3, "dozen");
        uint256 dozen = n <= 12 ? 1 : n <= 24 ? 2 : 3;
        return dozen == pick ? stake * 3 : 0;
    }

    function _red(uint256 n) internal pure returns (bool) {
        return n == 1 || n == 3 || n == 5 || n == 7 || n == 9 || n == 12 || n == 14 || n == 16
            || n == 18 || n == 19 || n == 21 || n == 23 || n == 25 || n == 27 || n == 30
            || n == 32 || n == 34 || n == 36;
    }

    function slots(uint256 stake) external bankOk(stake * 25) {
        _check(stake);
        _take(msg.sender, stake);
        uint256 a = _roll(7);
        uint256 b = _roll(7);
        uint256 c = _roll(7);
        uint256 payout;
        if (a == b && b == c) {
            if (a == 0) payout = stake * 25;
            else if (a == 1) payout = stake * 10;
            else if (a == 2 || a == 3) payout = stake * 5;
            else payout = stake * 2;
        } else if (a == b || b == c || a == c) payout = stake * 15 / 10;
        _credit(msg.sender, payout);
        _skim(stake, payout);
        emit Play(msg.sender, "slots", stake, payout, "");
    }

    function plinko(uint8 difficulty, uint256 stake) external bankOk(stake * 34) {
        _check(stake);
        require(difficulty < 3, "board");
        _take(msg.sender, stake);
        uint256 bucket;
        for (uint256 i; i < 8; i++) bucket += _roll(2);
        uint256 payout = stake * _plinko(difficulty, bucket) / 1000;
        _credit(msg.sender, payout);
        _skim(stake, payout);
        emit Play(msg.sender, "plinko", stake, payout, "");
    }

    function _plinko(uint8 diff, uint256 bucket) internal pure returns (uint256) {
        if (diff == 0) {
            if (bucket == 0 || bucket == 8) return 8300;
            if (bucket == 1 || bucket == 7) return 2600;
            if (bucket == 2 || bucket == 6) return 1400;
            if (bucket == 3 || bucket == 5) return 620;
            return 520;
        }
        if (diff == 1) {
            if (bucket == 0 || bucket == 8) return 20400;
            if (bucket == 1 || bucket == 7) return 3400;
            if (bucket == 2 || bucket == 6) return 1700;
            if (bucket == 3 || bucket == 5) return 340;
            return 250;
        }
        if (bucket == 0 || bucket == 8) return 34000;
        if (bucket == 1 || bucket == 7) return 5100;
        if (bucket == 2 || bucket == 6) return 1700;
        if (bucket == 3 || bucket == 5) return 120;
        return 50;
    }

    function sealScroll(uint256 n) external {
        require(n >= 1 && n <= 100, "scrolls");
        uint256 cost = SCROLL * n;
        require(felt.transferFrom(msg.sender, address(this), cost), "transfer");
        pot += cost;
        _tickets(msg.sender, n);
    }

    function burnScroll(uint256 n) external {
        require(n >= 1 && n <= 100, "scrolls");
        felt.burn(msg.sender, SCROLL * n);
        burned += SCROLL * n;
        _tickets(msg.sender, n);
    }

    function _tickets(address who, uint256 n) internal {
        if (tickets[who] == 0) ticketOwners.push(who);
        tickets[who] += n;
        totalTickets += n;
    }

    function draw() external {
        require(totalTickets > 0, "empty");
        uint256 ticket = _roll(totalTickets);
        uint256 acc;
        address winner = ticketOwners[0];
        for (uint256 i; i < ticketOwners.length; i++) {
            acc += tickets[ticketOwners[i]];
            if (ticket < acc) {
                winner = ticketOwners[i];
                break;
            }
        }
        uint256 prize = pot * 9000 / 10000;
        pot -= prize;
        if (prize > 0) require(felt.transfer(winner, prize), "prize");
        for (uint256 i; i < ticketOwners.length; i++) tickets[ticketOwners[i]] = 0;
        delete ticketOwners;
        totalTickets = 0;
        round += 1;
    }

    function openJob(string calldata brief, uint256 hours_, uint256 pay) external {
        require(bytes(brief).length > 0 && bytes(brief).length <= 240, "brief");
        require(hours_ >= 1 && hours_ <= 336, "window");
        require(pay >= UNIT, "pay");
        require(vault[msg.sender] >= pay, "vault");
        vault[msg.sender] -= pay;
        jobs.push(Job({
            id: nextJob++,
            creator: msg.sender,
            worker: address(0),
            pay: pay,
            deadline: uint64(block.timestamp + hours_ * 1 hours),
            submittedAt: 0,
            state: 0,
            brief: brief,
            work: "",
            reason: ""
        }));
    }

    function submitJob(uint256 index, string calldata work) external {
        Job storage job = jobs[index];
        require(job.state == 0 && msg.sender != job.creator, "job");
        require(block.timestamp <= job.deadline, "window");
        require(bytes(work).length > 0 && bytes(work).length <= 240, "work");
        job.state = 1;
        job.worker = msg.sender;
        job.work = work;
        job.submittedAt = uint64(block.timestamp);
    }

    function approveJob(uint256 index) external {
        Job storage job = jobs[index];
        require(job.state == 1 && msg.sender == job.creator, "job");
        require(block.timestamp <= job.submittedAt + JOB_REVIEW, "late");
        job.state = 2;
        vault[job.worker] += job.pay;
    }

    function rejectJob(uint256 index, string calldata reason) external {
        Job storage job = jobs[index];
        require(job.state == 1 && msg.sender == job.creator, "job");
        require(block.timestamp <= job.submittedAt + JOB_REVIEW, "late");
        require(bytes(reason).length > 0 && bytes(reason).length <= 120, "reason");
        job.state = 3;
        job.reason = reason;
        vault[job.creator] += job.pay;
    }

    function settleJob(uint256 index) external {
        Job storage job = jobs[index];
        require(job.state == 1 && job.submittedAt > 0, "job");
        require(block.timestamp > job.submittedAt + JOB_REVIEW, "wait");
        job.state = 2;
        vault[job.worker] += job.pay;
    }

    function cancelJob(uint256 index) external {
        Job storage job = jobs[index];
        require(job.state == 0 && msg.sender == job.creator, "job");
        job.state = 3;
        vault[job.creator] += job.pay;
    }

    function _owner(address who) internal view returns (uint256) {
        for (uint256 i; i < 3; i++) if (owners[i] == who) return i;
        revert("owner");
    }

    function proposeWithdraw(address to, uint256 amount) external {
        uint256 id = _owner(msg.sender);
        require(!proposal.open, "pending");
        require(to != address(0) && amount > 0 && amount <= bank, "amount");
        proposal.to = to;
        proposal.amount = amount;
        proposal.open = true;
        proposal.sigs[0] = false;
        proposal.sigs[1] = false;
        proposal.sigs[2] = false;
        proposal.sigs[id] = true;
    }

    function approveWithdraw() external {
        proposal.sigs[_owner(msg.sender)] = true;
        require(proposal.open, "none");
    }

    function rejectWithdraw() external {
        _owner(msg.sender);
        require(proposal.open, "none");
        delete proposal;
    }

    function executeWithdraw() external {
        uint256 id = _owner(msg.sender);
        require(proposal.open && proposal.sigs[id], "sign");
        uint256 n;
        for (uint256 i; i < 3; i++) if (proposal.sigs[i]) n++;
        require(n >= 2, "two");
        uint256 amount = proposal.amount;
        address to = proposal.to;
        require(amount <= bank, "bank");
        bank -= amount;
        delete proposal;
        require(felt.transfer(to, amount), "transfer");
        emit HouseSent(amount, to);
    }

    /// Poker: ante, then call exactly 2× or fold.
    /// A qualifying house loss on a 1:1 hand returns ante×2 + call×2.
    function pokerDeal(uint256 ante) external bankOk(ante * 102) {
        require(ante >= MIN_BET && ante <= POKER_MAX_ANTE, "ante");
        require(poker[msg.sender].phase == 0, "open");
        _take(msg.sender, ante);
        Poker storage p = poker[msg.sender];
        p.phase = 1;
        p.ante = ante;
        p.boardCount = 3;
        p.left = 52;
        for (uint8 i; i < 52; i++) p.deck[i] = i;
        p.hole[0] = _draw(p);
        p.hole[1] = _draw(p);
        p.dealer[0] = _draw(p);
        p.dealer[1] = _draw(p);
        p.board[0] = _draw(p);
        p.board[1] = _draw(p);
        p.board[2] = _draw(p);
    }

    function pokerFold() external {
        Poker storage p = poker[msg.sender];
        require(p.phase == 1, "poker");
        uint256 ante = p.ante;
        p.phase = 0;
        _skim(ante, 0);
        emit Play(msg.sender, "poker", ante, 0, "fold");
    }

    function _draw(Poker storage p) internal returns (uint8) {
        require(p.left > 0, "shoe");
        uint256 j = _roll(p.left);
        uint8 card = p.deck[j];
        p.deck[j] = p.deck[p.left - 1];
        p.left -= 1;
        return card;
    }

    receive() external payable {}
}
