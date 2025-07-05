import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  isLoading: boolean;
  chainId: number | null;
}

const WORLD_CHAIN_MAINNET_ID = 480; // World Chain mainnet
const WORLD_CHAIN_SEPOLIA_ID = 4801; // World Chain Sepolia testnet

const SUPPORTED_CHAINS = {
  [WORLD_CHAIN_MAINNET_ID]: {
    chainId: '0x1E0', // 480 in hex
    chainName: 'World Chain',
    rpcUrls: ['https://worldchain-mainnet.g.alchemy.com/public'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://worldscan.org'],
  },
  [WORLD_CHAIN_SEPOLIA_ID]: {
    chainId: '0x12C1', // 4801 in hex
    chainName: 'World Chain Sepolia',
    rpcUrls: ['https://worldchain-sepolia.g.alchemy.com/public'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://worldscan.org'],
  },
};

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    account: null,
    provider: null,
    signer: null,
    isConnected: false,
    isLoading: false,
    chainId: null,
  });

  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Check if user explicitly disconnected
        const wasDisconnected = localStorage.getItem('swagform_wallet_disconnected');
        if (wasDisconnected === 'true') {
          console.log('User previously disconnected, not auto-reconnecting');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        const network = await provider.getNetwork();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          setWalletState({
            account: accounts[0].address,
            provider,
            signer,
            isConnected: true,
            isLoading: false,
            chainId: Number(network.chainId),
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet!');
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true }));

    try {
      // Clear disconnect flag when user manually connects
      localStorage.removeItem('swagform_wallet_disconnected');
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();

      // Check if we're on a supported chain
      const chainId = Number(network.chainId);
      if (!isWorldChain(chainId)) {
        await switchToWorldChain(WORLD_CHAIN_MAINNET_ID);
      }

      setWalletState({
        account,
        provider,
        signer,
        isConnected: true,
        isLoading: false,
        chainId,
      });

      console.log('Wallet connected:', account);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const switchToWorldChain = async (targetChainId: number = WORLD_CHAIN_MAINNET_ID) => {
    const chainConfig = SUPPORTED_CHAINS[targetChainId];
    if (!chainConfig) {
      throw new Error('Unsupported chain ID');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainId }],
      });
    } catch (switchError: any) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          });
        } catch (addError) {
          console.error('Error adding World Chain:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  const switchToTestnet = async () => {
    await switchToWorldChain(WORLD_CHAIN_SEPOLIA_ID);
  };

  const switchToMainnet = async () => {
    await switchToWorldChain(WORLD_CHAIN_MAINNET_ID);
  };

  const isWorldChain = (chainId: number): boolean => {
    return chainId === WORLD_CHAIN_MAINNET_ID || chainId === WORLD_CHAIN_SEPOLIA_ID;
  };

  const isTestnet = (): boolean => {
    return walletState.chainId === WORLD_CHAIN_SEPOLIA_ID;
  };

  const isMainnet = (): boolean => {
    return walletState.chainId === WORLD_CHAIN_MAINNET_ID;
  };

  const getNetworkName = (): string => {
    if (walletState.chainId === WORLD_CHAIN_MAINNET_ID) return 'World Chain';
    if (walletState.chainId === WORLD_CHAIN_SEPOLIA_ID) return 'World Chain Sepolia';
    return 'Unknown Network';
  };

  const disconnectWallet = async () => {
    console.log('Disconnecting wallet...');
    
    try {
      // Set disconnect flag to prevent auto-reconnection
      localStorage.setItem('swagform_wallet_disconnected', 'true');
      
      // Clear wallet state immediately
      setWalletState({
        account: null,
        provider: null,
        signer: null,
        isConnected: false,
        isLoading: false,
        chainId: null,
      });
      
      // Try to disconnect from MetaMask if possible
      if (window.ethereum && window.ethereum.request) {
        try {
          // For MetaMask, we can try to revoke permissions
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          });
          console.log('Wallet permissions revoked');
        } catch (revokeError) {
          console.log('Could not revoke permissions (might not be supported):', revokeError.message);
          
          // Alternative: try to request account removal
          try {
            await window.ethereum.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }],
            });
          } catch (permError) {
            console.log('Alternative disconnect method also failed');
          }
        }
      }
      
      // Clear any localStorage data
      try {
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
        localStorage.removeItem('walletConnect');
      } catch (error) {
        console.warn('Error clearing localStorage:', error);
      }
      
      console.log('Wallet disconnected successfully');
      
    } catch (error) {
      console.error('Error during wallet disconnection:', error);
    }
  };

  useEffect(() => {
    checkConnection();

    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        checkConnection();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkConnection]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchToWorldChain,
    switchToTestnet,
    switchToMainnet,
    isCorrectChain: isWorldChain(walletState.chainId || 0),
    isTestnet: isTestnet(),
    isMainnet: isMainnet(),
    getNetworkName,
  };
};
