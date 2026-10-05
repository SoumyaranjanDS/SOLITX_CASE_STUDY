import React from 'react';
import { ArrowDown, ArrowRight, Layers, MousePointer2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Day10Pagination() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>Pagination (Offset vs Cursor)</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        In Day 9, we achieved massive throughput. But returning 100,000 posts in a single JSON response is a terrible idea—it will crash the user's browser and consume massive bandwidth. We must load data in chunks (Pages).
      </p>

      <h2 className="prose-h2">The Problem with Offset Pagination</h2>
      <p>
        The most common way beginners paginate data is using <code>OFFSET</code>.
        <br /><em>"Give me 20 posts, but skip the first 40."</em>
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-4">
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
<span className="text-[#ff7b72]">SELECT</span> * <span className="text-[#ff7b72]">FROM</span> posts <br/>
<span className="text-[#ff7b72]">WHERE</span> user_id = $1 <span className="text-[#ff7b72]">ORDER BY</span> created_at <span className="text-[#ff7b72]">DESC</span> <br/>
<span className="text-[#ff7b72]">LIMIT</span> 20 <span className="text-[#ff7b72]">OFFSET</span> 40;
          </code>
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-5 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-3">
            <AlertTriangle size={18} />
            Performance Death
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            If a user scrolls deep into their feed (e.g., <code>OFFSET 100,000</code>), the database must physically read 100,000 rows, throw them away, and then return the next 20. It gets exponentially slower the deeper you scroll.
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-5 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-3">
            <Layers size={18} />
            Data Drift (Duplicates)
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            If someone publishes a new post while you are reading Page 1, every post in the database shifts down by 1 row. When you request Page 2, the last post from Page 1 is now the first post on Page 2. You will see duplicates.
          </p>
        </div>
      </div>

      <h2 className="prose-h2">The Solution: Cursor Pagination</h2>
      <p>
        Instead of asking for "Page 2", the frontend sends the exact timestamp of the last post it saw (the <strong>Cursor</strong>). 
        <br /><em>"Give me 20 posts that were created immediately AFTER this timestamp."</em>
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-4">
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
<span className="text-[#ff7b72]">SELECT</span> * <span className="text-[#ff7b72]">FROM</span> posts <br/>
<span className="text-[#ff7b72]">WHERE</span> user_id = $1 <span className="text-[#79c0ff]">AND created_at &lt; $cursor</span> <br/>
<span className="text-[#ff7b72]">ORDER BY</span> created_at <span className="text-[#ff7b72]">DESC</span> <br/>
<span className="text-[#ff7b72]">LIMIT</span> 20;
          </code>
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-5 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-3">
            <CheckCircle2 size={18} />
            Instant Speed (O(log N))
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Thanks to our B-Tree Index from Day 7, the database can instantly jump directly to the cursor timestamp and grab the next 20 rows. It takes <code>0.086ms</code> whether you are on the 1st post or the 1,000,000th post.
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-5 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-3">
            <MousePointer2 size={18} />
            No Data Drift
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            If a million new posts are added at the top of the feed, it doesn't matter. You are asking for posts <em>older</em> than your cursor. Your place in the feed is permanently locked in time.
          </p>
        </div>
      </div>

      <h2 className="prose-h2">Visualizing the API Response</h2>
      <p>
        When the frontend calls the API, the backend returns the 20 posts, plus a <code>nextCursor</code>. When the user scrolls to the bottom of the screen, the frontend simply calls the API again, passing that exact <code>nextCursor</code> in the URL.
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
          <span className="text-xs font-mono text-[#8b949e]">Response JSON</span>
          <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">200 OK</span>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
{'{'}<br/>
&nbsp;&nbsp;<span className="text-[#79c0ff]">"statusCode"</span>: <span className="text-[#a5d6ff]">200</span>,<br/>
&nbsp;&nbsp;<span className="text-[#79c0ff]">"data"</span>: {'{\n'}
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#79c0ff]">"count"</span>: <span className="text-[#a5d6ff]">20</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#79c0ff bg-blue-900/30 border-l-2 border-blue-500 block px-2 -mx-2">"nextCursor": <span className="text-[#a5d6ff]">"2026-10-05T12:00:00.000Z"</span>,</span>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#79c0ff]">"data"</span>: [<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{'{'} <span className="text-[#79c0ff]">"id"</span>: <span className="text-[#a5d6ff]">"post_999"</span>, <span className="text-[#79c0ff]">"created_at"</span>: <span className="text-[#a5d6ff]">"2026-10-05T12:05:00.000Z"</span> {'}'},<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{'{'} <span className="text-[#79c0ff]">"id"</span>: <span className="text-[#a5d6ff]">"post_998"</span>, <span className="text-[#79c0ff]">"created_at"</span>: <span className="text-[#a5d6ff]">"2026-10-05T12:04:00.000Z"</span> {'}'},<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#8b949e]">... 17 more posts ...</span><br/>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{'{'} <span className="text-[#79c0ff]">"id"</span>: <span className="text-[#a5d6ff]">"post_980"</span>, <span className="text-[#79c0ff]">"created_at"</span>: <span className="text-[#a5d6ff]">"2026-10-05T12:00:00.000Z"</span> {'}'}<br/>
&nbsp;&nbsp;&nbsp;&nbsp;]<br/>
&nbsp;&nbsp;{'}'}<br/>
{'}'}
          </code>
        </pre>
      </div>

    </article>
  );
}
