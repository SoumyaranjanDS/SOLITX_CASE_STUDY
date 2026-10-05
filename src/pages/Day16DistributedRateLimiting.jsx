import React from 'react';
import { Database, Zap, Server, Users, ArrowRight, Shield } from 'lucide-react';

export default function Day16DistributedRateLimiting() {
  return (
    <article className="prose-container font-sans">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>The Final Cache Lifecycle & Distributed Limits</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        In Day 11, we saw that our Rate Limiter was fundamentally broken when scaled horizontally. Because Node servers A, B, and C weren't communicating, a single user could bypass the rate limit by hitting different servers through the Load Balancer. Now that we have Redis, we've solved this.
      </p>

      <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-6 rounded-r-xl my-8">
        <div className="flex items-start gap-4">
          <Shield className="text-emerald-500 mt-1" size={24} />
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 mb-2">The Distributed Fix</h4>
            <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
              We swapped our in-memory Node.js rate limiter to use <code>rate-limit-redis</code>. Now, when Node Server A receives a request, it asks Redis: <em>"How many requests has this IP made across the entire network?"</em> Because Redis is a centralized, ultra-fast data store, all 3 servers share the exact same state. The attacker can no longer bypass the system limit.
            </p>
          </div>
        </div>
      </div>

      <h2 className="prose-h2">The Three Pillars of our Data Layer</h2>
      
      <div className="space-y-6 text-[15px] my-8">
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#000000] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-3">
            <Database size={24} className="text-orange-500" /> 
            1. PostgreSQL (The Source of Truth)
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            PostgreSQL is a robust, disk-based Relational Database. It is highly durable and handles complex relational queries (like "Find all followers of user X who liked post Y"). However, disk I/O is slow and CPU-heavy. We added <strong>B-Tree Indexes</strong> (Day 7) to prevent full table scans and <strong>Connection Pooling</strong> (Day 9) to prevent connection exhaustion, ensuring it runs as efficiently as possible.
          </p>
        </div>

        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#000000] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-3">
            <Zap size={24} className="text-emerald-500" /> 
            2. Redis (The Accelerator & Shield)
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Redis is an in-memory (RAM) key-value store. It operates at O(1) time complexity, meaning it can fetch data in nanoseconds regardless of dataset size. It serves a dual purpose in our architecture: it acts as a <strong>Distributed Rate Limiter</strong> (protecting the API from DDoS attacks) and as a <strong>Cache-Aside datastore</strong> (protecting PostgreSQL from Repeated Reads).
          </p>
        </div>

        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#000000] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-3">
            <Server size={24} className="text-indigo-500" /> 
            3. Node.js (The Orchestrator)
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Node.js is the application layer that glues the two databases together. It handles <strong>Cache Invalidation</strong> on writes to prevent stale data, implements <strong>Request Coalescing</strong> to prevent Cache Stampedes on TTL expiration, and executes the complex cursor-based pagination logic for infinite scrolling feeds.
          </p>
        </div>
      </div>

      <h2 className="prose-h2">The Complete Cache Lifecycle</h2>
      <p className="text-slate-700 dark:text-slate-300 mb-8">
        When a user loads a profile page, here is the exact lifecycle of the request traversing through our architecture:
      </p>

      {/* Static Minimal Diagram */}
      <div className="my-8 p-8 bg-[#0d1117] border border-[#30363d] rounded-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto text-slate-300">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center bg-slate-800/50">
              <Users size={24} className="text-blue-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Client</span>
          </div>
          
          <ArrowRight className="text-slate-600 hidden md:block" />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-xl border-2 border-slate-700 flex items-center justify-center bg-slate-800/50">
              <Server size={24} className="text-indigo-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Node.js</span>
          </div>

          <ArrowRight className="text-slate-600 hidden md:block" />

          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-xl border-2 border-slate-700 flex items-center justify-center bg-slate-800/50">
              <Zap size={24} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Redis</span>
          </div>

          <ArrowRight className="text-slate-600 hidden md:block" />

          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center bg-slate-800/50">
              <Database size={24} className="text-orange-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">PostgreSQL</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold shrink-0">1</div>
          <p className="pt-1 text-slate-700 dark:text-slate-300"><strong>Ingestion & Rate Check:</strong> The Client sends a request to the Node.js API. Node.js immediately asks Redis if the user's IP has exceeded the limit of 100 requests per 15 minutes. If yes, it returns 429 Too Many Requests. If no, Redis increments the count and allows the request.</p>
        </div>
        
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold shrink-0">2</div>
          <p className="pt-1 text-slate-700 dark:text-slate-300"><strong>Cache Check:</strong> Node.js asks Redis if the requested user profile (e.g., <code>user:soumya</code>) exists in memory. If it does (Cache Hit), Node.js instantly returns the data to the Client, bypassing PostgreSQL entirely.</p>
        </div>

        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold shrink-0">3</div>
          <p className="pt-1 text-slate-700 dark:text-slate-300"><strong>Database Read:</strong> If the data is missing (Cache Miss), Node.js sends a SQL query to PostgreSQL over a pooled connection, utilizing B-Tree indexes to find the row quickly without scanning the whole table.</p>
        </div>

        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold shrink-0">4</div>
          <p className="pt-1 text-slate-700 dark:text-slate-300"><strong>Cache Population:</strong> Node.js saves the result into Redis with a 5-minute Time-To-Live (TTL). For the next 5 minutes, any subsequent requests for this profile will be handled purely in RAM at step 2.</p>
        </div>
      </div>

      <div className="my-12 p-8 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-2xl">
        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-4">Executive Summary: The Cache Journey</h2>
        <div className="space-y-4 text-blue-800 dark:text-blue-300 leading-relaxed text-sm">
          <p>
            <strong>The Problem:</strong> Querying the database for the same static output every single time causes severe CPU load and eventual database crashes.
          </p>
          <p>
            <strong>The First Solution:</strong> We introduced <strong>Redis</strong>, a RAM-based datastore. When a profile is requested, we first check Redis. On a <em>Cache Miss</em>, we query PostgreSQL, store the result in Redis with an expiration time, and return it. Subsequent requests hit Redis directly, keeping the main database load-free.
          </p>
          <p>
            <strong>The Second Problem (Inconsistency):</strong> If a user edits their profile while the cache is still active, Redis continues serving the old, stale data.
          </p>
          <p>
            <strong>The Second Solution:</strong> To overcome this, we configured every write request (e.g., updating a bio) to do two things simultaneously: update the information in PostgreSQL, and immediately <strong>delete the old key from Redis</strong>. The next read forces a fresh fetch.
          </p>
          <p>
            <strong>The Final Problem (Stampede):</strong> When a highly popular cache key expires, a massive traffic spike (e.g., 10k requests at once) will trigger 10k simultaneous cache misses, crashing the database exactly like the first problem.
          </p>
          <p>
            <strong>The Final Solution:</strong> We prevent this using <strong>Request Coalescing (Locks)</strong>. When a sudden spike occurs during a cache miss, we allow only <em>one</em> request to pass through to the database while locking out the others. Once that single request stores the fresh data in Redis, the locks open, and all waiting requests are served safely from the cache.
          </p>
        </div>
      </div>

    </article>
  );
}
