import React from 'react';
import { Server, Database, ShieldAlert, ArrowRight, XCircle } from 'lucide-react';

export default function Day11APIProtection() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>API Protection (The Distributed Flaw)</span>
      </h1>

      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        In Day 5, we added an In-Memory Rate Limiter to stop attackers from spamming our API. It works perfectly for a single server. But in a massive System Design, single servers do not exist.
      </p>

      <h2 className="prose-h2">The Flaw of In-Memory Rate Limiting</h2>
      <p>
        When a system scales to handle millions of users, we place multiple copies of our Node.js server behind a <strong>Load Balancer</strong>. This is called Horizontal Scaling.
      </p>

      <p>
        If an attacker tries to bypass our limit of <code>100 requests / minute</code> by sending <strong>500 requests</strong>, the Load Balancer will evenly distribute them: 100 requests to Server A, 100 to Server B, 100 to Server C, etc.
      </p>

      {/* Diagram */}
      <div className="my-10 p-8 bg-slate-50 dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-[#30363d] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-8 text-center">The Horizontal Bypass Attack</h3>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Attacker */}
          <div className="flex flex-col items-center z-10">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
              <ShieldAlert size={28} />
            </div>
            <div className="font-bold text-sm text-slate-700 dark:text-slate-300">Attacker</div>
            <div className="text-xs font-mono text-red-500 bg-red-500/10 px-2 py-1 rounded mt-1">500 Req/min</div>
          </div>

          <div className="text-slate-300 dark:text-[#333] rotate-90 md:rotate-0">
            <ArrowRight size={24} />
          </div>

          {/* Load Balancer */}
          <div className="flex flex-col items-center z-10">
            <div className="px-6 py-8 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-400 dark:border-indigo-600 rounded-lg flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shadow-lg">
              Load Balancer
            </div>
            <div className="text-xs text-slate-500 mt-2">Distributes Traffic</div>
          </div>

          <div className="hidden md:flex flex-col justify-between h-48 py-4">
            <ArrowRight size={20} className="text-slate-300 dark:text-[#444]" />
            <ArrowRight size={20} className="text-slate-300 dark:text-[#444]" />
            <ArrowRight size={20} className="text-slate-300 dark:text-[#444]" />
          </div>

          {/* Servers */}
          <div className="flex flex-col gap-4 z-10 w-full md:w-auto">
            {[1, 2, 3].map((serverNum) => (
              <div key={serverNum} className="flex items-center gap-4 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] p-3 rounded-lg shadow-sm">
                <div className="p-2 bg-slate-100 dark:bg-[#21262d] rounded">
                  <Server size={20} className="text-slate-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Node Server {serverNum}</span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">RAM: 100 Req (OK!)</span>
                </div>
                <div className="ml-auto pl-4">
                  <XCircle size={18} className="text-red-500" />
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="mt-8 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-400 font-medium text-center">
          Result: Because each server only tracks its own RAM, the attacker successfully bypasses the limit and hits the database 500 times.
        </div>
      </div>

      <h2 className="prose-h2">The Solution: A Centralized Store</h2>
      <p>
        To fix this, the servers cannot store their hit-counts in their own isolated memory. They must all talk to a single, centralized data store.
      </p>

      <p>
        <strong>Why not PostgreSQL?</strong> If we force our PostgreSQL database to update a counter for every single API request just to check if a user is rate-limited, we will instantly exhaust our Connection Pool (which we just fixed in Day 9) and crash the database.
      </p>

      <p>
        We need a storage mechanism that is shared across all servers, but operates entirely in RAM so it can respond in microseconds without bottlenecking the database.
      </p>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-lg my-6">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Enter Redis</h3>
        <p className="text-sm text-blue-900/80 dark:text-blue-200/70">
          This architectural flaw perfectly dictates the need for an external In-Memory Datastore like Redis. But before we install it to fix our Rate Limiter, we will discover in Day 12 that Redis solves a much bigger Database problem as well.
        </p>
      </div>

    </article>
  );
}
