import { expect } from "chai";
import { network } from "hardhat";

describe("Lotto", function () {
  let lotto: any;
  let manager: any;
  let player1: any;
  let player2: any;
  let player3: any;
  let ethers: any;

  beforeEach(async function () {
    const networkConnection = await network.connect();
    ethers = networkConnection.ethers;
    [manager, player1, player2, player3] = await ethers.getSigners();
    lotto = await ethers.deployContract("Lotto");
  });

  describe("Deployment", function () {
    it("Should set the manager correctly", async function () {
      const lottoInfo = await lotto.getLottoInfo();
      expect(lottoInfo.playerCount).to.equal(0);
      expect(lottoInfo.prizePool).to.equal(0);
      expect(lottoInfo.minimumEntryFee).to.equal(ethers.parseEther("0.01"));
    });

    it("Should start unpaused", async function () {
      expect(await lotto.isPaused()).to.equal(false);
    });
  });

  describe("Entering the lottery", function () {
    it("Should allow players to enter with minimum fee", async function () {
      await lotto.connect(player1).enter({ value: ethers.parseEther("0.01") });

      expect(await lotto.getPlayersCount()).to.equal(1);
      expect(await lotto.hasPlayerEntered(player1.address)).to.equal(true);
    });

    it("Should reject entry with insufficient fee", async function () {
      await expect(
        lotto.connect(player1).enter({ value: ethers.parseEther("0.005") })
      ).to.be.revertedWithReason("Minimum entry fee required");
    });

    it("Should reject duplicate entries", async function () {
      await lotto.connect(player1).enter({ value: ethers.parseEther("0.01") });

      await expect(
        lotto.connect(player1).enter({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWithReason("Already entered");
    });

    it("Should reject manager participation", async function () {
      await expect(
        lotto.connect(manager).enter({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWithReason("Manager cannot participate");
    });

    it("Should accumulate prize pool", async function () {
      await lotto.connect(player1).enter({ value: ethers.parseEther("0.02") });
      await lotto.connect(player2).enter({ value: ethers.parseEther("0.03") });

      const lottoInfo = await lotto.getLottoInfo();
      expect(lottoInfo.prizePool).to.equal(ethers.parseEther("0.05"));
      expect(lottoInfo.playerCount).to.equal(2);
    });
  });

  describe("Starting lottery", function () {
    it("Should reject starting with no players", async function () {
      await expect(
        lotto.connect(manager).startLottery()
      ).to.be.revertedWithReason("No players in the lottery");
    });

    it("Should reject non-manager starting lottery", async function () {
      await lotto.connect(player1).enter({ value: ethers.parseEther("0.01") });

      await expect(
        lotto.connect(player1).startLottery()
      ).to.be.revertedWithReason("Only manager can call this function");
    });

    it("Should select winner and reset lottery", async function () {
      await lotto.connect(player1).enter({ value: ethers.parseEther("0.01") });
      await lotto.connect(player2).enter({ value: ethers.parseEther("0.01") });

      const initialBalance1 = await ethers.provider.getBalance(player1.address);
      const initialBalance2 = await ethers.provider.getBalance(player2.address);

      await lotto.connect(manager).startLottery();

      const finalBalance1 = await ethers.provider.getBalance(player1.address);
      const finalBalance2 = await ethers.provider.getBalance(player2.address);

      // One player should have received the prize
      const player1Won = finalBalance1 > initialBalance1;
      const player2Won = finalBalance2 > initialBalance2;

      expect(player1Won || player2Won).to.equal(true);
      expect(player1Won && player2Won).to.equal(false);

      // Lottery should be reset
      expect(await lotto.getPlayersCount()).to.equal(0);
      expect(await lotto.hasPlayerEntered(player1.address)).to.equal(false);
      expect(await lotto.hasPlayerEntered(player2.address)).to.equal(false);
    });
  });

  describe("Pause functionality", function () {
    it("Should allow manager to pause/unpause", async function () {
      await lotto.connect(manager).pause();
      expect(await lotto.isPaused()).to.equal(true);

      await lotto.connect(manager).pause();
      expect(await lotto.isPaused()).to.equal(false);
    });

    it("Should reject entries when paused", async function () {
      await lotto.connect(manager).pause();

      await expect(
        lotto.connect(player1).enter({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWithReason("Contract is paused");
    });

    it("Should allow emergency withdrawal when paused", async function () {
      await lotto.connect(player1).enter({ value: ethers.parseEther("0.01") });
      await lotto.connect(player2).enter({ value: ethers.parseEther("0.01") });

      await lotto.connect(manager).pause();

      const initialBalance = await ethers.provider.getBalance(manager.address);
      await lotto.connect(manager).emergencyWithdraw();
      const finalBalance = await ethers.provider.getBalance(manager.address);

      expect(finalBalance).to.be.greaterThan(initialBalance);
      expect(await lotto.getPlayersCount()).to.equal(0);
    });
  });
});
