'use client';

import axios from 'axios';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { createPublicClient, http, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

interface TokenHolding {
  name: string;
  value: number;
  color: string;
  symbol: string;
}

const PROTOCOL_CHAINS: Record<string, string[]> = {
  ethereum: ['mainnet', 'sepolia', 'holesky'],
  polygon: ['mainnet', 'amoy'],
  arbitrum: ['mainnet', 'sepolia'],
  optimism: ['mainnet', 'sepolia'],
};

const PROTOCOLS = Object.keys(PROTOCOL_CHAINS);

export default function HoldingsChart({ address }: { address: string | null }) {
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState('ethereum');
  const [selectedChain, setSelectedChain] = useState('mainnet');

  useEffect(() => {
    const availableChains = PROTOCOL_CHAINS[selectedProtocol];
    if (!availableChains.includes(selectedChain)) {
      setSelectedChain(availableChains[0]);
    }
  }, [selectedProtocol, selectedChain]);

  useEffect(() => {
    const fetchHoldings = async () => {
      if (!address) return;

      try {
        setIsLoading(true);
        const client = createPublicClient({
          chain: mainnet,
          transport: http(),
        });

        // Get ETH balance
        const balance = await client.getBalance({ address: address as `0x${string}` });
        const ethBalance = Number(formatEther(balance));

        const response = await axios
          .post(
            `https://web3.nodit.io/v1/${selectedProtocol}/${selectedChain}/token/getTokensOwnedByAccount`,
            {
              accountAddress: address,
              withCount: true,
            },
            {
              headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'X-API-KEY': process.env.NEXT_PUBLIC_NODIT_API_KEY,
              },
            },
          )
          .then((res) => {
            const data = res.data;
            const numTokens = data.count;
            if (numTokens <= 0) return;

            const tokens = data.items;
            // Flatten the tokens array to contain only name, value, and symbol
            const tokenHoldings: TokenHolding[] = tokens.map((token) => ({
              name: token.contract.name,
              value: Number(token.balance) / Math.pow(10, token.contract.decimals),
              symbol: token.contract.symbol,
              color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 70%)`,
            }));

            setHoldings(tokenHoldings);
          })
          .catch((err) => console.error(err));
      } catch (error) {
        console.error('Error fetching holdings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoldings();
  }, [address, selectedProtocol, selectedChain]);

  if (!address) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Connect your wallet to view holdings</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading holdings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={selectedProtocol}
          onChange={(e) => setSelectedProtocol(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          {PROTOCOLS.map((protocol) => (
            <option key={protocol} value={protocol}>
              {protocol}
            </option>
          ))}
        </select>
        <select
          value={selectedChain}
          onChange={(e) => setSelectedChain(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          {PROTOCOL_CHAINS[selectedProtocol].map((chain) => (
            <option key={chain} value={chain}>
              {chain}
            </option>
          ))}
        </select>
      </div>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={holdings}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {holdings.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value.toFixed(4)} ${props.payload.symbol}`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
