'use client';

import { useState } from 'react';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';
import { Button } from '@/components/ui/button';

interface MenubarProps {
  onAccountChange: (account: string | null) => void;
}

export default function Menubar({ onAccountChange }: MenubarProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      if (window.ethereum) {
        const client = createWalletClient({
          chain: mainnet,
          transport: custom(window.ethereum),
        });

        const [address] = await client.requestAddresses();
        onAccountChange(address);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold">Buy High, Sell Low</span>
          </div>
          <div className="flex items-center">
            <Button variant={'secondary'} onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect with Metamask'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
