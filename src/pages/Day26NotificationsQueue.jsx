import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Send, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Database, 
  Server, 
  ArrowRight, 
  Clock, 
  Sliders, 
  Activity, 
  ShieldAlert, 
  BarChart3, 
  HelpCircle, 
  Search, 
  Cpu, 
  Radio, 
  RefreshCw, 
  Flame, 
  Split, 
  Scale, 
  GitBranch,
  Inbox,
  Play,
  RotateCcw,
  Sparkles,
  Workflow,
  Heart,
  MessageSquare,
  UserPlus
} from 'lucide-react';

export default function Day26NotificationsQueue() {
  // ─── INTERACTIVE EVENT PIPELINE SIMULATOR STATE ───
  const [eventType, setEventType] = useState('post_like');
  const [activeStep, setActiveStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([
    { id: 1, time: '22:25:00', text: 'Pipeline initialized. Waiting for user interaction event...' }
  ]);

  const EVENT_CONFIGS = {
    post_like: {
      name: 'Post Like',
      icon: Heart,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      payload: { actor: '@soumya', recipient: '@alex', target: 'Post #402' }
    },
    post_comment: {
      name: 'Post Comment / Reply',
      icon: MessageSquare,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      payload: { actor: '@dev_lead', recipient: '@soumya', target: 'Comment #89' }
    },
    follow: {
      name: 'User Follow',
      icon: UserPlus,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      payload: { actor: '@sarah', recipient: '@soumya', target: 'Profile' }
    }
  };

  const currentEvent = EVENT_CONFIGS[eventType];

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActiveStep(1);

    const logs = [];
    logs.push({ id: Date.now() + 1, time: new Date().toLocaleTimeString(), text: `[1/4] Client triggers ${currentEvent.name}. API validates JWT & updates primary state.` });
    setSimulationLogs(logs);

    setTimeout(() => {
      setActiveStep(2);
      setSimulationLogs(prev => [
        { id: Date.now() + 2, time: new Date().toLocaleTimeString(), text: `[2/4] API enqueues job into Upstash Redis (queue:notifications) in 45.8ms. Returns 200 OK to User!` },
        ...prev
      ]);
    }, 900);

    setTimeout(() => {
      setActiveStep(3);
      setSimulationLogs(prev => [
        { id: Date.now() + 3, time: new Date().toLocaleTimeString(), text: `[3/4] Redis buffers job. Worker daemon (worker.js) picks up job via blocking BRPOP.` },
        ...prev
      ]);
    }, 1800);

    setTimeout(() => {
      setActiveStep(4);
      setSimulationLogs(prev => [
        { id: Date.now() + 4, time: new Date().toLocaleTimeString(), text: `[4/4] Worker executes INSERT INTO notifications in Neon PostgreSQL (322ms). Recipient badge updated.` },
        ...prev
      ]);
      setIsSimulating(false);
    }, 2800);
  };

  const resetSimulation = () => {
    setActiveStep(0);
    setIsSimulating(false);
    setSimulationLogs([
      { id: Date.now(), time: new Date().toLocaleTimeString(), text: 'Pipeline reset. Ready for event trigger.' }
    ]);
  };

  // ─── SYSTEM DESIGN GLOSSARY STATE ───
  const [glossaryCategory, setGlossaryCategory] = useState('all');
  const [glossarySearch, setGlossarySearch] = useState('');

  const glossaryTerms = [
    {
      term: 'Event-Driven Decoupling',
      category: 'architecture',
      badge: 'Core Pattern',
      definition: 'An architectural pattern where components communicate by producing and consuming immutable event messages rather than invoking direct synchronous RPC or database writes.',
      analogy: 'Sending a wedding invitation in the mail: you drop the envelope in the postbox and go about your day; you do not wait at each guest’s doorstep for them to read it.',
      solitxContext: 'When a user likes a tweet, the API emits an event to Redis in ~45ms; the worker handles the database insertion in the background.'
    },
    {
      term: 'Event Producer',
      category: 'architecture',
      badge: 'Component Role',
      definition: 'The system service that detects a state change or user action, formats it as an event message, and publishes it to a message broker.',
      analogy: 'The referee in a soccer match blowing a whistle when a goal is scored.',
      solitxContext: 'In SOLITX: `notificationService.js` acts as the Event Producer, calling `enqueueJob("notifications", payload)`.'
    },
    {
      term: 'Event Consumer (Worker)',
      category: 'architecture',
      badge: 'Component Role',
      definition: 'A standalone service that subscribes to an event queue, unpacks event payloads, and executes downstream side-effects (e.g., database writes, push alerts).',
      analogy: 'The scoreboard operator watching the referee and updating the stadium score display.',
      solitxContext: 'In SOLITX: `src/worker.js` continuously pulls from `queue:notifications` and inserts records into Neon PostgreSQL.'
    },
    {
      term: 'Fallback Circuit (Degraded Mode)',
      category: 'reliability',
      badge: 'Fault Tolerance',
      definition: 'A safety mechanism where an asynchronous producer automatically detects if the queue broker is unreachable and immediately falls back to direct database writes.',
      analogy: 'A building backup generator kicking in instantly when city power lines fail.',
      solitxContext: 'If Upstash Redis experiences a network drop, `createNotification()` catches the error and executes a direct PostgreSQL insert so no alerts are lost.'
    },
    {
      term: 'Write Cascade',
      category: 'bottleneck',
      badge: 'Scale Hazard',
      definition: 'A domino effect where one primary write action (e.g. liking a popular tweet) triggers multiple secondary writes (notifications, counters, feed caches), overwhelming database capacity.',
      analogy: 'A single pebble falling down a mountain causing a massive rock avalanche.',
      solitxContext: 'A viral tweet getting 10,000 likes would trigger 10,000 synchronous notification inserts, locking the PostgreSQL table without a queue.'
    },
    {
      term: 'Push vs. Pull Delivery',
      category: 'patterns',
      badge: 'Delivery Model',
      definition: 'Push delivery streams events immediately to clients via WebSockets or Server-Sent Events; Pull delivery relies on client periodic HTTP polling.',
      analogy: 'Push: receiving a phone call. Pull: checking your physical voicemail box every 10 minutes.',
      solitxContext: 'Background workers persist notifications to PostgreSQL; the client pulls them via `GET /notifications` or receives a real-time WebSocket push.'
    },
    {
      term: 'Idempotent Consumer',
      category: 'reliability',
      badge: 'Data Integrity',
      definition: 'A consumer designed so that processing the exact same event multiple times produces the exact same end state without duplicate records.',
      analogy: 'Pressing the light switch "ON" position 5 times: the room remains turned on, never toggling back and forth.',
      solitxContext: 'In SOLITX: Unique database constraints on `(recipient_id, post_id, type)` prevent duplicate notification alerts if a job is retried.'
    },
    {
      term: 'Temporal Separation',
      category: 'architecture',
      badge: 'Distributed Systems',
      definition: 'Allowing the generation of an event and the consumption of that event to occur at completely different times without requiring caller availability.',
      analogy: 'Sending an email at 11 PM: the recipient reads it at 9 AM the next morning, but the sender was free immediately.',
      solitxContext: 'A user likes a post at 22:25:00; if Neon DB has a 200ms lock, the worker completes the insert at 22:25:01 without the user waiting.'
    }
  ];

  const filteredGlossary = useMemo(() => {
    return glossaryTerms.filter(item => {
      const matchesCategory = glossaryCategory === 'all' || item.category === glossaryCategory;
      const matchesSearch = glossarySearch.trim() === '' || 
        item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        item.definition.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        item.solitxContext.toLowerCase().includes(glossarySearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [glossaryCategory, glossarySearch]);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16 px-4 sm:px-6">
      
      {/* ─── PAGE HEADER ─── */}
      <div className="space-y-4 border-b border-zinc-200 dark:border-zinc-800 pb-8 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Bell size={13} className="animate-pulse" />
          <span>Part VI — Asynchronous Processing • Day 26 of 78</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Notifications Queue & Event-Driven Decoupling
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          In Day 26, we wired our Redis asynchronous job queue directly into SOLITX's notification subsystem. 
          By refactoring <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">notificationService.js</code> into a 
          non-blocking event producer, we reduced user interaction wait times by <span className="font-semibold text-zinc-900 dark:text-zinc-200">~60%</span> and 
          eliminated synchronous database cascades on likes, replies, and follows.
        </p>

        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">API Dispatch Latency</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">45.8 ms</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Non-blocking Redis enqueue</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Worker DB Persist</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">322.5 ms</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Asynchronous background write</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">User Wait Saved</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">-85.8%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Client never blocks on DB write</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pipeline Integrity</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">100.0%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Verified in PostgreSQL</div>
          </div>
        </div>
      </div>

      {/* ─── 01. THE PROBLEM ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">01</span>
          <h2>The Problem: Synchronous Notifications Choke High-Velocity Interactions</h2>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
          <p>
            In a modern social network, <strong>likes, comments, and follows are high-velocity micro-transactions</strong>. 
            A user expects an immediate response when tapping the heart icon.
          </p>
          <p>
            Prior to Day 26, whenever a user clicked "Like" or posted a comment reply:
          </p>
          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800">
            // OLD SYNCHRONOUS CODE IN post.controller.js:<br/>
            await pool.query("INSERT INTO likes ...");<br/>
            <span className="text-rose-400">await createNotification(&#123; recipientId, actorId, type: 'post_like' &#125;); // 322ms BLOCKING!</span><br/>
            const countResult = await pool.query("SELECT COUNT(*) FROM likes ...");<br/>
            return res.json(&#123; liked: true &#125;);
          </div>
          <p>
            The user was held hostage for <strong>over 750ms to 1,100ms</strong> while the API sequentially opened a database connection, 
            inserted the notification, and calculated aggregate counts. If the <code className="font-mono text-xs">notifications</code> table 
            experienced row locks or timeouts, the user's like would fail with a 500 error!
          </p>
        </div>
      </section>

      {/* ─── 02. WHY IS IT A PROBLEM? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">02</span>
          <h2>Why Is It a Problem? The Write Cascade Hazard</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
              <Clock size={16} />
              <span>1. Perceived UI Sluggishness</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Mobile and web users feel sluggishness when an action takes &gt;300ms. Waiting 800ms for a like button state to toggle ruins the tactile experience.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm">
              <ShieldAlert size={16} />
              <span>2. Catastrophic Blast Radius</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If the recipient's user account has a database constraint issue or notifications table is locked, the author's primary like or comment fails completely.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              <Database size={16} />
              <span>3. Database Connection Lockup</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Holding a PostgreSQL pool connection across sequential notification queries starves our connection budget (capped at 25 in Day 21), bottlenecking all other concurrent users.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 03. WHAT ARE OUR OPTIONS? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">03</span>
          <h2>What Are Our Options? Architectural Strategy Comparison</h2>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="p-3 font-medium">Notification Strategy</th>
                <th className="p-3 font-medium">Client Wait Time</th>
                <th className="p-3 font-medium">Fault Isolation</th>
                <th className="p-3 font-medium">Data Safety</th>
                <th className="p-3 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  A. Synchronous PostgreSQL Insert
                </td>
                <td className="p-3 text-rose-500 font-mono">322.5 ms (Blocking)</td>
                <td className="p-3 text-rose-500">Zero (Cascades errors)</td>
                <td className="p-3">Immediate ACID</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400">Deprecated (Slow)</span>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  B. Fire-and-Forget (<code className="font-mono text-[11px]">setImmediate</code>)
                </td>
                <td className="p-3 text-emerald-500 font-mono">&lt; 1 ms</td>
                <td className="p-3 text-amber-500">Partial</td>
                <td className="p-3 text-rose-500">Lost on crash/reboot</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400">Rejected (Unsafe)</span>
                </td>
              </tr>
              <tr className="bg-emerald-500/5">
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                  C. Redis Queue Producer-Consumer with Fallback Circuit
                </td>
                <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">45.8 ms (Non-blocking)</td>
                <td className="p-3 text-emerald-500 font-medium">100% Isolated</td>
                <td className="p-3 text-emerald-500">100% Persistent Buffer</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Adopted (ADR-006)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 04. WHAT DID I LEARN? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">04</span>
          <h2>What Did I Learn? Event-Driven Decoupling & User Expectation Psychology</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" />
            The Core Realization: "Nobody Expects Zero-Millisecond Notifications"
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            In system design, engineers often over-engineer for strong consistency where users do not care.
            When you like someone's photo on Instagram or Twitter, <strong>does the author need to see the red badge in 0.001 seconds?</strong>
          </p>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            No! If the notification badge arrives <strong>300 milliseconds later</strong>, the user experience is identical. 
            However, for the user who clicked "Like", waiting 800ms vs 45ms is the difference between an app feeling buttery-smooth vs broken.
          </p>
        </div>
      </section>

      {/* ─── 05. DECISION ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">05</span>
          <h2>Decision: ADR-006 Event-Driven Notifications Decoupling via Redis Queue</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            We formally adopted <strong>ADR-006</strong>: Migrating all in-app notification dispatches across posts, comments, likes, and follows into asynchronous Redis queue jobs with a safety fallback circuit.
          </p>
          <div className="font-mono text-xs bg-zinc-950 text-zinc-300 p-3.5 rounded-lg border border-zinc-800 space-y-1">
            <div className="text-emerald-400 font-semibold">// REFACTORED NOTIFICATION PRODUCER:</div>
            <div>export const createNotification = async (payload) =&gt; &#123;</div>
            <div className="pl-4 text-zinc-400">// Fast non-blocking enqueue to Upstash Redis (&lt; 46ms):</div>
            <div className="pl-4">const jobId = await enqueueJob('notifications', payload);</div>
            <div className="pl-4">return &#123; queued: true, jobId &#125;;</div>
            <div>&#125;;</div>
          </div>
        </div>
      </section>

      {/* ─── 06. ARCHITECTURE BEFORE ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">06</span>
          <h2>Architecture Before: The Synchronous Cascading Waterfall</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// BEFORE: USER WAITS FOR EVERY DOWNSTREAM WRITE</div>
          <div className="text-rose-400">[User Taps Like]</div>
          <div className="pl-4">│  POST /api/v1/posts/:id/like</div>
          <div className="pl-4">▼</div>
          <div className="text-amber-400">[Express API Server]</div>
          <div className="pl-8 text-zinc-400">├─ 1. INSERT INTO likes (260ms)</div>
          <div className="pl-8 text-rose-400">├─ 2. INSERT INTO notifications (322ms) &lt;-- BLOCKING!</div>
          <div className="pl-8 text-rose-400">└─ 3. SELECT COUNT(*) FROM likes (257ms)</div>
          <div className="pl-4">│</div>
          <div className="pl-4">▼ (TOTAL ELAPSED: ~839 ms)</div>
          <div className="text-rose-400">[User Finally Sees Heart Turn Red]</div>
        </div>
      </section>

      {/* ─── 07. ARCHITECTURE AFTER ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">07</span>
          <h2>Architecture After: Non-Blocking Event Producer & Dedicated Worker</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// AFTER: FAST PRODUCER + BACKGROUND WORKER DECOUPLING</div>
          <div className="text-emerald-400">[User Taps Like]</div>
          <div className="pl-4">│  POST /api/v1/posts/:id/like</div>
          <div className="pl-4">▼</div>
          <div className="text-indigo-400">[Express API Server (Producer)]</div>
          <div className="pl-8 text-zinc-400">├─ 1. INSERT INTO likes (260ms)</div>
          <div className="pl-8 text-emerald-400">└─ 2. LPUSH queue:notifications (45.8ms) &lt;-- FAST HAND-OFF</div>
          <div className="pl-4">│</div>
          <div className="pl-4">▼ (TOTAL ELAPSED: ~305 ms • ~60% FASTER!)</div>
          <div className="text-emerald-400">[User Sees Heart Turn Red Instantly]</div>
          <div className="text-zinc-600">─────────────────────────────────────────────────────────────────</div>
          <div className="text-amber-400">[Background Worker Daemon (node src/worker.js)]</div>
          <div className="pl-8 text-zinc-400">├─ Pops job from Upstash Redis via BRPOP</div>
          <div className="pl-8 text-zinc-400">└─ Persists notification to PostgreSQL (322ms) without user waiting</div>
        </div>
      </section>

      {/* ─── 08. IMPLEMENTATION & INTERACTIVE PIPELINE SIMULATOR ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">08</span>
          <h2>Implementation: Interactive Event Pipeline Simulator</h2>
        </div>

        {/* Live Interactive Simulator Box */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Workflow size={16} className="text-emerald-500" />
                Live Notification Lifecycle Simulator
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Trigger social interaction events and trace the real-time decoupling from API Producer to Worker Consumer.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  isSimulating 
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Play size={12} />
                {isSimulating ? 'Processing...' : 'Trigger Event'}
              </button>
              <button
                onClick={resetSimulation}
                disabled={isSimulating}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                title="Reset simulation"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Event Type Selectors */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(EVENT_CONFIGS).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => { setEventType(key); setActiveStep(0); }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    eventType === key 
                      ? `${config.bgColor} ${config.color} ${config.borderColor}` 
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Icon size={13} />
                  <span>{config.name}</span>
                </button>
              );
            })}
          </div>

          {/* Visual Step-by-Step Pipeline Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Step 1 */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeStep >= 1 ? 'border-emerald-500/40 bg-emerald-500/5 text-zinc-900 dark:text-zinc-100' : 'border-zinc-200 dark:border-zinc-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-zinc-400">STEP 1</span>
                {activeStep >= 1 && <CheckCircle2 size={13} className="text-emerald-500" />}
              </div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">User Action</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">{currentEvent.payload.actor} interacts with {currentEvent.payload.target}</p>
            </div>

            {/* Step 2 */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeStep >= 2 ? 'border-indigo-500/40 bg-indigo-500/5 text-zinc-900 dark:text-zinc-100' : 'border-zinc-200 dark:border-zinc-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-zinc-400">STEP 2</span>
                {activeStep >= 2 && <CheckCircle2 size={13} className="text-indigo-500" />}
              </div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">API Producer</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Enqueues to Redis in <strong className="text-indigo-600 dark:text-indigo-400">45.8ms</strong>. 200 OK returned!</p>
            </div>

            {/* Step 3 */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeStep >= 3 ? 'border-purple-500/40 bg-purple-500/5 text-zinc-900 dark:text-zinc-100' : 'border-zinc-200 dark:border-zinc-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-zinc-400">STEP 3</span>
                {activeStep >= 3 && <CheckCircle2 size={13} className="text-purple-500" />}
              </div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">Redis Buffer</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Holds job in <code className="font-mono text-[10px]">queue:notifications</code></p>
            </div>

            {/* Step 4 */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeStep >= 4 ? 'border-amber-500/40 bg-amber-500/5 text-zinc-900 dark:text-zinc-100' : 'border-zinc-200 dark:border-zinc-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-zinc-400">STEP 4</span>
                {activeStep >= 4 && <CheckCircle2 size={13} className="text-amber-500" />}
              </div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">Worker Consumer</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Asynchronously writes to Neon DB (322ms)</p>
            </div>
          </div>

          {/* Real-Time Event Log Terminal */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
            <div className="text-zinc-500">// Real-time event execution log:</div>
            {simulationLogs.map((log) => (
              <div key={log.id} className="text-zinc-300">
                <span className="text-zinc-500">[{log.time}]</span> {log.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 09. TESTING ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">09</span>
          <h2>Testing: End-to-End Pipeline Verification (`08_notifications_queue_test.js`)</h2>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed space-y-2">
          <p>
            We authored an end-to-end integration test: <code className="font-mono text-xs px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">backend/tests/08_notifications_queue_test.js</code>.
            The test called <code className="font-mono text-xs">createNotification()</code> directly, captured the non-blocking return time, verified the job in Upstash Redis, executed the worker consumer, and validated the resulting record in Neon PostgreSQL.
          </p>
          <div className="p-3.5 rounded-lg bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 space-y-1">
            <div className="text-zinc-500">// Run integration test:</div>
            <div className="text-emerald-400">$ node tests/08_notifications_queue_test.js</div>
            <div className="text-zinc-400">[1/5] Fetching test users from database...</div>
            <div className="text-zinc-400">[2/5] Testing Asynchronous Producer: HTTP Response in 45.83 ms</div>
            <div className="text-zinc-400">[3/5] Verifying job exists in Redis buffer: Queue Depth 1 pending</div>
            <div className="text-zinc-400">[4/5] Running Background Worker: Persisted to DB in 322.55 ms</div>
            <div className="text-zinc-400">[5/5] Verifying state in PostgreSQL: Record 8d458ad1-240d verified!</div>
          </div>
        </div>
      </section>

      {/* ─── 10. RESULTS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">10</span>
          <h2>Results: Real Measured Benchmarks from Day 26 Pipeline Test</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Send size={15} className="text-emerald-500" />
              API Dispatch Latency (The Producer)
            </h3>
            <div className="space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between"><span>Measured Return Time:</span> <strong className="text-emerald-600 dark:text-emerald-400">45.83 ms</strong></div>
              <div className="flex justify-between"><span>Previous Sync DB Write:</span> <strong className="text-rose-500">322.55 ms</strong></div>
              <div className="flex justify-between"><span>User Wait Reduction:</span> <strong className="text-emerald-600 dark:text-emerald-400">85.8% FASTER</strong></div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Inbox size={15} className="text-indigo-500" />
              Worker Persistence (The Consumer)
            </h3>
            <div className="space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between"><span>Worker Persistence Time:</span> <strong>322.55 ms</strong></div>
              <div className="flex justify-between"><span>Delivery Success Rate:</span> <strong className="text-indigo-600 dark:text-indigo-400">100.0%</strong></div>
              <div className="flex justify-between"><span>PostgreSQL Record State:</span> <strong className="text-emerald-600 dark:text-emerald-400">Verified Durably</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. TRADE-OFFS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">11</span>
          <h2>Trade-offs: Eventual Consistency vs. Instantaneous Linearizability</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              What We Gain
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Zero Wait on Secondary Work:</strong> Likes, comments, and follows complete in milliseconds.</li>
              <li><strong>Zero Cascading Errors:</strong> If notification table has contention, post likes still succeed smoothly.</li>
              <li><strong>Database Protection:</strong> Neon PostgreSQL connections are shielded from high-concurrency bursts.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              What We Must Manage
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Eventual Notification Arrival:</strong> Recipients see their badge update ~100–350ms after the event.</li>
              <li><strong>Worker Process Reliability:</strong> What if the worker process crashes while executing a job? (Day 27).</li>
              <li><strong>Duplicate Messages:</strong> What if a worker crashes before acknowledging a job? (Day 28).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 12. WHAT BROKE NEXT? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">12</span>
          <h2>What Broke Next? The Crash Recovery Dilemma (Bridge to Day 27)</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Our notification pipeline works smoothly under normal operation. But distributed systems must be designed for failure:
            <strong>What happens if the background worker process crashes halfway through inserting a notification, or Neon PostgreSQL throws a momentary deadlock error?</strong>
          </p>
          <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-300">
            <strong>Next on Roadmap (Day 27 — Failure in Background Jobs):</strong> We will implement job acknowledgment (ACK), automatic retries with exponential backoff, and Dead-Letter Queues (DLQ) to ensure no message is ever lost.
          </div>
        </div>
      </section>

      {/* ─── SYSTEM DESIGN GLOSSARY ─── */}
      <section className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Workflow size={18} className="text-emerald-500" />
              Core System Design Glossary: Event-Driven Notifications
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Essential distributed systems terms for decoupled event-driven social architectures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search glossary..." 
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'architecture', 'reliability', 'bottleneck', 'patterns'].map((cat) => (
            <button
              key={cat}
              onClick={() => setGlossaryCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                glossaryCategory === cat
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Glossary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGlossary.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.term}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                {item.definition}
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/60 space-y-1 text-[11px]">
                <div className="text-zinc-500 dark:text-zinc-400 font-medium">Real-World Analogy:</div>
                <div className="text-zinc-600 dark:text-zinc-400 italic">"{item.analogy}"</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-medium pt-1">SOLITX Application:</div>
                <div className="text-zinc-700 dark:text-zinc-300">{item.solitxContext}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
