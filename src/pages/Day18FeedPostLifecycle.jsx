import React from 'react';
import { 
  FileText, 
  Database, 
  Zap, 
  Heart, 
  Trash2, 
  Edit3, 
  Repeat, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

export default function Day18FeedPostLifecycle() {
  return (
    <article className="prose-container font-sans">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Architecture & Implementation
        </span>
        <span>Post Lifecycle, Cursor Feeds & Social Graph</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-8 leading-relaxed">
        Building a social timeline is often mistaken for simple CRUD. In reality, supporting high-velocity feeds with likes, edits, deletions, and follower relationships requires solving concurrency issues, offset drift, and cascade integrity at scale.
      </p>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111111]">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold text-sm mb-2">
            <Zap size={18} />
            <span>Feed Pagination</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">O(log N)</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cursor-based via B-Tree Index</p>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111111]">
          <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-semibold text-sm mb-2">
            <Heart size={18} />
            <span>Likes Atomicity</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">0ms Lag</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optimistic UI with Composite PK</p>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111111]">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-2">
            <ShieldCheck size={18} />
            <span>Integrity Guard</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">ON DELETE CASCADE</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Zero orphaned records</p>
        </div>
      </div>

      {/* Section 1: The Cursor Pagination Dilemma */}
      <h2 className="prose-h2 mt-12 mb-4">1. Why Offset Pagination Fails at Scale</h2>
      <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
        When an application grows, naive pagination using <code>LIMIT 20 OFFSET 50000</code> introduces two catastrophic problems:
      </p>

      <div className="space-y-4 my-6">
        <div className="p-5 border border-red-200 dark:border-red-950/40 rounded-xl bg-red-50/50 dark:bg-red-950/10">
          <h4 className="font-bold text-red-900 dark:text-red-200 text-sm mb-1">Problem A: Offset Drift (Duplicate & Skipped Posts)</h4>
          <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
            If a user views page 1, and 5 new tweets are posted while they scroll, requesting page 2 with <code>OFFSET 20</code> will return the last 5 posts from page 1 again. The user experiences frustrating duplicate content or misses posts entirely.
          </p>
        </div>

        <div className="p-5 border border-red-200 dark:border-red-950/40 rounded-xl bg-red-50/50 dark:bg-red-950/10">
          <h4 className="font-bold text-red-900 dark:text-red-200 text-sm mb-1">Problem B: Full Table Discards</h4>
          <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
            PostgreSQL must read and evaluate all previous <code>50,000</code> rows off disk just to throw them away and return the next 20. Latency spikes from 2ms to over 800ms.
          </p>
        </div>
      </div>

      <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111111] shadow-sm my-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Database size={20} className="text-violet-600 dark:text-violet-400" />
          The SOLITX Solution: Timestamp Cursors
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          We pass the <code>created_at</code> timestamp of the last post as a cursor. PostgreSQL directly jumps to the target entry in the B-Tree index:
        </p>
        <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-800">
          <code>{`SELECT p.id, p.content, p.created_at, p.updated_at, u.username,
  (SELECT COUNT(*)::int FROM likes l WHERE l.post_id = p.id) as likes_count,
  EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1) as has_liked
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.created_at < $cursor
ORDER BY p.created_at DESC
LIMIT 20;`}</code>
        </pre>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
          Lookup time remains completely constant (&lt;2ms) whether fetching post 20 or post 2,000,000.
        </p>
      </div>

      {/* Section 2: Complete Post Lifecycle Architecture */}
      <h2 className="prose-h2 mt-12 mb-4">2. The Complete Post Lifecycle</h2>
      <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
        Our post architecture encapsulates state verification, authorization barriers, and real-time client feedback.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111111]">
          <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
            <Edit3 size={18} />
            <span>Inline Editing & Audit Trail</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Authors can edit post content up to 500 characters. The backend sets <code>updated_at = NOW()</code>, triggering an <em>(edited)</em> status indicator in the UI. Requests from non-owners return <code>403 Forbidden</code>.
          </p>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111111]">
          <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
            <Trash2 size={18} />
            <span>Cascading Deletions</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Foreign key cascades guarantee that deleting a post cleans up all related likes and interactions in PostgreSQL atomically, preventing orphan records and database bloat.
          </p>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111111]">
          <div className="flex items-center gap-2 text-pink-600 font-bold mb-2">
            <Heart size={18} />
            <span>Optimistic Engagement</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The client toggles likes instantly in the UI with micro-animations. If the server request encounters a failure, the client silently reverts the heart state without jarring page flashes.
          </p>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111111]">
          <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2">
            <Layers size={18} />
            <span>Follow Graph & Suggestions</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Social relationships are tracked in the <code>follows</code> table with composite keys. Sidebar queries recommend active users not yet in the user's graph with single-click follow toggling.
          </p>
        </div>
      </div>

      {/* Section 3: Key Takeaways */}
      <h2 className="prose-h2 mt-12 mb-4">3. Key Architectural Takeaways</h2>
      <div className="space-y-3 my-6">
        {[
          "Cursor pagination prevents both offset drift and full-table discard latency spikes.",
          "Stateless JWT authorization guarantees that write/update operations cannot be spoofed.",
          "Relational integrity constraints (ON DELETE CASCADE) keep the database clean and self-healing.",
          "Optimistic UI updates deliver a native-feeling experience while preserving backend consistency."
        ].map((point, index) => (
          <div key={index} className="flex items-start gap-3 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-[#161616]">
            <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{point}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
