import React from 'react';

export default function Day9ConnectionPooling() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>Database Connection Pooling</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        In Day 8, we discovered a massive bottleneck. Our Node.js server was throttling itself because it only allowed 10 concurrent connections to the database, causing 6+ second delays and massive timeouts. Today, we fix it.
      </p>

      <h2 className="prose-h2">1. The Fix (Increasing the Pool)</h2>
      <p>
        We opened <code>backend/src/config/db.js</code> and explicitly told the PostgreSQL driver (<code>pg.Pool</code>) to maintain up to 100 concurrent connections to our Neon Database instead of the default 10.
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
          <span className="text-xs font-mono text-[#8b949e]">backend/src/config/db.js</span>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
<span className="text-[#ff7b72]">const</span> pool = <span className="text-[#ff7b72]">new</span> <span className="text-[#d2a8ff]">Pool</span>({'{\n'}
&nbsp;&nbsp;connectionString: process.env.DATABASE_URL,<br/>
&nbsp;&nbsp;ssl: {'{'} rejectUnauthorized: <span className="text-[#79c0ff]">true</span> {'}'},<br/>
<span className="text-[#79c0ff] bg-blue-900/30 -mx-4 px-4 block border-l-2 border-blue-500">&nbsp;&nbsp;max: 100, <span className="text-[#8b949e]">// Increased from default 10</span></span>
{'}'});
          </code>
        </pre>
      </div>

      <p>
        <em>Note:</em> We are able to use 100 connections safely because our <code>DATABASE_URL</code> routes through Neon's built-in Serverless <strong>PgBouncer</strong> pooler, which manages the connections to the actual PostgreSQL instance automatically.
      </p>

      <h2 className="prose-h2">2. The Results (10x Performance)</h2>
      <p>
        We re-ran the exact same 500-connection Autocannon attack. The results were immediate and staggering.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        
        {/* Before */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-6 rounded-xl flex flex-col">
          <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Day 8 (No Pool)</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">26 <span className="text-sm font-normal text-slate-500">Req/Sec</span></div>
          
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex justify-between border-b border-red-200 dark:border-red-900/30 pb-2">
              <span>Avg Latency:</span> <span className="font-mono font-bold text-red-600 dark:text-red-400">6,296 ms</span>
            </li>
            <li className="flex justify-between border-b border-red-200 dark:border-red-900/30 pb-2">
              <span>Timeouts (Crashes):</span> <span className="font-mono font-bold text-red-600 dark:text-red-400">235</span>
            </li>
            <li className="flex justify-between pb-2">
              <span>Total Processed:</span> <span className="font-mono font-bold">1,000</span>
            </li>
          </ul>
        </div>

        {/* After */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-6 rounded-xl flex flex-col relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Day 9 (Pool = 100)</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">255 <span className="text-sm font-normal text-emerald-600/70">Req/Sec</span></div>
          
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 relative z-10">
            <li className="flex justify-between border-b border-emerald-200 dark:border-emerald-900/30 pb-2">
              <span>Avg Latency:</span> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">1,834 ms (70% Faster)</span>
            </li>
            <li className="flex justify-between border-b border-emerald-200 dark:border-emerald-900/30 pb-2">
              <span>Timeouts (Crashes):</span> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">0 (Perfect)</span>
            </li>
            <li className="flex justify-between pb-2">
              <span>Total Processed:</span> <span className="font-mono font-bold">3,000 (3x Volume)</span>
            </li>
          </ul>
        </div>

      </div>

      <h2 className="prose-h2">Conclusion</h2>
      <p>
        By simply allowing Node.js to open 100 pipes to the database instead of 10, we achieved a <strong>10x increase in throughput</strong>, completely eliminated all timeout crashes, and processed 3,000 requests in 10 seconds.
      </p>
      
      <p className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
        <em>Note:</em> You cannot just increase the pool size to 10,000. PostgreSQL requires ~10MB of RAM per connection. 10,000 connections would require 100GB of RAM just to hold the connections open! This is why Pool Managers (like PgBouncer) and careful capacity estimation are critical.
      </p>

    </article>
  );
}
