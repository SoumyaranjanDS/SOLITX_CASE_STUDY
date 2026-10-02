import React from 'react';

export default function Day6Database() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Day 06
        </span>
        <span>Relational Database Design</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        Before we can build the feed or allow users to interact, we have to teach our database how to store relationships. And more importantly, how to protect itself from bad data.
      </p>

      <h2 className="prose-h2">The Problems We Need To Solve</h2>
      
      <div className="space-y-6 my-6">
        <div className="p-4 bg-white dark:bg-[#111] rounded-lg border border-slate-100 dark:border-[#222]">
          <strong className="text-red-500 dark:text-red-400 block mb-1">Problem 1: "Ghost Posts"</strong>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Imagine a user writes 50 posts, and then deletes their account. If the database isn't designed correctly, those 50 posts will stay in the system forever attached to an ID that doesn't exist. When the frontend tries to load the author's profile picture, the app will crash.
          </p>
        </div>
        
        <div className="p-4 bg-white dark:bg-[#111] rounded-lg border border-slate-100 dark:border-[#222]">
          <strong className="text-orange-500 dark:text-orange-400 block mb-1">Problem 2: "The Infinite Follow Bug"</strong>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            What happens if a user clicks the "Follow" button 10 times really fast before the UI updates? Does the database record 10 identical follows? Does the target user's follower count go up by 10?
          </p>
        </div>
      </div>

      <h2 className="prose-h2">The Solution: Database Constraints</h2>
      <p>
        We solve these problems using Relational Database Constraints. We push the validation logic down to the database engine itself, so our Node.js server doesn't have to constantly write <code>if</code> statements to check for bad data.
      </p>

      <ul className="prose-ul space-y-3">
        <li><strong className="text-black dark:text-white">Foreign Keys + CASCADE:</strong> We tell the database that a Post belongs to a User. If that User is deleted, the database will automatically wipe all their posts and likes instantly (<code>ON DELETE CASCADE</code>).</li>
        <li><strong className="text-black dark:text-white">Unique Constraints:</strong> We create a compound primary key on the <code>follows</code> table using <code>(follower_id, following_id)</code>. If someone clicks follow 10 times, the database physically rejects the 9 duplicates.</li>
      </ul>

      <div className="my-8">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4">The Implementation (Raw SQL)</h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          I am explicitly not using an ORM (like Prisma) so I can control exactly how these tables are created in PostgreSQL.
        </p>
        
        <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333]">
          <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex items-center">
            <span className="text-xs font-mono text-[#8b949e]">backend/src/config/migrate.js</span>
          </div>
          <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#c9d1d9] font-mono">
            <code className="block">
<span className="text-[#8b949e]">-- The Posts Table</span><br/>
<span className="text-[#ff7b72]">CREATE TABLE IF NOT EXISTS</span> posts (<br/>
&nbsp;&nbsp;id <span className="text-[#79c0ff]">UUID PRIMARY KEY DEFAULT</span> gen_random_uuid(),<br/>
&nbsp;&nbsp;user_id <span className="text-[#79c0ff]">UUID NOT NULL REFERENCES</span> users(id) <span className="text-[#ff7b72]">ON DELETE CASCADE</span>,<br/>
&nbsp;&nbsp;content <span className="text-[#79c0ff]">VARCHAR</span>(500) <span className="text-[#79c0ff]">NOT NULL</span>,<br/>
&nbsp;&nbsp;created_at <span className="text-[#79c0ff]">TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP</span><br/>
);<br/><br/>

<span className="text-[#8b949e]">-- The Follows Table (Junction Table)</span><br/>
<span className="text-[#ff7b72]">CREATE TABLE IF NOT EXISTS</span> follows (<br/>
&nbsp;&nbsp;follower_id <span className="text-[#79c0ff]">UUID NOT NULL REFERENCES</span> users(id) <span className="text-[#ff7b72]">ON DELETE CASCADE</span>,<br/>
&nbsp;&nbsp;following_id <span className="text-[#79c0ff]">UUID NOT NULL REFERENCES</span> users(id) <span className="text-[#ff7b72]">ON DELETE CASCADE</span>,<br/>
&nbsp;&nbsp;created_at <span className="text-[#79c0ff]">TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP</span>,<br/>
&nbsp;&nbsp;<span className="text-[#ff7b72]">PRIMARY KEY</span> (follower_id, following_id) <span className="text-[#8b949e]">-- Prevents duplicate follows</span><br/>
);<br/><br/>

<span className="text-[#8b949e]">-- The Likes Table</span><br/>
<span className="text-[#ff7b72]">CREATE TABLE IF NOT EXISTS</span> likes (<br/>
&nbsp;&nbsp;user_id <span className="text-[#79c0ff]">UUID NOT NULL REFERENCES</span> users(id) <span className="text-[#ff7b72]">ON DELETE CASCADE</span>,<br/>
&nbsp;&nbsp;post_id <span className="text-[#79c0ff]">UUID NOT NULL REFERENCES</span> posts(id) <span className="text-[#ff7b72]">ON DELETE CASCADE</span>,<br/>
&nbsp;&nbsp;created_at <span className="text-[#79c0ff]">TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP</span>,<br/>
&nbsp;&nbsp;<span className="text-[#ff7b72]">PRIMARY KEY</span> (user_id, post_id) <span className="text-[#8b949e]">-- Prevents double-liking</span><br/>
);
            </code>
          </pre>
        </div>
      </div>

      <h2 className="prose-h2">The Next Problem</h2>
      <p>
        The tables are built, and data integrity is guaranteed. But right now, if we run <code>SELECT * FROM posts WHERE user_id = '123'</code> on a table with 10 million rows, PostgreSQL will have to read every single row one-by-one from top to bottom to find them.
      </p>

      <p>
        <strong className="text-emerald-600 dark:text-emerald-400">Objective for Day 7:</strong> We need to learn how the Database Query Planner works, and implement B-Tree Indexes to prevent Sequential Scans from destroying our performance.
      </p>
    </article>
  );
}
