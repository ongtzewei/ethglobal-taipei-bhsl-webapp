'use client';

import { useState } from 'react';
import Menubar from "@/components/Menubar";
import Sidepanel from "@/components/Sidepanel";
import HoldingsChart from "@/components/HoldingsChart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Menubar onAccountChange={setAccount} />
      <div className="flex">
        <main className="flex-1 p-8 mr-[30%]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">Portfolio Overview</h1>
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Your Holdings</h2>
              </CardHeader>
              <CardContent>
                <HoldingsChart address={account} />
              </CardContent>
            </Card>
          </div>
        </main>
        <Sidepanel />
      </div>
    </div>
  );
}
