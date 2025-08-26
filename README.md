# Ethereum Lottery DApp

A simple decentralized lottery application built with Solidity, Hardhat, and React.

## Features

- **Enter Lottery**: Players can enter by sending a minimum of 0.01 ETH
- **Random Winner Selection**: Manager can start the lottery to select a random winner
- **Prize Pool**: All entry fees are collected and awarded to the winner
- **Pause/Resume**: Manager can pause the lottery for maintenance
- **Emergency Withdrawal**: Manager can withdraw funds when paused
- **Reentrancy Protection**: Built-in security against reentrancy attacks

## Smart Contract

The `Lotto.sol` contract includes:
- Manager-only functions (start lottery, pause, emergency withdraw)
- Player functions (enter lottery)
- View functions (get lottery info, check if player entered)
- Events for transparency (PlayerEntered, WinnerSelected, LottoReset)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npx hardhat test
```

### 3. Start Local Blockchain
```bash
npx hardhat node
```

### 4. Deploy Contract (in a new terminal)
```bash
npx hardhat ignition deploy ignition/modules/Lotto.ts --network localhost
```

### 5. Start React UI
```bash
npm run dev
```

### 6. Setup MetaMask
1. Add localhost network to MetaMask:
   - Network Name: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import test accounts from Hardhat node output into MetaMask

3. Update the `CONTRACT_ADDRESS` in `src/App.tsx` with the deployed contract address

## Usage

1. **Manager (First Account)**: Can start lottery, pause/unpause, and emergency withdraw
2. **Players (Other Accounts)**: Can enter lottery with minimum 0.01 ETH
3. **Winner Selection**: Manager starts lottery, random winner receives all funds
4. **Reset**: After winner selection, lottery resets for next round

## Contract Functions

### Public Functions
- `enter()` - Enter lottery with ETH payment
- `getPlayersCount()` - Get number of current players
- `isPaused()` - Check if lottery is paused
- `hasPlayerEntered(address)` - Check if address has entered
- `getLottoInfo()` - Get complete lottery information

### Manager-Only Functions
- `startLottery()` - Select winner and distribute prize
- `pause()` - Toggle pause state
- `emergencyWithdraw()` - Withdraw funds when paused

## Security Features

- Reentrancy protection on critical functions
- Manager cannot participate in lottery
- Minimum entry fee requirement
- Duplicate entry prevention
- Emergency pause functionality

## Testing

The project includes comprehensive tests covering:
- Contract deployment
- Player entry validation
- Manager controls
- Winner selection
- Pause functionality
- Emergency withdrawal

Run tests with:
```bash
npx hardhat test
```

## Technology Stack

- **Solidity**: Smart contract development
- **Hardhat**: Development environment and testing
- **React**: Frontend user interface
- **TypeScript**: Type-safe development
- **Ethers.js**: Ethereum interaction library
- **Vite**: Fast development server
