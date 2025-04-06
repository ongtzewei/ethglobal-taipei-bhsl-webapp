'use client';

import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

interface TokenHolding {
  name: string;
  value: number;
  color: string;
  symbol: string;
  price: number;
}

interface TokenData {
  contract: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
  };
  balance: string;
}

const getNativeTokenContract = (protocol: string) => {
  const nativeTokens: Record<string, { name: string; symbol: string; decimals: number; address: string }> = {
    ethereum: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    },
    polygon: {
      name: 'Polygon',
      symbol: 'POL',
      decimals: 18,
      address: '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6',
    },
    base: {
      name: 'Base',
      symbol: 'BASE',
      decimals: 18,
      address: '0xd07379a755a8f11b57610154861d694b2a0f615a',
    },
    arbitrum: {
      name: 'Arbitrum',
      symbol: 'ARB',
      decimals: 18,
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    },
    optimism: {
      name: 'Optimism',
      symbol: 'OP',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000042',
    },
  };

  return (
    nativeTokens[protocol] || {
      name: protocol.charAt(0).toUpperCase() + protocol.slice(1),
      symbol: protocol.toUpperCase(),
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    }
  );
};

const PROTOCOL_CHAINS: Record<string, string[]> = {
  base: ['mainnet', 'sepolia'],
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
  const lastChangeRef = useRef<'protocol' | 'chain' | null>(null);

  useEffect(() => {
    if (lastChangeRef.current === 'protocol') {
      setSelectedChain('mainnet');
    } else if (lastChangeRef.current === 'chain') {
      setSelectedProtocol('ethereum');
    }
    lastChangeRef.current = null;
  }, [selectedProtocol, selectedChain]);

  const handleProtocolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    lastChangeRef.current = 'protocol';
    setSelectedProtocol(e.target.value);
  };

  const handleChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    lastChangeRef.current = 'chain';
    setSelectedChain(e.target.value);
  };

  useEffect(() => {
    const availableChains = PROTOCOL_CHAINS[selectedProtocol];
    if (!availableChains.includes(selectedChain)) {
      setSelectedChain(availableChains[0]);
    }
  }, [selectedProtocol, selectedChain]);

  useEffect(() => {
    const fetchHoldings = async () => {
      setHoldings([]);
      if (!address) return;

      try {
        setIsLoading(true);

        // fetch native token
        const nativeTokenResponse = await axios
          .post(
            `https://web3.nodit.io/v1/${selectedProtocol}/${selectedChain}/native/getNativeBalanceByAccount`,
            {
              accountAddress: address,
            },
            {
              headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'X-API-KEY': process.env.NEXT_PUBLIC_NODIT_API_KEY,
              },
            },
          )
          .catch((err) => {
            console.error(err);
            return null;
          });

        if (!nativeTokenResponse) {
          console.error('Failed to fetch native token balance');
          return;
        }

        // fetch all other tokens
        await axios
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
          .then(async (res) => {
            const data = res.data;
            const numTokens = data.count;

            const tokens: TokenData[] = data.items;
            const nativeTokenContract = getNativeTokenContract(selectedProtocol);
            const nativeTokenBalance = nativeTokenResponse?.data.balance;

            tokens.push({
              contract: nativeTokenContract,
              balance: nativeTokenBalance,
            });

            // fetch token prices
            const tokenAddresses = tokens.map((token) => token.contract.address);
            const response = await axios
              .post(
                `https://web3.nodit.io/v1/${selectedProtocol}/${selectedChain}/token/getTokenPricesByContracts`,
                {
                  contractAddresses: tokenAddresses,
                  currency: 'USD',
                },
                {
                  headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    'X-API-KEY': process.env.NEXT_PUBLIC_NODIT_API_KEY,
                  },
                },
              )
              .catch((err) => console.error(err));

            // @ts-expect-error: ignore
            const tokenPrices = response.data;

            const prices = tokenPrices.reduce(
              // @ts-expect-error: ignore
              (acc, tokenPrice) => {
                const address = tokenPrice.contract.address.toLowerCase();
                acc[address] = {
                  price: tokenPrice.price ? Number(tokenPrice.price) : 0,
                  updatedAt: tokenPrice.updatedAt,
                };
                return acc;
              },
              {} as Record<string, { price: number; updatedAt: string | null }>,
            );

            // Calculate token values with market prices
            const tokenHoldings: TokenHolding[] = tokens
              .map((token) => {
                const tokenAmount = Number(token.balance) / Math.pow(10, token.contract.decimals);
                const tokenPrice = prices[token.contract.address.toLowerCase()]?.price || 0;
                const value = tokenAmount * tokenPrice;

                return {
                  name: token.contract.name,
                  value,
                  symbol: token.contract.symbol,
                  color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 70%)`,
                  price: tokenPrice,
                };
              })
              .filter((holding) => holding.value > 0);
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
        <select value={selectedProtocol} onChange={handleProtocolChange} className="px-4 py-2 border rounded-md">
          {PROTOCOLS.map((protocol) => (
            <option key={protocol} value={protocol}>
              {protocol}
            </option>
          ))}
        </select>
        <select value={selectedChain} onChange={handleChainChange} className="px-4 py-2 border rounded-md">
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
                `$${value.toFixed(2)} (${(value / props.payload.price).toFixed(4)} ${props.payload.symbol})`,
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
