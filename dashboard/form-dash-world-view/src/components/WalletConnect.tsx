import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

interface WalletConnectProps {
  onDisconnect?: () => void;
}

const WalletConnect = ({ onDisconnect }: WalletConnectProps) => {
  const { 
    account, 
    isConnected, 
    isLoading, 
    connectWallet, 
    disconnectWallet, 
    isCorrectChain, 
    switchToWorldChain,
    switchToTestnet,
    switchToMainnet,
    isTestnet,
    isMainnet,
    getNetworkName
  } = useWallet();

  const handleDisconnect = async () => {
    await disconnectWallet();
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Se non è connesso o non ha un account, mostra la schermata di connessione
  if (!isConnected || !account) {
    return (
      <Card className="p-8 max-w-md mx-auto bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-xl">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600">
              Connect to World Chain to access the SwagForm dashboard
            </p>
          </div>

          <Button 
            onClick={connectWallet}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </div>
            )}
          </Button>

          <div className="text-sm text-gray-500">
            <p>Make sure you have MetaMask or another Web3 wallet installed</p>
            <p className="mt-1">Supports World Chain Mainnet and Sepolia Testnet</p>
          </div>
        </div>
      </Card>
    );
  }

  // Se è connesso, mostra i controlli del wallet
  return (
    <div className="flex items-center space-x-3">
      {!isCorrectChain && (
        <Card className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Wrong Network</p>
                <p className="text-xs text-amber-600">Switch to World Chain</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => switchToWorldChain()}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 h-auto"
            >
              Switch
            </Button>
          </div>
        </Card>
      )}

      <div className="flex items-center space-x-3">
        {/* User Badge */}
        <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <Badge variant="secondary" className="bg-white/80 text-gray-800 font-mono text-xs px-2 py-0.5 h-auto">
                {formatAddress(account)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Network Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-2 bg-white/80 hover:bg-white border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={isTestnet ? "destructive" : "default"} 
                  className={isTestnet 
                    ? "bg-orange-100 text-orange-800 border-orange-200" 
                    : "bg-blue-100 text-blue-800 border-blue-200"
                  }
                >
                  <div className="flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isTestnet ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                    <span className="text-xs">{isTestnet ? 'Testnet' : 'Mainnet'}</span>
                  </div>
                </Badge>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
            <DropdownMenuItem 
              onClick={switchToMainnet} 
              disabled={isMainnet}
              className="cursor-pointer hover:bg-blue-50"
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`w-2 h-2 rounded-full ${isMainnet ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <span className="flex-1">World Chain Mainnet</span>
                {isMainnet && <CheckCircle className="w-4 h-4 text-blue-500" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={switchToTestnet} 
              disabled={isTestnet}
              className="cursor-pointer hover:bg-orange-50"
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`w-2 h-2 rounded-full ${isTestnet ? 'bg-orange-500' : 'bg-gray-300'}`} />
                <span className="flex-1">World Chain Sepolia</span>
                {isTestnet && <CheckCircle className="w-4 h-4 text-orange-500" />}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Disconnect Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 bg-white/80 border-gray-200 shadow-sm transition-all duration-200"
        >
          <span className="hidden sm:inline">Disconnect</span>
          <span className="sm:hidden">×</span>
        </Button>
      </div>
    </div>
  );
};

export default WalletConnect;
