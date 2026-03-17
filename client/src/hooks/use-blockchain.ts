import { useState } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_CONFIG, DID_REGISTRY_ABI } from '@shared/blockchain';

export function useBlockchain() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      setWalletAddress(accounts[0]);
      return accounts[0];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to connect wallet');
    }
  };

  const switchToSepolia = async () => {
    try {
      if (!window.ethereum) throw new Error('Wallet not found');
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia testnet
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xaa36a7',
              chainName: 'Sepolia',
              rpcUrls: [SEPOLIA_CONFIG.RPC_URL],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
      } else {
        throw error;
      }
    }
  };

  const registerDIDOnBlockchain = async (did: string, idNumber: string): Promise<string> => {
    setIsRegistering(true);
    try {
      if (!window.ethereum) throw new Error('Wallet not found');

      // Connect wallet and switch network
      await connectWallet();
      await switchToSepolia();

      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Pre-check using read-only Infura provider (no MetaMask popup)
      const readProvider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.RPC_URL);
      const readContract = new ethers.Contract(
        SEPOLIA_CONFIG.CONTRACT_ADDRESS,
        DID_REGISTRY_ABI,
        readProvider
      );

      try {
        const existing = await readContract.getIdentity(did);
        // existing[1] is idHash — non-empty string means already registered
        if (existing && existing[1] && existing[1].length > 0) {
          throw new Error('ALREADY_REGISTERED');
        }
      } catch (checkErr: any) {
        if (checkErr.message === 'ALREADY_REGISTERED') throw checkErr;
        // Any other error means DID is not registered — safe to continue
      }

      // Create writable contract instance with signer
      const contract = new ethers.Contract(
        SEPOLIA_CONFIG.CONTRACT_ADDRESS,
        DID_REGISTRY_ABI,
        signer
      );

      // Generate SHA256 hash of ID number for privacy
      const encodedId = new TextEncoder().encode(idNumber);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedId);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const idHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Call registerDID function
      let tx;
      try {
        tx = await contract.registerDID(did, idHash);
      } catch (contractErr: any) {
        // Parse smart contract revert reasons
        const raw = contractErr?.reason || contractErr?.data?.message || contractErr?.message || '';
        if (raw.includes('DID already registered') || raw.includes('already registered')) {
          throw new Error('ALREADY_REGISTERED');
        }
        if (contractErr?.code === 4001 || raw.includes('user rejected')) {
          throw new Error('Transaction was cancelled by the user.');
        }
        throw new Error('Smart contract error: ' + (contractErr?.shortMessage || raw || 'Unknown error'));
      }
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (!receipt || !receipt.hash) {
        throw new Error('Transaction failed to execute');
      }

      return receipt.hash;
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * When a DID is already on-chain but DB shows pending (e.g. after page refresh),
   * find the original tx hash by scanning DIDRegistered event logs.
   */
  const recoverTxHashFromChain = async (did: string): Promise<string | null> => {
    try {
      const readProvider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.RPC_URL);
      const readContract = new ethers.Contract(
        SEPOLIA_CONFIG.CONTRACT_ADDRESS,
        DID_REGISTRY_ABI,
        readProvider
      );

      // Query DIDRegistered event logs (scan last ~500k blocks)
      const latestBlock = await readProvider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 500000);

      const filter = readContract.filters.DIDRegistered();
      const events = await readContract.queryFilter(filter, fromBlock, latestBlock);

      // Find the event matching our DID
      for (const event of events) {
        const args = (event as any).args;
        if (args && args[0] === did) {
          return event.transactionHash;
        }
      }
      return null;
    } catch (err) {
      console.error('Error recovering tx hash:', err);
      return null;
    }
  };

  const verifyDIDOnBlockchain = async (did: string) => {
    try {
      if (!window.ethereum) throw new Error('Wallet not found');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Create read-only contract instance
      const contract = new ethers.Contract(
        SEPOLIA_CONFIG.CONTRACT_ADDRESS,
        DID_REGISTRY_ABI,
        provider
      );

      // Call getIdentity function
      const result = await contract.getIdentity(did);
      
      return {
        did: result[0],
        idHash: result[1],
        timestamp: parseInt(result[2]),
        owner: result[3],
        registered: true,
      };
    } catch (error: any) {
      return { registered: false };
    }
  };

  return {
    connectWallet,
    switchToSepolia,
    registerDIDOnBlockchain,
    recoverTxHashFromChain,
    verifyDIDOnBlockchain,
    walletAddress,
    isRegistering,
  };
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
