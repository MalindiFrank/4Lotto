// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Lotto {
  address private manager;
  address private winner;
  address[] private players;
  uint256 private minimumEntry = 0.01 ether;
  uint256 private nonce;
  bool private paused;
  bool private locked;

  mapping(address => bool) private hasEntered;

  event PlayerEntered(address indexed player, uint256 amount);
  event WinnerSelected(address indexed winner, uint256 amount);
  event LottoReset();

  constructor() {
    manager = msg.sender;
  }

  modifier restricted() {
    require(msg.sender == manager, "Only manager can call this function");
    _;
  }

  modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
  }

  function reset() private {
    for (uint256 i = 0; i < players.length; i++) {
      hasEntered[players[i]] = false;
    }
    players = new address[](0);
    winner = address(0);
    emit LottoReset();
  }

  function startLottery() public restricted nonReentrant {
    require(players.length > 0, "No players in the lottery");
    selectWinner();
    reset();
  }

  function enter() public payable nonReentrant {
    require(!paused, "Contract is paused");
    require(msg.value >= minimumEntry, "Minimum entry fee required");
    require(!hasEntered[msg.sender], "Already entered");
    require(msg.sender != manager, "Manager cannot participate");

    players.push(msg.sender);
    hasEntered[msg.sender] = true;

    emit PlayerEntered(msg.sender, msg.value);
  }

  function transferFunds(address addr) private {
    uint256 amount = address(this).balance;
    winner = addr;

    (bool success, ) = payable(addr).call{value: amount}("");
    require(success, "Transfer failed");

    emit WinnerSelected(addr, amount);
  }

  function selectWinner() private {
    require(players.length > 0, "No players");
    address winnerAddress = getRandomAddress(players);
    transferFunds(winnerAddress);
  }

  function getRandomAddress(address[] memory addrArr) private returns (address) {
    nonce++;
    uint256 randomIndex = uint256(
      keccak256(
        abi.encodePacked(
          block.timestamp,
          block.prevrandao,
          nonce,
          addrArr.length
        )
      )
    ) % addrArr.length;

    return addrArr[randomIndex];
  }

  function pause() public restricted {
    paused = !paused;
  }

  function emergencyWithdraw() public restricted {
    require(paused, "Must be paused");
    uint256 amount = address(this).balance;

    (bool success, ) = payable(manager).call{value: amount}("");
    require(success, "Withdrawal failed");

    reset();
  }

  function getPlayersCount() public view returns (uint256) {
    return players.length;
  }

  function isPaused() public view returns (bool) {
    return paused;
  }

  function hasPlayerEntered(address player) public view returns (bool) {
    return hasEntered[player];
  }

  function getLottoInfo() public view returns (
    uint256 playerCount,
    uint256 prizePool,
    uint256 minimumEntryFee,
    address winnerAddress,
    address[] memory playersAddress
  ) {
    return (players.length, address(this).balance, minimumEntry, winner, players);
  }

  function getPlayers() public view returns (address[] memory) {
    return players;
  }
}
