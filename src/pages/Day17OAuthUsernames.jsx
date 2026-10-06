import React from 'react';
import { Database, Zap, UserPlus, Server, ArrowRight, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Day17OAuthUsernames() {
  return (
    <article className="prose-container font-sans">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>Unique Usernames at Scale</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-8">
        In many social applications, allowing users to choose a unique, custom <code>@username</code> is critical for identity and shareability. However, enforcing uniqueness across millions of records introduces severe performance bottlenecks if not handled correctly.
      </p>

      <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-6 rounded-r-xl my-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-red-900 dark:text-red-200 mb-2">The Problem: O(N) Linear Scans</h4>
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
              If we query <code>SELECT * FROM users WHERE username = 'john'</code> without an index, the database engine must scan every single row in the table (a Linear Scan, O(N)). With 10 million users, this query could take hundreds of milliseconds. If thousands of users are typing in a username field simultaneously, the database CPU will max out, bringing down the entire application.
            </p>
          </div>
        </div>
      </div>

      <h2 className="prose-h2 mt-12 mb-6">The Solution: B-Tree Indexing & Debouncing</h2>
      
      <div className="space-y-6 text-[15px] my-8">
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#000000] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-3">
            <Database size={24} className="text-blue-500" /> 
            1. Database Indexing (O(log N))
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            To prevent the database from scanning every row, we add a <code>UNIQUE INDEX</code> to the <code>username</code> column in PostgreSQL:
          </p>
          <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-800">
            <code>ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);</code>
          </pre>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
            This creates a separate B-Tree data structure. Instead of checking 10 million rows, the database traverses the tree, finding or rejecting a username in just 3 or 4 hops (Logarithmic time, O(log N)). Lookup times drop from ~200ms to &lt;1ms.
          </p>
        </div>

        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#000000] shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-3">
            <Zap size={24} className="text-yellow-500" /> 
            2. UX: API Debouncing
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Even with a fast database, we don't want to bombard our backend with API calls for every single keystroke as the user types <code>j</code>... <code>o</code>... <code>h</code>... <code>n</code>. We implement a UI technique called <strong>Debouncing</strong>. The React frontend waits until the user <em>stops typing</em> for 500ms before firing the <code>/api/auth/check-username</code> request. This reduces API traffic by up to 80%.
          </p>
        </div>
      </div>

      <h2 className="prose-h2 mt-12 mb-6">The Implementation: The 2-Step OAuth Flow</h2>
      <p className="text-slate-700 dark:text-slate-300 mb-8">
        Standard Passport.js Google OAuth immediately creates a user. To support custom usernames without messy database states, we broke it into a stateless 2-step process:
      </p>

      {/* Static Minimal Diagram */}
      <div className="my-8 p-8 bg-[#0d1117] border border-[#30363d] rounded-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto text-slate-300">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-xl border-2 border-slate-700 flex items-center justify-center bg-slate-800/50">
              <UserPlus size={24} className="text-blue-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">1. OAuth Callback</span>
            <span className="text-xs text-slate-400 w-24">Google Profile via JWT Temp Token</span>
          </div>
          
          <ArrowRight className="text-slate-600 hidden md:block" />
          
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-xl border-2 border-slate-700 flex items-center justify-center bg-slate-800/50">
              <Zap size={24} className="text-yellow-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">2. UI Debounce</span>
            <span className="text-xs text-slate-400 w-24">User typing name &lt; 500ms delay</span>
          </div>

          <ArrowRight className="text-slate-600 hidden md:block" />

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-xl border-2 border-slate-700 flex items-center justify-center bg-slate-800/50">
              <Database size={24} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">3. DB Index</span>
            <span className="text-xs text-slate-400 w-24">B-Tree Lookup in O(log N)</span>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-6 rounded-r-xl my-8">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 mb-2">Key Takeaway</h4>
            <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Never allow raw UI keystrokes to dictate database load. A combination of frontend debouncing and backend B-Tree indexing guarantees that even high-frequency validation checks remain highly performant at scale.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
