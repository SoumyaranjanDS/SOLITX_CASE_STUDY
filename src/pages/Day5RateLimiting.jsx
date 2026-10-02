import React from 'react';

export default function Day5RateLimiting() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Day 05
        </span>
        <span>Rate Limiting & Server Protection</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        On Day 4, I built a highly secure, stateless authentication system using <code className="text-sm bg-slate-100 dark:bg-[#222] px-1.5 py-0.5 rounded">bcryptjs</code> to hash passwords. But that security created a massive vulnerability.
      </p>

      <h2 className="prose-h2">The Problem: Event Loop Exhaustion</h2>
      <p>
        <code>bcrypt</code> is intentionally designed to be mathematically "heavy" and slow to calculate. This makes it impossible for hackers to brute-force steal passwords if they ever hack the database.
      </p>
      
      <p>
        However, Node.js runs on a single thread. If an attacker writes a script that spams the <code>/api/v1/auth/login</code> endpoint 1,000 times a second, the Node.js server will try to run that heavy bcrypt math 1,000 times. It will consume 100% of the server's CPU. While the server is busy hashing those fake passwords, legitimate users won't be able to load their feed. The entire API will freeze.
      </p>

      <h2 className="prose-h2">The Solution: Rate Limiting</h2>
      <p>
        To stop this, I need to implement Rate Limiting. I need a piece of middleware that sits in front of the controller. It will look at the IP address of the person making the request. If they try to login more than 5 times in 15 minutes, the Rate Limiter immediately blocks them with a <code>429 Too Many Requests</code> error, saving the CPU.
      </p>

      <div className="my-8 p-6 bg-slate-50 dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-[#333]">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4">Comparing The Algorithms</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-[#111] rounded-lg border border-slate-100 dark:border-[#222]">
            <strong className="text-blue-600 dark:text-blue-400 block mb-1">1. Fixed Window</strong>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              "You get 5 requests between 1:00 PM and 1:15 PM." <br/>
              <em className="text-black dark:text-white not-italic font-medium">Pros:</em> Extremely simple and fast. <br/>
              <em className="text-black dark:text-white not-italic font-medium">Cons:</em> Vulnerable to spikes at the edges of the window (e.g., 5 requests at 1:14 PM, and 5 more at 1:15 PM allows 10 requests in 2 minutes).
            </p>
          </div>
          
          <div className="p-4 bg-white dark:bg-[#111] rounded-lg border border-slate-100 dark:border-[#222]">
            <strong className="text-emerald-600 dark:text-emerald-400 block mb-1">2. Sliding Window</strong>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              "You get 5 requests in the *last* 15 minutes, constantly recalculating." <br/>
              <em className="text-black dark:text-white not-italic font-medium">Pros:</em> More accurate, prevents edge spikes. <br/>
              <em className="text-black dark:text-white not-italic font-medium">Cons:</em> Takes significantly more memory to store exact timestamps for every request.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#111] rounded-lg border border-slate-100 dark:border-[#222]">
            <strong className="text-purple-600 dark:text-purple-400 block mb-1">3. Token Bucket</strong>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              "You have a bucket of 5 tokens. Every request takes a token. We add 1 token back every 3 minutes." <br/>
              <em className="text-black dark:text-white not-italic font-medium">Pros:</em> Very smooth, allows for short bursts of traffic. Standard for major APIs like Stripe.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#333]">
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            <span>
              Want to see the actual code for these algorithms? <a href="https://blog.algomaster.io/p/rate-limiting-algorithms-explained-with-code" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Read this excellent technical breakdown by Algomaster</a>.
            </span>
          </p>
        </div>
      </div>

      <h2 className="prose-h2">The Decision: In-Memory Fixed Window</h2>
      <p>
        For Day 5, I chose an <strong>In-Memory Fixed Window</strong> approach using the industry-standard <code>express-rate-limit</code> package.
      </p>
      
      <p>
        <strong>Wait, why not build a custom Token Bucket algorithm?</strong><br/>
        We absolutely could write a Token Bucket algorithm from scratch in Node.js RAM. But, it's reinventing the wheel for a single-server setup. <code>express-rate-limit</code> is highly tested and executes a Fixed Window algorithm perfectly to solve our immediate problem: protecting the CPU.
      </p>

      <p>
        <strong>When will we use the advanced algorithms?</strong><br/>
        When we eventually scale to multiple servers and introduce <strong>Redis</strong>, we will ditch this basic package. Redis has specialized data structures (like <code>Sorted Sets</code>) and atomic Lua scripts that make executing custom Sliding Window or Token Bucket algorithms incredibly fast across distributed systems. We will build that from scratch when the architecture demands it.
      </p>

      <h2 className="prose-h2">The Next Problem</h2>
      <p>
        In-memory rate limiting works perfectly for our current Monolith. But, what happens when we eventually scale horizontally and have <em>two</em> Node.js servers behind a Load Balancer?
      </p>

      <p>
        Server A won't know about Server B's memory. A hacker could hit Server A 5 times, then hit Server B 5 times, bypassing the limit. This will eventually require that centralized memory store (Redis).
      </p>

      <p>
        <strong className="text-emerald-600 dark:text-emerald-400">Objective for Day 6:</strong> Before we scale horizontally, we need to design the core Database schema (Users, Posts, Follows) and learn how the database engine handles relational data.
      </p>
    </article>
  );
}
