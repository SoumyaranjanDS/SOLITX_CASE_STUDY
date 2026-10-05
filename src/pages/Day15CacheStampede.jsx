import React, { useState, useEffect } from 'react';
import { Database, Zap, Users, AlertTriangle, ShieldCheck, Clock, Server, RefreshCw } from 'lucide-react';

export default function Day15CacheStampede() {
  const [stampeding, setStampeding] = useState(false);
  const [dbLoad, setDbLoad] = useState(0);
  const [requests, setRequests] = useState([]);
  const [mode, setMode] = useState('unprotected'); // 'unprotected' | 'protected'

  const simulateStampede = () => {
    setStampeding(true);
    setRequests([]);
    setDbLoad(0);
    
    // Simulate exactly at TTL Expiration
    setTimeout(() => {
      // 50 concurrent requests arrive in the same millisecond
      const newRequests = Array(50).fill(0).map((_, i) => ({ id: i, status: 'checking' }));
      setRequests(newRequests);
      
      setTimeout(() => {
        if (mode === 'unprotected') {
          // Unprotected: ALL 50 requests miss cache and hit DB
          setRequests(newRequests.map(r => ({ ...r, status: 'db' })));
          setDbLoad(100);
        } else {
          // Protected (Promise Coalescing): Only 1 hits DB, 49 wait
          setRequests(newRequests.map((r, i) => ({ ...r, status: i === 0 ? 'db' : 'waiting' })));
          setDbLoad(2); // DB is safe!
          
          setTimeout(() => {
            // After 1 finishes, all 49 get the cached result
            setRequests(newRequests.map(r => ({ ...r, status: 'cache' })));
          }, 1500);
        }
        
        setTimeout(() => setStampeding(false), 2000);
      }, 500);
    }, 500);
  };

  return (
    <article className="prose-container font-sans">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>The Cache Stampede (Thundering Herd)</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        We added a 5-minute TTL (Time To Live) to Redis. What happens exactly at 5 minutes and 1 second?
      </p>

      <div className="bg-[#0d1117] p-6 rounded-xl border border-slate-200 dark:border-[#30363d] my-8">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" />
          The Disaster Scenario
        </h3>
        <ul className="text-slate-300 space-y-3 font-mono text-sm">
          <li><span className="text-emerald-400">04:59</span> - Redis serves 10,000 requests per second. DB is sleeping.</li>
          <li><span className="text-orange-400">05:00</span> - TTL Expires. Redis deletes the cache.</li>
          <li><span className="text-red-400">05:01</span> - 10,000 concurrent requests arrive.</li>
          <li><span className="text-red-400">05:01</span> - All 10,000 check Redis. All get a Cache Miss.</li>
          <li><span className="text-red-500 font-bold">05:01</span> - All 10,000 query PostgreSQL at the exact same millisecond.</li>
          <li><span className="text-red-600 font-bold">05:02</span> - PostgreSQL crashes. SOLITX goes offline.</li>
        </ul>
      </div>

      <h2 className="prose-h2">Solutions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-[#30363d]">
          <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">1. Request Coalescing (Locks)</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">When the cache misses, the backend acquires a Distributed Lock. The first request queries the DB. The other 9,999 requests wait in line. When the 1st request saves to Redis, the others immediately fetch from Redis.</p>
        </div>
        <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-[#30363d]">
          <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">2. Jitter</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">Instead of setting TTL to exactly 5 minutes, we add random "Jitter" (e.g. 5 minutes + random 0 to 60 seconds). This ensures massive lists of keys don't all expire at the exact same millisecond.</p>
        </div>
      </div>

      <h2 className="prose-h2">Stampede Simulator</h2>
      <p>Select a mode and run the simulation to see what happens when the TTL expires and 50 users hit the backend simultaneously.</p>

      <div className="my-8 p-6 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl flex flex-col gap-6">
        
        <div className="flex gap-4">
          <button 
            onClick={() => setMode('unprotected')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'unprotected' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
          >
            Unprotected (Stampede)
          </button>
          <button 
            onClick={() => setMode('protected')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'protected' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
          >
            Protected (Request Coalescing)
          </button>
        </div>

        <button 
          onClick={simulateStampede}
          disabled={stampeding}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {stampeding ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
          Simulate TTL Expiration
        </button>

        <div className="flex flex-col md:flex-row gap-6 mt-4">
          
          {/* Requests visualization */}
          <div className="flex-1 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-xl p-4">
            <h4 className="font-bold text-sm mb-4 text-slate-500 uppercase tracking-wider">Incoming Requests (50)</h4>
            <div className="flex flex-wrap gap-2">
              {requests.length === 0 && <span className="text-sm text-slate-400">Waiting for stampede...</span>}
              {requests.map(r => (
                <div key={r.id} className={`w-4 h-4 rounded-full transition-all duration-500 ${
                  r.status === 'checking' ? 'bg-yellow-400 animate-pulse' :
                  r.status === 'db' ? 'bg-orange-500 scale-125' :
                  r.status === 'waiting' ? 'bg-slate-400' :
                  'bg-emerald-500'
                }`} />
              ))}
            </div>
            
            <div className="mt-6 flex gap-4 text-xs font-mono text-slate-500">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-full" /> Cache Miss</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-full" /> Hitting DB</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-400 rounded-full" /> Waiting</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Got Cache</div>
            </div>
          </div>

          {/* Database Load */}
          <div className="flex-1 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-xl p-4 flex flex-col items-center justify-center">
            <h4 className="font-bold text-sm mb-4 text-slate-500 uppercase tracking-wider text-center">PostgreSQL CPU Load</h4>
            
            <div className="relative w-32 h-32 flex items-center justify-center">
              <Database size={48} className={`transition-all duration-500 ${dbLoad > 50 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
              
              {/* Circular Progress (SVG) */}
              <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
                <circle 
                  cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="8" 
                  className={`transition-all duration-500 ${dbLoad > 80 ? 'text-red-500' : 'text-emerald-500'}`}
                  strokeDasharray={`${(dbLoad / 100) * 377} 377`}
                />
              </svg>
            </div>
            
            <div className={`mt-4 font-mono font-bold text-2xl ${dbLoad > 80 ? 'text-red-500' : 'text-emerald-500'}`}>
              {dbLoad}%
            </div>
            {dbLoad > 80 && <div className="text-xs font-bold text-red-500 uppercase mt-1 animate-pulse">DB CRASH IMMINENT</div>}
          </div>

        </div>
      </div>
      
      <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
         <p className="text-slate-800 dark:text-slate-200 font-medium">
           This concludes our major Caching concepts! With Cache-Aside, Invalidation, and Stampede prevention, our API is battle-ready. We can now safely move to building out the UI frontend.
         </p>
      </div>

    </article>
  );
}
