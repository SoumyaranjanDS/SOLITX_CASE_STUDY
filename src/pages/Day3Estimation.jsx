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

      <h2 className="prose-h2">Back of the Envelope Math</h2>
      <p>
        I assumed a target of <strong className="text-emerald-600 dark:text-emerald-400">20,000 Daily Active Users (DAU)</strong>. Social media platforms are extremely read-heavy (usually a 100:1 read-to-write ratio).
      </p>
      
      <ul className="prose-ul">
        <li><strong className="text-black dark:text-white">Traffic:</strong> If each user opens the app 5 times a day and fetches 50 posts per visit, that is 5,000,000 read requests per day.</li>
        <li><strong className="text-black dark:text-white">Storage:</strong> If 10% of users post once a day (2,000 posts), and each post averages 200 bytes of text, text storage is negligible. However, media (images/video) will consume significant bandwidth.</li>
        <li><strong className="text-black dark:text-white">Throughput:</strong> 5 million requests / 86,400 seconds ≈ 57 Requests Per Second (RPS) on average, peaking to maybe 200 RPS during high traffic.</li>
      </ul>

      <div className="my-8 p-6 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-[#333]">
        <p className="font-mono text-sm text-[#666] dark:text-[#a1a1aa] leading-relaxed">
          <strong className="text-black dark:text-white not-italic text-base">Conclusion:</strong><br/><br/>
          A single, well-optimized Node.js instance connected to PostgreSQL can easily handle 200 RPS without breaking a sweat. This mathematical proof definitively invalidates the need for microservices on Day 1.
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
