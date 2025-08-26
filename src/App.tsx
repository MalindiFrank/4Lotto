import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'

// Contract ABI - simplified for the UI
const LOTTO_ABI = [
  "function enter() external payable",
  "function startLottery() external",
  "function pause() external",
  "function emergencyWithdraw() external",
  "function getPlayersCount() external view returns (uint256)",
  "function isPaused() external view returns (bool)",
  "function hasPlayerEntered(address) external view returns (bool)",
  "function getLottoInfo() external view returns (uint256, uint256, uint256, address, address[])",
  "event PlayerEntered(address indexed player, uint256 amount)",
  "event WinnerSelected(address indexed winner, uint256 amount)",
  "event LottoReset()"
]

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [playerCount, setPlayerCount] = useState(0)
  const [prizePool, setPrizePool] = useState('0')
  const [isPaused, setIsPaused] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [entryAmount, setEntryAmount] = useState('0.01')
  const [isManager, setIsManager] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // replace with your deployed contract address when you deploy
  // for now, this is a placeholder - you need to deploy the contract first
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" // Default Hardhat local address

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(provider)
    }
  }, [])

  const connectWallet = async () => {
    if (!provider) {
      setMessage('Please install MetaMask!')
      return
    }

    try {
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setSigner(signer)
      setAccount(address)
      setIsConnected(true)

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, LOTTO_ABI, signer)
      setContract(contract)

      setMessage('Wallet connected successfully!')
      await loadContractData(contract, address)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setMessage('Failed to connect wallet')
    }
  }

  const loadContractData = async (contractInstance: ethers.Contract, userAddress: string) => {
    try {
      const lottoInfo = await contractInstance.getLottoInfo()
      setPlayerCount(Number(lottoInfo[0]))
      setPrizePool(ethers.formatEther(lottoInfo[1]))

      const paused = await contractInstance.isPaused()
      setIsPaused(paused)

      const entered = await contractInstance.hasPlayerEntered(userAddress)
      setHasEntered(entered)

      // Check if user is manager (first account in hardhat is usually the manager)
      const accounts = await provider?.listAccounts()
      if (accounts && accounts.length > 0) {
        setIsManager(userAddress.toLowerCase() === accounts[0].address.toLowerCase())
      }
    } catch (error) {
      console.error('Error loading contract data:', error)
      setMessage('Error loading contract data')
    }
  }

  const enterLottery = async () => {
    if (!contract) return

    setLoading(true)
    try {
      const tx = await contract.enter({
        value: ethers.parseEther(entryAmount)
      })
      await tx.wait()

      setMessage('Successfully entered the lottery!')
      await loadContractData(contract, account)
    } catch (error: any) {
      console.error('Error entering lottery:', error)
      setMessage(`Error: ${error.reason || error.message}`)
    }
    setLoading(false)
  }

  const startLottery = async () => {
    if (!contract) return

    setLoading(true)
    try {
      const tx = await contract.startLottery()
      await tx.wait()

      setMessage('Lottery started! Winner selected!')
      await loadContractData(contract, account)
    } catch (error: any) {
      console.error('Error starting lottery:', error)
      setMessage(`Error: ${error.reason || error.message}`)
    }
    setLoading(false)
  }

  const togglePause = async () => {
    if (!contract) return

    setLoading(true)
    try {
      const tx = await contract.pause()
      await tx.wait()

      setMessage(`Lottery ${isPaused ? 'unpaused' : 'paused'}!`)
      await loadContractData(contract, account)
    } catch (error: any) {
      console.error('Error toggling pause:', error)
      setMessage(`Error: ${error.reason || error.message}`)
    }
    setLoading(false)
  }

  const emergencyWithdraw = async () => {
    if (!contract) return

    setLoading(true)
    try {
      const tx = await contract.emergencyWithdraw()
      await tx.wait()

      setMessage('Emergency withdrawal completed!')
      await loadContractData(contract, account)
    } catch (error: any) {
      console.error('Error with emergency withdrawal:', error)
      setMessage(`Error: ${error.reason || error.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="app">
      <h1>Ethereum 4 Lotto</h1>

      {!isConnected ? (
        <div className="connect-section">
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet
          </button>
          <p>Connect your wallet to participate in the lottery</p>
        </div>
      ) : (
        <div className="lottery-interface">
          <div className="account-info">
            <p><strong>Account:</strong> {account.slice(0, 6)}...{account.slice(-4)}</p>
            {isManager && <span className="manager-badge">Manager</span>}
          </div>

          <div className="lottery-stats">
            <div className="stat">
              <h3>Players</h3>
              <p>{playerCount}</p>
            </div>
            <div className="stat">
              <h3>Prize Pool</h3>
              <p>{prizePool} ETH</p>
            </div>
            <div className="stat">
              <h3>Status</h3>
              <p>{isPaused ? 'Paused' : 'Active'}</p>
            </div>
          </div>

          {!isPaused && !hasEntered && !isManager && (
            <div className="enter-section">
              <h3>Enter Lottery</h3>
              <div className="input-group">
                <input
                  type="number"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="Amount in ETH"
                />
                <span>ETH (min: 0.01)</span>
              </div>
              <button
                onClick={enterLottery}
                disabled={loading}
                className="enter-btn"
              >
                {loading ? 'Entering...' : 'Enter Lottery'}
              </button>
            </div>
          )}

          {hasEntered && !isManager && (
            <div className="entered-section">
              <p>You have entered the lottery!</p>
              <p>Good luck! Wait for the manager to start the lottery.</p>
            </div>
          )}

          {isManager && (
            <div className="manager-section">
              <h3>Manager Controls</h3>
              <div className="manager-buttons">
                <button
                  onClick={startLottery}
                  disabled={loading || playerCount === 0}
                  className="start-btn"
                >
                  {loading ? 'Starting...' : 'Start Lottery'}
                </button>
                <button
                  onClick={togglePause}
                  disabled={loading}
                  className="pause-btn"
                >
                  {loading ? 'Processing...' : (isPaused ? 'Unpause' : 'Pause')}
                </button>
                {isPaused && (
                  <button
                    onClick={emergencyWithdraw}
                    disabled={loading}
                    className="emergency-btn"
                  >
                    {loading ? 'Withdrawing...' : 'Emergency Withdraw'}
                  </button>
                )}
              </div>
            </div>
          )}

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          <div className="refresh-section">
            <button
              onClick={() => contract && loadContractData(contract, account)}
              className="refresh-btn"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
