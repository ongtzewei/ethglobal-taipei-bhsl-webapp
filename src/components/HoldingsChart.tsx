'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { createPublicClient, http, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

interface TokenHolding {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function HoldingsChart({ address }: { address: string | null }) {
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHoldings = async () => {
      if (!address) return;

      try {
        setIsLoading(true);
        const client = createPublicClient({
          chain: mainnet,
          transport: http()
        });

        // Get ETH balance
        const balance = await client.getBalance({ address: address as `0x${string}` });
        const ethBalance = Number(formatEther(balance));

        // For demo purposes, we'll create some mock token holdings
        // In a real app, you would fetch actual token balances
        const mockHoldings: TokenHolding[] = [
          { name: 'ETH', value: ethBalance, color: COLORS[0] },
          { name: 'USDC', value: 1000, color: COLORS[1] },
          { name: 'DAI', value: 500, color: COLORS[2] },
          { name: 'WBTC', value: 0.1, color: COLORS[3] },
          { name: 'LINK', value: 50, color: COLORS[4] },
        ];

        setHoldings(mockHoldings);
      } catch (error) {
        console.error('Error fetching holdings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoldings();
  }, [address]);

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
    <div className="h-[400px] w-full">
      <p className="text-gray-500">{address}</p>
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
          <Tooltip formatter={(value: number) => value.toFixed(4)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 