import React from 'react';

export default function Day7Indexing() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture
        </span>
        <span>The Database Starts Talking Back</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        In Day 6, we guaranteed data integrity using constraints. But that only helps when <em>writing</em> data. What happens when we try to <em>read</em> it at scale?
      </p>

      <h2 className="prose-h2">1. Finding The Problem</h2>
      <p>
        To simulate a real-world scenario, I wrote a Node.js script to artificially inject <strong>100,000 fake posts</strong> into the live PostgreSQL database. Then, I asked the database to find 20 posts for a specific user:
      </p>
      
      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
          <span className="text-xs font-mono text-[#8b949e]">SQL Query</span>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
<span className="text-[#ff7b72]">EXPLAIN ANALYZE SELECT</span> * <span className="text-[#ff7b72]">FROM</span> posts <br/>
<span className="text-[#ff7b72]">WHERE</span> user_id = <span className="text-[#a5d6ff]">'b7b8fc7b-ccd0-48cd-bab8-ee3e65b344fc'</span> <br/>
<span className="text-[#ff7b72]">ORDER BY</span> created_at <span className="text-[#ff7b72]">DESC LIMIT</span> 20;
          </code>
        </pre>
      </div>

      <p>
        I didn't just ask for the data. I used <code>EXPLAIN ANALYZE</code>, which forces the Database Query Planner to print a "receipt" of exactly how much work it did to find the answer. The result was horrifying.
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
          <span className="text-xs font-mono text-[#8b949e]">The Output (Before Indexing)</span>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
<span className="text-[#f0883e]">Seq Scan on posts</span> (actual time=0.014..5.139 rows=1908.00)<br/>
&nbsp;&nbsp;Filter: (user_id = 'b7b8fc7b-ccd0-48cd-bab8-ee3e65b344fc'::uuid)<br/>
&nbsp;&nbsp;<span className="text-[#f85149]">Rows Removed by Filter: 98092</span><br/>
<span className="text-[#f0883e]">Sort Method: top-N heapsort</span>  Memory: 27kB<br/><br/>
<span className="text-[#8b949e]">Execution Time: 5.495 ms</span>
          </code>
        </pre>
      </div>

      <p>
        <strong>The Autopsy:</strong> Because the data was randomly thrown into the table, PostgreSQL had to execute a <strong>Sequential Scan (Seq Scan)</strong>. It physically read all 100,000 rows from top to bottom. As it read them, it threw away 98,092 rows because they didn't match. <br/><br/>
        <em>It did 100% of the work just to throw 98% of it in the trash.</em> Then, it had to use the server's RAM to manually sort the remaining data. If 1,000 users trigger this query simultaneously on a table with 100 million rows, the CPU will melt.
      </p>

      <h2 className="prose-h2">2. What is an Index? (The Theory)</h2>
      <p>
        An Index is exactly like the "Table of Contents" at the back of a textbook. Instead of reading a 1,000-page book to find the word "Authentication", you flip to the back, look at the alphabetical list, and it tells you exactly that it is on page 42. PostgreSQL uses a data structure called a <strong>B-Tree (Balanced Tree)</strong> to do this.
      </p>

      {/* Visual Diagram */}
      <div className="my-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">How it works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left: Seq Scan */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-5 rounded-lg flex flex-col">
            <div className="font-bold text-red-600 dark:text-red-400 mb-4 flex justify-between items-center">
              <span>Sequential Scan</span>
              <span className="text-xs bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">5.495 ms</span>
            </div>
            
            <ul className="text-[13px] space-y-2 text-slate-600 dark:text-slate-400 font-mono flex-grow">
              <li>1. Read Row 1 &rarr; <span className="text-slate-400 dark:text-slate-500">Discard</span></li>
              <li>2. Read Row 2 &rarr; <span className="text-slate-400 dark:text-slate-500">Discard</span></li>
              <li className="text-slate-400 italic py-1">... 98,089 more rows ...</li>
              <li className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-1 -mx-1 rounded">
                98092. Read Row &rarr; Keep
              </li>
              <li className="text-slate-400 italic py-1">...</li>
              <li>100000. Read Row &rarr; <span className="text-slate-400 dark:text-slate-500">Discard</span></li>
            </ul>
            
            <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400 font-medium">
              Result: Reads 100,000 rows, throws away 98% of them.
            </div>
          </div>

          {/* Right: Index Scan */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-5 rounded-lg flex flex-col">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex justify-between items-center">
              <span>B-Tree Index Scan</span>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded">0.086 ms</span>
            </div>
            
            <ul className="text-[13px] space-y-3 text-slate-600 dark:text-slate-400 font-mono flex-grow">
              <li>1. Check Root Node (A-Z)</li>
              <li className="pl-4">&rarr; Jump to Branch (M-Z)</li>
              <li className="pl-8">&rarr; Jump to Leaf (our_target)</li>
              <li className="pl-12 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/50 dark:bg-emerald-900/30 p-2 mt-2 rounded border border-emerald-200 dark:border-emerald-800">
                &rarr; Pointer to Row 98092
              </li>
            </ul>
            
            <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-900/30 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Result: Reads exactly 20 rows. Zero wasted effort.
            </div>
          </div>

        </div>
      </div>

      <h2 className="prose-h2">3. The Fix (Composite Index)</h2>
      <p>
        Because our query filters by <code>user_id</code> and then sorts by <code>created_at DESC</code>, we need a <strong>Composite Index</strong>. This creates a B-Tree that is perfectly partitioned by the user ID, and then pre-sorted by the date.
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
          <span className="text-xs font-mono text-[#8b949e]">backend/src/config/migrate.js</span>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
<span className="text-[#ff7b72]">CREATE INDEX</span> idx_posts_user_id_created_at <br/>
<span className="text-[#ff7b72]">ON</span> posts (user_id, created_at <span className="text-[#ff7b72]">DESC</span>);
          </code>
        </pre>
      </div>

      <h2 className="prose-h2">4. The Result</h2>
      <p>
        After creating the index, I ran the exact same <code>EXPLAIN ANALYZE</code> query again. Here is what the database returned:
      </p>

      <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] my-6">
        <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
          <span className="text-xs font-mono text-[#8b949e]">The Output (After Indexing)</span>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
          <code>
<span className="text-[#3fb950]">Index Scan using idx_posts_user_id_created_at on posts</span><br/>
&nbsp;&nbsp;Index Cond: (user_id = 'b7b8fc7b-ccd0-48cd-bab8-ee3e65b344fc'::uuid)<br/><br/>
<span className="text-[#8b949e]">Execution Time: 0.086 ms</span>
          </code>
        </pre>
      </div>

      <p>
        This is the magic of Database Engineering. The execution time dropped from <strong>5.495 ms</strong> to <strong>0.086 ms</strong>. That is a <strong>63x speedup</strong> on just 100,000 rows.
      </p>
      
      <ul className="prose-ul">
        <li><strong>No Sequential Scan:</strong> It skipped the main table and went straight to the B-Tree index.</li>
        <li><strong>Zero Wasted Effort:</strong> The <code>Rows Removed</code> line is completely gone. It grabbed exactly 20 rows and stopped.</li>
        <li><strong>Zero Sorting:</strong> The <code>Sort Method</code> is gone! Because our index was built with <code>created_at DESC</code>, the index was already physically sorted on the hard drive. No RAM was used to sort.</li>
      </ul>

      <h2 className="prose-h2">The Trade-off</h2>
      <p>
        Why don't we index every single column? Because there is no free lunch. Indexes take up physical storage space. Furthermore, every time a user publishes a new post, the database now has to write to the main table <em>and</em> update the B-Tree index. This makes <code>INSERT</code> operations slightly slower. We only index what we heavily read.
      </p>
    </article>
  );
}
