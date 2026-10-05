import React from 'react';
import { Database, Search, Zap, Loader2 } from 'lucide-react';

export default function Day12RepeatedReads() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>The Repeated Reads Problem</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        In Day 11, we saw that Rate Limiting requires a centralized, ultra-fast memory store. But there is an even bigger Database architectural flaw that forces us to use one: <strong>Repeated Reads</strong>.
      </p>

      <h2 className="prose-h2">The "Cristiano Ronaldo" Problem</h2>
      <p>
        Imagine a massive celebrity joins SOLITX and publishes a post. Suddenly, 10 million users click on their profile to see their bio and follower count.
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-4">
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
<span className="text-[#ff7b72]">SELECT</span> id, username, bio, followers_count <br/>
<span className="text-[#ff7b72]">FROM</span> users <br/>
<span className="text-[#ff7b72]">WHERE</span> username = <span className="text-[#a5d6ff]">'cristiano'</span>;
          </code>
        </pre>
      </div>

      <p>
        Our backend takes this SQL query and sends it to PostgreSQL. PostgreSQL must parse the query, search the index, read the disk, and return the row.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Loader2 size={64} className="animate-spin" />
          </div>
          <h3 className="font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
            <Database size={18} />
            The Inefficiency
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 relative z-10">
            PostgreSQL will execute that exact same query <strong>10 million times</strong> in one hour. But Ronaldo's bio and username didn't change! The database is wasting massive amounts of CPU doing the exact same work over and over again.
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-6 rounded-xl relative overflow-hidden">
          <h3 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            <Zap size={18} />
            The Crash
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 relative z-10">
            Relational databases are designed for ACID compliance (strict data integrity), not for serving identical reads millions of times a second. If we don't fix this, the DB CPU will hit 100% and SOLITX will go offline.
          </p>
        </div>
      </div>

      <h2 className="prose-h2">The Cache-Aside Pattern</h2>
      <p>
        To fix this, we need a <strong>Cache</strong>. A cache is a layer of extremely fast, RAM-based memory sitting in front of the database. When someone asks for Ronaldo's profile, we follow a new logic flow:
      </p>

      <div className="my-8 p-6 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl font-mono text-sm">
        <ol className="list-decimal pl-5 space-y-4 text-slate-600 dark:text-slate-400">
          <li>
            <strong className="text-indigo-600 dark:text-indigo-400 font-sans">Check Cache:</strong> Backend asks the Cache: <span className="text-slate-800 dark:text-slate-200">"Do you have 'user:cristiano'?"</span>
          </li>
          <li>
            <strong className="text-emerald-600 dark:text-emerald-400 font-sans">Cache Hit:</strong> If YES, return it instantly. (Database does 0 work).
          </li>
          <li>
            <strong className="text-orange-600 dark:text-orange-400 font-sans">Cache Miss:</strong> If NO, backend queries PostgreSQL.
          </li>
          <li>
            <strong className="text-blue-600 dark:text-blue-400 font-sans">Save & Return:</strong> Backend saves the result in the Cache for 5 minutes, then returns it to the user.
          </li>
        </ol>
      </div>

      <p>
        By doing this, PostgreSQL only executes the query <strong>1 time every 5 minutes</strong>, instead of 10 million times. The other 9,999,999 requests are served instantly from RAM by the Cache.
      </p>

      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
        <p className="font-medium text-slate-800 dark:text-slate-200">
          Just like our Distributed Rate Limiter, this requires a centralized In-Memory Datastore. This means we can no longer delay it. It is officially time to install <strong>Redis</strong> in Day 13.
        </p>
      </div>

    </article>
  );
}
