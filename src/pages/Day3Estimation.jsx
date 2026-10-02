import React from 'react';

export default function Day3Estimation() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Day 03
        </span>
        <span>Capacity Estimation</span>
      </h1>

      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        Before writing a single line of backend logic, I needed to know exactly what scale I was building for. Building a social platform requires understanding data volume, read/write ratios, and bandwidth.
      </p>

      <h2 className="prose-h2">What is "Back-of-the-Envelope" Math?</h2>
      <p>
        In system design, "Back-of-the-envelope estimation" is just a fancy term for doing rough, fast math to figure out if your architecture will actually survive in the real world.
      </p>

      <div className="my-6 p-8 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100 rounded-r-xl leading-relaxed">
        <strong className="text-xl block mb-4 font-bold">A Practical Example: Server Capacity</strong>
        <p className="mb-4">Imagine we need to serve <strong>46 million read requests per day</strong>, and benchmarking shows a single application server can comfortably handle <strong>7 requests per second (RPS)</strong>. How many servers do we need?</p>
        
        <strong className="block mb-2 text-sm uppercase tracking-wider text-blue-700 dark:text-blue-300">Step 1: Calculate Capacity Per Server</strong>
        <ul className="list-disc ml-6 mb-4 font-mono text-sm space-y-1">
          <li>7 requests / sec</li>
          <li>7 &times; 60 = 420 requests / min</li>
          <li>420 &times; 60 = 25,200 requests / hour (Round to ~24K for safe estimation)</li>
          <li>24K &times; 24 hours = 576,000 requests / day (Round to ~600K requests / day)</li>
        </ul>

        <strong className="block mb-2 text-sm uppercase tracking-wider text-blue-700 dark:text-blue-300">Step 2: Calculate Total Servers Needed</strong>
        <ul className="list-disc ml-6 mb-4 font-mono text-sm space-y-1">
          <li>Total load: 46 Million requests</li>
          <li>Server capacity: 0.6 Million requests</li>
          <li>Math: 46M / 0.6M &approx; 45 / 0.5 = <strong>90 servers</strong></li>
        </ul>

        <strong className="block mb-2 text-sm uppercase tracking-wider text-blue-700 dark:text-blue-300">Step 3: Add the Real-World Buffer</strong>
        <p className="text-sm">We never deploy exactly 90 servers. We multiply by 2x (180 servers) to act as a conservative buffer for peak traffic spikes, server failures, redundancy, and maintenance windows. This is the essence of capacity planning.</p>
      </div>

      <h2 className="prose-h2">Applying the Math to SOLITX</h2>
      <p className="mb-6">
        For my platform, my stated boundary is <strong className="text-emerald-600 dark:text-emerald-400">20,000 Daily Active Users (DAU)</strong>. Social media platforms are extremely read-heavy (usually a 100:1 read-to-write ratio). Let's calculate exactly how much load this generates.
      </p>

      <div className="pl-4 border-l-2 border-slate-200 dark:border-[#333] space-y-6">
        <div>
          <strong className="block mb-2 text-sm uppercase tracking-wider text-black dark:text-white">Step 1: Calculate Daily Read Requests</strong>
          <ul className="list-disc ml-6 font-mono text-sm space-y-1 text-slate-700 dark:text-slate-300">
            <li>Users: 20,000 DAU</li>
            <li>Usage: Opens app 5 times / day</li>
            <li>Volume: Fetches 50 posts / visit</li>
            <li>Math: 20,000 &times; 5 &times; 50 = <strong>5,000,000 requests / day</strong></li>
          </ul>
        </div>

        <div>
          <strong className="block mb-2 text-sm uppercase tracking-wider text-black dark:text-white">Step 2: Calculate Throughput (RPS)</strong>
          <ul className="list-disc ml-6 font-mono text-sm space-y-1 text-slate-700 dark:text-slate-300">
            <li>Total load: 5,000,000 requests / day</li>
            <li>Seconds in a day: 86,400</li>
            <li>Math: 5,000,000 / 86,400 &approx; <strong>57 Requests Per Second (RPS)</strong></li>
            <li>Peak traffic buffer (4x multiplier): 57 &times; 4 &approx; <strong>228 RPS</strong></li>
          </ul>
        </div>
        
        <div>
          <strong className="block mb-2 text-sm uppercase tracking-wider text-black dark:text-white">Step 3: Calculate Storage</strong>
          <ul className="list-disc ml-6 font-mono text-sm space-y-1 text-slate-700 dark:text-slate-300">
            <li>Assume 10% of users post daily: 2,000 posts</li>
            <li>Average text size: 200 bytes</li>
            <li>Math: 2,000 &times; 200 bytes = <strong>400 KB / day</strong> (Practically zero)</li>
          </ul>
        </div>
      </div>

      <div className="my-8 p-6 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-[#333]">
        <p className="font-mono text-sm text-[#666] dark:text-[#a1a1aa] leading-relaxed">
          <strong className="text-black dark:text-white not-italic text-base">The Conclusion:</strong><br /><br />
          A single, basic Node.js server connected to a PostgreSQL database can handle ~200 RPS in its sleep. This mathematical proof definitively invalidates the need for microservices, Redis caching, or Kafka on Day 1. I am building for a dirt road right now, not a 10-lane highway.
        </p>
      </div>

      <h2 className="prose-h2">The Next Problem</h2>
      <p>
        Now that I have proven mathematically that a monolith can handle the initial load, I need to actually build the engine.
      </p>

      <p>
        <strong className="text-emerald-600 dark:text-emerald-400">Objective for Day 4:</strong> Architect the core Node.js application and build a stateless JWT authentication system that won't become a bottleneck when I eventually *do* need to scale horizontally.
      </p>
    </article>
  );
}
