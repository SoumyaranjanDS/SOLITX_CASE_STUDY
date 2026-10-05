import React, { useState, useEffect } from 'react';

// Animation Component to show the Database Bottleneck
const BottleneckAnimation = () => {
  const [ticks, setTicks] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const TOTAL_REQUESTS = 500;
  const POOL_SIZE = 10;

  // Calculate state based on ticks
  // Every tick represents a round-trip to the DB (~100ms)
  // We process 10 requests per tick.
  const completed = Math.min(ticks * POOL_SIZE, TOTAL_REQUESTS);
  const remaining = TOTAL_REQUESTS - completed;

  // After ~30 ticks (3 seconds in our simulated world, representing 10s in real life), 
  // the remaining ones start to timeout
  const timeoutThreshold = 30;
  let success = completed;
  let timeouts = 0;
  let inQueue = remaining;

  if (ticks > timeoutThreshold) {
    // Things start timing out instead of completing
    const overtime = ticks - timeoutThreshold;
    timeouts = Math.min(overtime * POOL_SIZE, TOTAL_REQUESTS - (timeoutThreshold * POOL_SIZE));
    success = Math.min(timeoutThreshold * POOL_SIZE, TOTAL_REQUESTS);
    inQueue = Math.max(TOTAL_REQUESTS - success - timeouts, 0);
  }

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTicks(t => {
          if (t >= 50) { // end of animation
            setIsRunning(false);
            return 50;
          }
          return t + 1;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = () => {
    setIsRunning(false);
    setTicks(0);
  };

  // Generate visual queue boxes (max 100 for visual sanity)
  const queueBoxes = [];
  const maxVisual = 100;
  const ratio = TOTAL_REQUESTS / maxVisual; // 1 box = 5 requests

  const visualSuccess = Math.floor(success / ratio);
  const visualTimeouts = Math.floor(timeouts / ratio);
  const visualQueue = Math.floor(inQueue / ratio);

  for (let i = 0; i < maxVisual; i++) {
    if (i < visualSuccess) {
      queueBoxes.push(<div key={i} className="w-2 h-4 bg-emerald-500 rounded-sm m-0.5"></div>);
    } else if (i < visualSuccess + visualTimeouts) {
      queueBoxes.push(<div key={i} className="w-2 h-4 bg-red-500 rounded-sm m-0.5"></div>);
    } else if (i < visualSuccess + visualTimeouts + visualQueue) {
      queueBoxes.push(<div key={i} className="w-2 h-4 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-sm m-0.5"></div>);
    } else {
      queueBoxes.push(<div key={i} className="w-2 h-4 bg-transparent m-0.5"></div>);
    }
  }

  return (
    <div className="my-8 p-6 bg-slate-50 dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-[#30363d]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Connection Bottleneck Animation</h3>
        <div className="flex gap-2">
          <button onClick={reset} className="px-3 py-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Reset</button>
          <button onClick={() => setIsRunning(!isRunning)} className="px-3 py-1 text-xs font-bold rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors">
            {isRunning ? 'Pause' : (ticks > 0 ? 'Resume' : 'Start Attack')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="flex flex-col items-center p-4 border border-slate-200 dark:border-[#30363d] rounded-lg bg-white dark:bg-[#161b22]">
          <div className="text-4xl mb-2 font-bold text-slate-800 dark:text-slate-200">{inQueue}</div>
          <div className="text-xs text-slate-500 font-mono">Waiting in Queue</div>
        </div>
        <div className="flex flex-col items-center p-4 border border-emerald-500/30 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
          <div className="text-4xl mb-2 font-bold text-emerald-600 dark:text-emerald-400">{success}</div>
          <div className="text-xs text-emerald-500 font-mono">Processed (Success)</div>
        </div>
        <div className="flex flex-col items-center p-4 border border-red-500/30 rounded-lg bg-red-50 dark:bg-red-900/10">
          <div className="text-4xl mb-2 font-bold text-red-600 dark:text-red-400">{timeouts}</div>
          <div className="text-xs text-red-500 font-mono">Crashed (Timeouts)</div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="text-xs text-slate-500 mb-2 flex justify-between">
            <span>Node.js Express Queue (500 Connections)</span>
            <span className="font-mono">{Math.floor((ticks * 150) / 1000)}s Elapsed</span>
          </div>
          <div className="flex flex-wrap border border-slate-300 dark:border-slate-700 p-2 rounded-lg bg-white dark:bg-[#161b22]">
            {queueBoxes}
          </div>

          <div className="flex justify-center my-4">
            <div className="flex flex-col items-center">
              <div className="text-xs text-slate-500 mb-1">pg.Pool limit</div>
              <div className="px-4 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 border border-amber-300 dark:border-amber-700/50 rounded font-mono text-xs font-bold">10 Connections / tick</div>
            </div>
          </div>

          <div className="w-full h-12 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded-lg flex items-center justify-center text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
            Neon PostgreSQL Database
          </div>
        </div>
      </div>

      {timeouts > 0 && (
        <div className="mt-6 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-900/50 text-center font-medium">
          ALERT: Queue wait time exceeded 10,000ms. Clients are dropping connections!
        </div>
      )}
    </div>
  );
};


export default function Day8LoadTesting() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>Measure Before Scaling</span>
      </h1>

      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        In Day 7, we built a mathematically perfect Database Index that can fetch a user's feed in <strong>0.086 milliseconds</strong>.
        But what happens if 500 users try to fetch their feed at the exact same time?
      </p>

      <h2 className="prose-h2">1. The Load Test Endpoint</h2>
      <p>
        To test the limits of our server, we temporarily injected a raw database endpoint into <code>server.js</code>. We completely bypassed the Rate Limiter (Day 5) to guarantee the traffic actually hits the Database.
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
          <span className="text-xs font-mono text-[#8b949e]">backend/src/server.js</span>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
            app.<span className="text-[#d2a8ff]">get</span>(<span className="text-[#a5d6ff]">"/api/v1/test/feed/:user_id"</span>, <span className="text-[#ff7b72]">async</span> (req, res, next) =&gt; {'{\n'}
            &nbsp;&nbsp;<span className="text-[#ff7b72]">try</span> {'{\n'}
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> {'{'} user_id {'}'} = req.params;<br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> query = <span className="text-[#a5d6ff]">`
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SELECT * FROM posts
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;WHERE user_id = $1
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ORDER BY created_at DESC
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LIMIT 20;
              &nbsp;&nbsp;&nbsp;&nbsp;`</span>;<br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> result = <span className="text-[#ff7b72]">await</span> pool.<span className="text-[#d2a8ff]">query</span>(query, [user_id]);<br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72]">return</span> res.<span className="text-[#d2a8ff]">status</span>(<span className="text-[#79c0ff]">200</span>).<span className="text-[#d2a8ff]">json</span>(result.rows);<br />
            &nbsp;&nbsp;{'}'} <span className="text-[#ff7b72]">catch</span> (error) {'{\n'}
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#d2a8ff]">next</span>(error);<br />
            &nbsp;&nbsp;{'}'}<br />
            {'}'});
          </code>
        </pre>
      </div>

      <h2 className="prose-h2">2. Firing the Autocannon</h2>
      <p>
        We used <code>autocannon</code> (a Node.js benchmarking tool) to open <strong>500 concurrent connections</strong> and hammer the endpoint for 10 seconds.
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
          <span className="text-xs font-mono text-[#8b949e]">Terminal</span>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
            <span className="text-[#ff7b72]">npx</span> autocannon -c 500 -d 10 http://localhost:5005/api/v1/test/feed/...<br /><br />
            <span className="text-[#8b949e]">Running 10s test @ http://localhost:5005...</span><br />
            <span className="text-[#8b949e]">500 connections</span><br /><br />
            ┌─────────┬─────────┬─────────┬─────────┬────────────┬──────────┐<br />
            │ Stat    │ 2.5%    │ 50%     │ 99%     │ <span className="text-[#ff7b72]">Avg</span>        │ Max      │<br />
            ├─────────┼─────────┼─────────┼─────────┼────────────┼──────────┤<br />
            │ Latency │ 2713 ms │ 6267 ms │ 9946 ms │ <span className="text-[#ff7b72]">6296.05 ms</span> │ 10013 ms │<br />
            └─────────┴─────────┴─────────┴─────────┴────────────┴──────────┘<br /><br />
            <span className="text-[#3fb950]">Req/Sec   : 26.5</span><br />
            <span className="text-[#f85149]">Errors    : 235 (235 timeouts)</span>
          </code>
        </pre>
      </div>

      <h2 className="prose-h2">3. The Autopsy (The Connection Bottleneck)</h2>
      <p>
        How is it possible that a query that takes <code>0.086 ms</code> in the database resulted in an average response time of <strong>6,296 ms (6.2 seconds)</strong> for the user? Why did 235 users get a complete Timeout error?
      </p>

      <p>
        Because of a <strong>Connection Bottleneck</strong>. Node.js is asynchronous and incredibly fast. It accepted all 500 HTTP connections instantly. But when Node.js asked the PostgreSQL driver (<code>pg.Pool</code>) to fetch the data, the driver stopped it.
      </p>

      <p className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-slate-700 dark:text-slate-300 italic font-medium my-4">
        "I only have 10 open connections to the database. 10 of you can go, the other 490 of you must wait in line."
      </p>

      <p>
        10 users travel across the internet to the Neon database, execute their 0.086ms query, travel back, and the next 10 go. The network round-trip delay is the real killer. The 235 users stuck at the back of the line waited over 10,000 ms, triggering a catastrophic HTTP Timeout crash.
      </p>

      {/* Interactive Animation */}
      <BottleneckAnimation />

      <h2 className="prose-h2">What's Next? (Day 9)</h2>
      <p>
        We now know exactly what our baseline architecture can handle before it crashes. We mathematically proved the bottleneck is not CPU, and it's not the Query speed—it's the <strong>Connection Pool</strong> limit.
      </p>
      <p>
        In Day 9, we will implement proper <strong>Database Connection Pooling</strong> and PgBouncer to massively multiply our throughput and destroy this bottleneck.
      </p>

    </article>
  );
}
