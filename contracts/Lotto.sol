// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lotto {
    address public manager;
    // fixed-size array for gas efficiency
    address[10] private players; 
    uint256 public playerCount;
    mapping(address => bool) public hasEntered;
    mapping(address => uint256) public deposits;
    address public winner;
    uint256 public prizePool;
    uint256 public constant MIN_ENTRY = 0.000000001 ether;
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant MANAGER_FEE = 1; // 1%
    uint256 public lotteryDeadline;
    uint256 public constant DURATION = 72 hours;
    bool public paused;
    bool private locked;

    event PlayerEntered(address player, uint256 amount);
    event WinnerSelected(address winner);
    event PrizeClaimed(address winner, uint256 amount);
    event RefundIssued(address player, uint256 amount);
    event LotteryReset();

    modifier onlyManager() {
        require(msg.sender == manager, "Only manager");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrancy guard");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        manager = msg.sender;
    }

    function enter() external payable nonReentrant {
        require(!paused, "Paused");
        require(msg.value >= MIN_ENTRY, "Insufficient funds");
        require(!hasEntered[msg.sender], "Already entered");
        require(playerCount < MAX_PLAYERS, "Max players reached");

        if (playerCount == 0) {
            lotteryDeadline = block.timestamp + DURATION;
        }

        players[playerCount] = msg.sender;
        hasEntered[msg.sender] = true;
        deposits[msg.sender] = msg.value;
        prizePool += msg.value;
        playerCount++;
        emit PlayerEntered(msg.sender, msg.value);
    }

    function startLottery() external onlyManager nonReentrant {
        require(!paused, "Paused");
        require(block.timestamp < lotteryDeadline, "Deadline passed");
        require(playerCount > 0, "No players");

        // simple randomness to choose winner
        winner = players[uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % playerCount];
        emit WinnerSelected(winner);
    }

    function forceEnd() external nonReentrant {
        require(block.timestamp >= lotteryDeadline, "Deadline not passed");
        require(playerCount > 0, "No players");
        // players must call claimRefund() individually
    }

    function claimRefund() external nonReentrant {
        uint256 amount = deposits[msg.sender];
        require(amount > 0, "No refund");
        require(block.timestamp >= lotteryDeadline, "Deadline not passed");

        deposits[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        emit RefundIssued(msg.sender, amount);
    }

    function claimPrize() external nonReentrant {
        require(msg.sender == winner, "Not winner");
        require(prizePool > 0, "No prize");

        uint256 fee = (prizePool * MANAGER_FEE) / 100;
        uint256 prize = prizePool - fee;

        (bool success, ) = winner.call{value: prize}("");
        require(success, "Prize transfer failed");

        (success, ) = manager.call{value: fee}("");
        require(success, "Fee transfer failed");

        emit PrizeClaimed(winner, prize);
        _reset();
    }

    function _reset() private {
        prizePool = 0;
        winner = address(0);
        lotteryDeadline = 0;
        playerCount = 0;

        // clear player data ~fixed array is automatically reset
        for (uint256 i = 0; i < MAX_PLAYERS; i++) {
            hasEntered[players[i]] = false;
            deposits[players[i]] = 0;
        }
    }

    // emergency functions
    function setPaused(bool _paused) external onlyManager {
        paused = _paused;
    }

    function emergencyWithdraw() external onlyManager {
        require(paused, "Only when paused");
        payable(manager).transfer(address(this).balance);
    }
}
