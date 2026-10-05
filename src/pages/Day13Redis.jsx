import React, { useState } from 'react';
import { Database, Zap, RefreshCw, Server, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';

export default function Day13Redis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [timeTaken, setTimeTaken] = useState(null);

  const fetchUser = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/test/user/soumya`);
      const data = await res.json();

      const end = performance.now();
      setTimeTaken((end - start).toFixed(2));
      setResult(data.data);
    } catch (err) {
      console.error(err);
      setResult({ source: 'error', message: 'Backend is offline or failed.' });
    }
    setLoading(false);
  };

  return (
    <article className="prose-container font-sans">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>Introducing Redis (Cache-Aside)</span>
      </h1>

      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        We have officially installed Upstash Redis into our architecture! We implemented the <strong>Cache-Aside Pattern</strong> to solve the Repeated Reads problem from Day 12.
      </p>

      <h2 className="prose-h2">The Cache-Aside Implementation</h2>
      <p>
        In <code>backend/src/server.js</code>, we added a new endpoint that wraps our PostgreSQL database with a Redis caching layer.
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
            <span className="text-[#8b949e]">// 1. Check Redis Cache</span><br />
            <span className="text-[#ff7b72]">const</span> cachedUser = <span className="text-[#ff7b72]">await</span> redis.<span className="text-[#d2a8ff]">get</span>(<span className="text-[#a5d6ff]">`user:$username`</span>);<br />
            <span className="text-[#ff7b72]">if</span> (cachedUser) {'{\n'}
            &nbsp;&nbsp;<span className="text-[#ff7b72]">return</span> JSON.<span className="text-[#d2a8ff]">parse</span>(cachedUser); <span className="text-[#8b949e]">// CACHE HIT ⚡</span><br />
            {'}'}<br /><br />
            <span className="text-[#8b949e]">// 2. Cache Miss: Query PostgreSQL</span><br />
            <span className="text-[#ff7b72]">const</span> result = <span className="text-[#ff7b72]">await</span> pool.<span className="text-[#d2a8ff]">query</span>(<span className="text-[#a5d6ff]">'SELECT ...'</span>);<br />
            <span className="text-[#ff7b72]">const</span> user = result.rows[<span className="text-[#79c0ff]">0</span>];<br /><br />
            <span className="text-[#8b949e]">// 3. Save to Redis for 5 minutes (TTL)</span><br />
            <span className="text-[#ff7b72]">await</span> redis.<span className="text-[#d2a8ff]">set</span>(<span className="text-[#a5d6ff]">`user:$username`</span>, JSON.<span className="text-[#d2a8ff]">stringify</span>(user), <span className="text-[#a5d6ff]">'EX'</span>, <span className="text-[#79c0ff]">300</span>);<br />
            <span className="text-[#ff7b72]">return</span> user;<br />
          </code>
        </pre>
      </div>

      <h2 className="prose-h2">Interactive Demo</h2>
      <p>
        Click the button below to fetch a user profile from the live API.
        <br />The first click will be a <strong>Cache Miss</strong> (it will query PostgreSQL).
        <br />Every subsequent click within 5 minutes will be a <strong>Cache Hit</strong> (it will fetch instantly from Redis).
      </p>

      <div className="my-8 p-6 md:p-8 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl flex flex-col items-center gap-6">

        <button
          onClick={fetchUser}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
          Fetch Profile (soumya)
        </button>

        {result && result.user && (
          <div className="w-full flex flex-col xl:flex-row gap-6 mt-4 items-start">

            {/* Source Indicator */}
            <div className={`w-full xl:w-64 p-6 rounded-xl border flex flex-col items-center justify-center text-center transition-all shadow-sm ${result.source === 'cache'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
              }`}>
              {result.source === 'cache' ? (
                <>
                  <Server size={32} className="text-emerald-500 mb-2 animate-pulse" />
                  <h3 className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">Cache Hit</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 uppercase tracking-wider font-bold">Served by Redis</p>
                  <div className="mt-4 inline-block bg-white dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 font-mono text-emerald-600 font-bold shadow-sm text-lg">
                    {timeTaken} ms
                  </div>
                </>
              ) : (
                <>
                  <Database size={32} className="text-orange-500 mb-2" />
                  <h3 className="text-orange-700 dark:text-orange-400 font-bold text-lg">Cache Miss</h3>
                  <p className="text-xs text-orange-600 dark:text-orange-500 mt-1 uppercase tracking-wider font-bold">Served by PostgreSQL</p>
                  <div className="mt-4 inline-block bg-white dark:bg-orange-950 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 font-mono text-orange-600 font-bold shadow-sm text-lg">
                    {timeTaken} ms
                  </div>
                </>
              )}
            </div>

            {/* Twitter-style Profile Card */}
            <div className="flex-1 w-full bg-white dark:bg-[#000000] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#333] shadow-md">
              {/* Cover Banner */}
              <div className="h-32 w-full relative bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop"
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="px-5 pb-5 relative">
                {/* Avatar */}
                <div className="absolute -top-16 w-32 h-32 rounded-full border-4 border-white dark:border-[#000000] bg-slate-800 dark:bg-slate-900 overflow-hidden flex items-center justify-center text-5xl font-bold text-white shadow-sm z-10">
                  {result.user.username?.charAt(0).toUpperCase()}
                </div>

                {/* Follow Button (acting as vertical spacer for the absolute avatar) */}
                <div className="flex justify-end pt-3 h-16">
                  <button className="px-5 py-1.5 rounded-full font-bold text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors h-fit">
                    Follow
                  </button>
                </div>

                {/* Profile Info */}
                <div className="mt-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0 p-0 leading-tight capitalize">
                    {result.user.username}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-500 m-0 p-0 text-[15px]">@{result.user.username}</p>
                </div>

                {/* Bio */}
                <div className="mt-3 text-slate-900 dark:text-slate-100 text-[15px] leading-snug">
                  {result.user.bio || "Building the future of web architecture. Mastering System Design, PostgreSQL, and Redis. 🚀"}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-slate-500 dark:text-slate-500 text-[15px]">
                  <div className="flex items-center gap-1">
                    <MapPin size={18} />
                    <span>Internet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <LinkIcon size={18} />
                    <span className="text-blue-500 hover:underline cursor-pointer">github.com</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={18} />
                    <span>Joined {new Date(result.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Follower Stats */}
                <div className="flex gap-5 mt-4 text-[15px]">
                  <div className="hover:underline cursor-pointer"><span className="font-bold text-slate-900 dark:text-white">1,204</span> <span className="text-slate-500">Following</span></div>
                  <div className="hover:underline cursor-pointer"><span className="font-bold text-slate-900 dark:text-white">10M</span> <span className="text-slate-500">Followers</span></div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Notice the speed difference!</strong> A round-trip to PostgreSQL requires parsing, indexing, and disk fetching. A round-trip to Redis is a simple hash lookup in pure RAM. Redis acts as a shield, completely protecting our Database from the "Cristiano Ronaldo" traffic spike.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Deep Dive: Why is Redis so fast?</h2>

        <div className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>
            You might be wondering: <em>"If Redis and PostgreSQL are both databases, why does 1 million requests crash PostgreSQL but Redis handles it flawlessly?"</em>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#0d1117] p-5 rounded-xl border border-slate-200 dark:border-[#30363d]">
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">1. RAM vs Disk</h4>
              <p className="text-sm">PostgreSQL writes to a hard drive to ensure ACID compliance (data safety). Redis operates 100% in Memory (RAM). Reading from RAM takes nanoseconds, reading from disk takes milliseconds (1,000x slower).</p>
            </div>

            <div className="bg-white dark:bg-[#0d1117] p-5 rounded-xl border border-slate-200 dark:border-[#30363d]">
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">2. O(1) Time Complexity</h4>
              <p className="text-sm">PostgreSQL has to parse SQL, map an execution plan, and traverse a B-Tree index. Redis is a simple Key-Value store. It mathematically hashes the key and jumps directly to that memory block instantly.</p>
            </div>

            <div className="bg-white dark:bg-[#0d1117] p-5 rounded-xl border border-slate-200 dark:border-[#30363d]">
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">3. Event Loop</h4>
              <p className="text-sm">PostgreSQL spawns a heavy OS process for every connection, which is why we needed Connection Pooling. Redis uses a single-threaded event loop (like Node.js) capable of handling tens of thousands of concurrent connections.</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">The Cache-Aside Pattern</h3>
          <p>
            There are many ways to implement caching. We chose the <strong>Cache-Aside</strong> pattern. In this architecture, the cache sits "aside" the database. The application code (our Node.js backend) is responsible for communicating with both.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>If the cache fails or goes offline, our backend can still fetch data directly from PostgreSQL. The system degrades gracefully rather than suffering a hard crash.</li>
            <li>We implemented a <strong>TTL (Time To Live)</strong> of 300 seconds. This ensures that memory doesn't fill up infinitely. Redis automatically deletes the data after 5 minutes using its Eviction Policy.</li>
          </ul>
        </div>
      </div>

    </article>
  );
}
