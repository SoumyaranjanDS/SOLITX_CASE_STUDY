import React, { useState } from 'react';
import { Database, Zap, RefreshCw, AlertTriangle, CheckCircle2, Edit3, Trash2 } from 'lucide-react';

export default function Day14CacheInvalidation() {
  const [loading, setLoading] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);
  const [updateResult, setUpdateResult] = useState(null);
  const [newBio, setNewBio] = useState("");

  const fetchUser = async () => {
    setLoading(true);
    setUpdateResult(null); // Clear update message
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/test/user/soumya`);
      const data = await res.json();
      setFetchResult(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updateUserBio = async (e) => {
    e.preventDefault();
    if (!newBio) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/test/user/soumya`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: newBio })
      });
      const data = await res.json();
      
      setUpdateResult("Database Updated & Cache Invalidated!");
      setNewBio(""); // Clear input
    } catch (err) {
      console.error(err);
      setUpdateResult("Failed to update.");
    }
    
    setLoading(false);
  };

  return (
    <article className="prose-container font-sans">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>Cache Invalidation (The Hardest Problem)</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        In Day 13, we cached profiles in Redis for 5 minutes. But there's a fatal flaw: what if the user updates their profile 1 minute later?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-6 rounded-xl">
          <h3 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={18} />
            The Stale Data Problem
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            If we update PostgreSQL, but leave the old profile in Redis, millions of users will continue to see the old profile for the remaining 4 minutes. This is called <strong>Stale Data</strong>.
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-6 rounded-xl">
          <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
            <Trash2 size={18} />
            Cache Invalidation
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            The solution is simple but crucial: whenever the backend updates a row in PostgreSQL, it must immediately send a <code>DEL user:soumya</code> command to Redis.
          </p>
        </div>
      </div>

      <h2 className="prose-h2">Interactive Demo</h2>
      <p>
        Let's see this in action. First, fetch the user (which will cache it). Then, update the bio. Finally, fetch the user again and watch how the Cache Miss forces the fresh data to load.
      </p>

      <div className="my-8 p-6 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl flex flex-col xl:flex-row gap-8">
        
        {/* Left Column: Fetch & Display */}
        <div className="flex-1 flex flex-col gap-4">
          <button 
            onClick={fetchUser}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm"
          >
            <Zap size={18} />
            1. Fetch Profile (soumya)
          </button>

          {fetchResult && (
            <div className={`p-4 rounded-xl border ${
              fetchResult.source === 'cache' 
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' 
                : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-xs">Current Data</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  fetchResult.source === 'cache' ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' : 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
                }`}>
                  {fetchResult.source === 'cache' ? '⚡ CACHE HIT' : '🐘 CACHE MISS (DB)'}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1"><strong>Username:</strong> {fetchResult.user.username}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Bio:</strong> {fetchResult.user.bio || 'null'}</p>
            </div>
          )}
        </div>

        {/* Right Column: Update */}
        <div className="flex-1 flex flex-col gap-4">
          <form onSubmit={updateUserBio} className="flex flex-col gap-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">2. Update Bio (Invalidates Cache)</label>
            <input 
              type="text" 
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              placeholder="Enter a new bio..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-[#333] bg-white dark:bg-[#000000] text-slate-900 dark:text-white"
            />
            <button 
              type="submit"
              disabled={loading || !newBio}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <Edit3 size={18} />
              Update Bio & Delete Cache
            </button>
          </form>

          {updateResult && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
              <CheckCircle2 className="text-blue-500" size={24} />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{updateResult}</p>
            </div>
          )}
        </div>

      </div>

      <p className="text-slate-600 dark:text-slate-400">
        <em>As the famous quote goes: "There are only two hard things in Computer Science: cache invalidation and naming things."</em>
      </p>

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Deep Dive: Consistency Strategies</h2>
        
        <div className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>
            Keeping a Cache (Redis) and a Database (PostgreSQL) perfectly synchronized is one of the hardest problems in distributed systems. When a user updates their profile, we must ensure the cache reflects that change immediately. 
          </p>
          
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">The 3 Major Invalidation Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#0d1117] p-5 rounded-xl border border-slate-200 dark:border-[#30363d] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">1. Write-Around (Used Here)</h4>
              <p className="text-sm">The backend updates PostgreSQL, and immediately sends a <code>DEL key</code> command to Redis. The very next GET request misses the cache, fetches the fresh DB row, and re-caches it. <strong>Pros:</strong> Extremely simple, prevents caching data that is rarely read. <strong>Cons:</strong> The very first read after an update suffers a latency penalty.</p>
            </div>
            
            <div className="bg-white dark:bg-[#0d1117] p-5 rounded-xl border border-slate-200 dark:border-[#30363d] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">2. Write-Through</h4>
              <p className="text-sm">The backend updates PostgreSQL, and then immediately runs <code>SET key</code> in Redis with the newly updated data. <strong>Pros:</strong> The next read is instantly fast because the cache is already primed. <strong>Cons:</strong> If 10 users update their bio but nobody looks at their profiles, you wasted Redis RAM storing useless data.</p>
            </div>
            
            <div className="bg-white dark:bg-[#0d1117] p-5 rounded-xl border border-slate-200 dark:border-[#30363d] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
              <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-2">3. Write-Back</h4>
              <p className="text-sm">The backend updates <em>only Redis</em>, returning success instantly to the user. A background worker periodically saves the Redis data to PostgreSQL asynchronously. <strong>Pros:</strong> Lightning-fast writes. <strong>Cons:</strong> High risk of permanent data loss if Redis crashes before the DB is synced.</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">The Danger of Race Conditions</h3>
          <p>
            What happens if the backend successfully updates PostgreSQL, but the network drops and the <code>redis.del()</code> command fails?
          </p>
          <div className="bg-red-50 dark:bg-red-950/20 p-5 rounded-xl border border-red-200 dark:border-red-900/30">
            <p className="text-sm text-red-800 dark:text-red-300">
              You enter a state of permanent inconsistency. The DB has the new data, Redis has the old data, and since the deletion failed, it will stay that way until the 5-minute TTL finally expires. This is why <strong>TTL is critical as a safety net</strong>—even if cache invalidation fails, the data will self-correct after the TTL expires.
            </p>
          </div>
        </div>
      </div>

    </article>
  );
}
