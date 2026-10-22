import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Database, 
  Server, 
  ArrowRight, 
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
  Send,
  Bell,
  ListOrdered,
  Workflow,
  Sparkles
} from 'lucide-react';

export default function Day24SynchronousAudit() {
  // ─── INTERACTIVE WATERFALL SIMULATOR STATE ───
  const [followerCount, setFollowerCount] = useState(5);
  const [includeAuthorEnrichment, setIncludeAuthorEnrichment] = useState(true);
  const [includeNotifications, setIncludeNotifications] = useState(true);
  const [includeAggregateCount, setIncludeAggregateCount] = useState(true);
  const [includeCacheInvalidation, setIncludeCacheInvalidation] = useState(true);
  const [includeTimelinePush, setIncludeTimelinePush] = useState(true);

  // Baseline unit latencies measured empirically in Day 24 audit (ms)
  const UNIT_LATENCIES = {
    primaryInsert: 262.2,     // Primary DB INSERT INTO posts (Critical Path)
    authorLookup: 257.3,      // SELECT author profile from users
    singleNotification: 258.4, // Single INSERT INTO notifications
    fanoutPerFollower: 258.7,  // Per-follower notification insert
    aggregateCount: 257.2,    // SELECT COUNT(*) FROM likes
    cacheInvalidation: 46.6,   // Redis DEL user profile
    timelinePush: 90.6,        // Redis LPUSH timeline
    queueEnqueue: 3.5,         // Redis LPUSH to job queue (Decoupled)
  };

  // Calculate dynamic waterfall latencies
  const waterfallMetrics = useMemo(() => {
    const primary = UNIT_LATENCIES.primaryInsert;
    const author = includeAuthorEnrichment ? UNIT_LATENCIES.authorLookup : 0;
    const notifs = includeNotifications ? (followerCount * UNIT_LATENCIES.fanoutPerFollower) : 0;
    const count = includeAggregateCount ? UNIT_LATENCIES.aggregateCount : 0;
    const cache = includeCacheInvalidation ? UNIT_LATENCIES.cacheInvalidation : 0;
    const timeline = includeTimelinePush ? UNIT_LATENCIES.timelinePush : 0;

    const totalSync = primary + author + notifs + count + cache + timeline;
    const totalAsync = primary + UNIT_LATENCIES.queueEnqueue;

    const criticalShare = ((primary / totalSync) * 100).toFixed(1);
    const secondaryShare = (100 - criticalShare).toFixed(1);
    const speedup = (totalSync / totalAsync).toFixed(1);
    const latencySavedPercent = ((1 - (totalAsync / totalSync)) * 100).toFixed(1);

    return {
      primary,
      author,
      notifs,
      count,
      cache,
      timeline,
      totalSync: Math.round(totalSync),
      totalAsync: Math.round(totalAsync),
      criticalShare,
      secondaryShare,
      speedup,
      latencySavedPercent
    };
  }, [
    followerCount, 
    includeAuthorEnrichment, 
    includeNotifications, 
    includeAggregateCount, 
    includeCacheInvalidation, 
    includeTimelinePush
  ]);

  // ─── SYSTEM DESIGN GLOSSARY STATE ───
  const [glossaryCategory, setGlossaryCategory] = useState('all');
  const [glossarySearch, setGlossarySearch] = useState('');

  const glossaryTerms = [
    {
      term: 'Critical Path',
      category: 'architecture',
      badge: 'Core Concept',
      definition: 'The absolute minimal sequence of operations that MUST complete before an HTTP request can safely return success to the client.',
      analogy: 'When depositing cash at an ATM, the ATM immediately counts and credits your balance (Critical Path). Sending an email receipt happens afterward.',
      solitxContext: 'In SOLITX: Validating text and inserting the row into PostgreSQL (`posts`) is the ONLY critical path. Everything else is secondary.'
    },
    {
      term: 'Secondary Side Effect',
      category: 'architecture',
      badge: 'Decoupling Target',
      definition: 'Any downstream mutation or notification triggered by a primary action that does not alter the fundamental validity of the original event.',
      analogy: 'Liking a photo is the event; notifying the photographer, incrementing their badge count, and updating the global leaderboard are side effects.',
      solitxContext: 'Generating `post_like` in-app notifications, updating like counters, and invalidating Redis caches are secondary side-effects in SOLITX.'
    },
    {
      term: 'Blast Radius & Fault Isolation',
      category: 'reliability',
      badge: 'Resilience Law',
      definition: 'The maximum potential damage or service degradation that can occur when a single component, query, or sub-task fails.',
      analogy: 'Submarine bulkheads: if one compartment floods, water-tight doors prevent the entire ship from sinking.',
      solitxContext: 'If notifications table has row locks, post creation should still succeed! Synchronous execution creates 100% blast radius.'
    },
    {
      term: 'Connection Starvation',
      category: 'bottleneck',
      badge: 'Database Metric',
      definition: 'The exhaustion of database connection pool slots because requests hold connections open while executing long-running secondary tasks.',
      analogy: 'Customers sitting at a restaurant table for 2 hours after finishing dinner, preventing new waiting diners from being seated.',
      solitxContext: 'Holding a PostgreSQL pool client for 2,200ms across 5 notifications starves the 25-connection pool 8x faster than a 260ms release.'
    },
    {
      term: 'Job Producer vs. Job Consumer',
      category: 'patterns',
      badge: 'Asynchronous Pattern',
      definition: 'A decoupled design where the web server (Producer) pushes an event message into a queue in <5ms, and a background worker (Consumer) executes it.',
      analogy: 'A restaurant waiter (Producer) drops the order ticket onto the kitchen spindle (Queue) and returns to tables; chefs (Consumers) cook the meal.',
      solitxContext: 'SOLITX API instances will act as producers pushing `{ postId, actorId, type }` into Redis; background workers will process side effects.'
    },
    {
      term: 'Eventual Consistency',
      category: 'data',
      badge: 'Distributed Systems',
      definition: 'A consistency model where all data replicas and side-effects eventually synchronize, but are not guaranteed to be instantaneous at millisecond T(0).',
      analogy: 'Depositing a check into a mobile banking app: your account reflects the funds immediately, but clearing with the federal reserve completes overnight.',
      solitxContext: 'A user creating a tweet sees it immediately; their followers receive the in-app notification 300ms later without breaking expectations.'
    },
    {
      term: 'Write Amplification (Fan-Out)',
      category: 'bottleneck',
      badge: 'Scale Limit',
      definition: 'The multiplicative increase in backend writes generated by a single user write action when broadcasting to N followers.',
      analogy: 'One person shouting into a microphone requiring 10,000 separate phone calls to be placed manually by hand.',
      solitxContext: 'When a user with 5,000 followers posts, synchronous fanout requires 5,000 DB inserts in one HTTP request, causing fatal timeout crashes.'
    },
    {
      term: 'Idempotency',
      category: 'reliability',
      badge: 'Queue Prerequisite',
      definition: 'The mathematical property where an operation can be applied multiple times without changing the result beyond the initial application.',
      analogy: 'Pressing the elevator button 10 times produces the exact same elevator arrival as pressing it once.',
      solitxContext: 'If a background notification worker retries a failed job, an idempotent unique index `(recipient_id, post_id, type)` prevents duplicate alerts.'
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Activity size={13} className="animate-pulse" />
          <span>Part VI — Asynchronous Processing • Day 24 of 78</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Find Synchronous Work That Shouldn't Be
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          In Day 24, we performed an empirical latency audit of the write lifecycle across SOLITX's core endpoints. 
          We discovered that <span className="font-semibold text-zinc-900 dark:text-zinc-200">75% to 88% of request blocking time</span> is 
          wasted on non-critical secondary side-effects (in-app notifications, live aggregate counts, cache invalidation, and fanout), 
          establishing the architectural boundary for asynchronous message queues.
        </p>

        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Critical Path Share</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">11.9% – 24.2%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">The only necessary DB write</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Wasted Client Wait</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">75.8% – 88.1%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Secondary blocking work</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Sync Waterfall</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">1,082 – 2,208 ms</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Measured on Neon + Redis</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Decoupled Queue Target</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">265 ms (8.3x)</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Primary write + fast enqueue</div>
          </div>
        </div>
      </div>

      {/* ─── 01. THE PROBLEM ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">01</span>
          <h2>The Problem: The Hidden Cost of Feature Creep in Write APIs</h2>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
          <p>
            When building the initial monolith in Days 4–6, endpoints were simple: a user submitted a post, 
            we ran an <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">INSERT INTO posts</code> query, 
            and returned <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">201 Created</code>.
          </p>
          <p>
            As product requirements evolved across 23 days of engineering, we added essential social features:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>In-App Notifications:</strong> Notifying authors when their post is liked or commented on.</li>
            <li><strong>Live Counter Recalculations:</strong> Running <code className="text-xs font-mono">COUNT(*)</code> queries on likes and replies to display real-time counters.</li>
            <li><strong>Author Profile Enrichment:</strong> Querying the <code className="text-xs font-mono">users</code> table to attach usernames and bios for immediate frontend rendering.</li>
            <li><strong>Distributed Cache Invalidation:</strong> Deleting stale user profile keys in Redis.</li>
            <li><strong>Timeline Fanout:</strong> Pushing newly created post IDs into follower timeline lists in Redis.</li>
          </ul>
          <p>
            Because these features were added incrementally inside the HTTP request loop, <strong>every write request became a synchronous waterfall</strong>. 
            The user was forced to wait for all downstream side-effects to finish before their mobile app or browser received confirmation that their tweet was saved!
          </p>
        </div>
      </section>

      {/* ─── 02. WHY IS IT A PROBLEM? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">02</span>
          <h2>Why Is It a Problem? The Synchronous Blocking Chain & Pool Lockup</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
              <Clock size={16} />
              <span>1. Severe Latency Inflation</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Instead of an instant 35ms response, the user waits 1,000ms to 2,200ms. If a post mentions 5 users or notifies followers, the request latency explodes proportionally to the number of recipients.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm">
              <ShieldAlert size={16} />
              <span>2. Fragile Blast Radius</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If the <code className="font-mono text-[11px]">notifications</code> table suffers from a lock or transient timeout, the entire post creation crashes! A non-critical notification error destroys core post creation.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              <Database size={16} />
              <span>3. DB Connection Starvation</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Holding a PostgreSQL pool connection open across sequential notification queries starves our connection budget (capped at 25 in Day 21), bottlenecking all other concurrent users.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 03. WHAT ARE OUR OPTIONS? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">03</span>
          <h2>What Are Our Options? Architectural Decoupling Comparison</h2>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="p-3 font-medium">Approach</th>
                <th className="p-3 font-medium">Latency</th>
                <th className="p-3 font-medium">Fault Isolation</th>
                <th className="p-3 font-medium">Reliability / Retry</th>
                <th className="p-3 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  A. Synchronous In-Process (Current)
                </td>
                <td className="p-3 text-rose-500 font-mono">1,080 – 2,200 ms</td>
                <td className="p-3 text-rose-500">None (100% blast radius)</td>
                <td className="p-3">None (Fails entire request)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400">Rejected (Bottleneck)</span>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  B. Unhandled Promise (<code className="font-mono text-[11px]">setImmediate</code> / Fire & Forget)
                </td>
                <td className="p-3 text-emerald-500 font-mono">~265 ms</td>
                <td className="p-3 text-amber-500">Partial (Node process shared)</td>
                <td className="p-3 text-rose-500">Zero (If server crashes, job is lost)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400">Rejected (Data Loss)</span>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  C. Redis Queue + Worker (Decoupled Producer-Consumer)
                </td>
                <td className="p-3 text-emerald-500 font-mono">~265 ms (35ms cached)</td>
                <td className="p-3 text-emerald-500">Complete (Isolated worker process)</td>
                <td className="p-3 text-emerald-500">Full (Retries, Backoff, Dead-Letter)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Selected (ADR-004)</span>
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
          <h2>What Did I Learn? The Durability Boundary & Eventual Consistency</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            The Golden Rule of Distributed System Boundaries
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            In system design, synchronous blocking is only justified when the caller cannot continue without an absolute durability guarantee.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Must Be Synchronous:</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Input sanitization, user authentication check, and inserting the immutable post record into PostgreSQL. Without this, the post does not exist.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-1">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Must Be Asynchronous:</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Pushing notifications to other users, incrementing badge numbers, refreshing aggregate counters, and updating follower feeds. Users accept a 300ms delay for notification badges!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 05. DECISION ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">05</span>
          <h2>Decision: ADR-004 Synchronous vs Asynchronous Boundary Policy</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            We formally adopted <strong>ADR-004</strong>: We establish a strict architectural boundary dividing write requests into <strong>Critical Path Producers</strong> and <strong>Asynchronous Consumers</strong>.
          </p>
          <div className="space-y-2 font-mono text-xs bg-zinc-950 text-zinc-300 p-3.5 rounded-lg border border-zinc-800">
            <div><span className="text-emerald-400 font-semibold">// CRITICAL PATH (HTTP API Response &lt;= 35ms):</span></div>
            <div>1. Validate schema & authentication permissions</div>
            <div>2. INSERT INTO posts (...) VALUES (...) RETURNING id, content, created_at;</div>
            <div>3. await redis.lpush('queue:jobs', JSON.stringify(&#123; type: 'POST_CREATED', postId, actorId &#125;));</div>
            <div>4. return res.status(201).json(&#123; success: true, post &#125;);</div>
            <div className="pt-2"><span className="text-amber-400 font-semibold">// ASYNCHRONOUS WORKER (Background Pipeline):</span></div>
            <div>- Parse @mentions & batch INSERT INTO notifications</div>
            <div>- Increment user posts_count in Redis & PostgreSQL</div>
            <div>- Fanout post ID to follower timeline sorted lists in Redis</div>
          </div>
        </div>
      </section>

      {/* ─── 06. ARCHITECTURE BEFORE ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">06</span>
          <h2>Architecture Before: The 1,080ms - 2,208ms Synchronous Waterfall</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// CURRENT SYNCHRONOUS HTTP REQUEST-RESPONSE LOOP</div>
          <div className="text-rose-400">[Client Browser / Mobile App]</div>
          <div className="pl-4">│  POST /api/v1/posts (Payload: content, category)</div>
          <div className="pl-4">▼</div>
          <div className="text-amber-400">[API Gateway / NGINX Upstream (Port 5015 / 5016)]</div>
          <div className="pl-8 text-zinc-400">├─ 1. Authenticate JWT & Validate (12ms)</div>
          <div className="pl-8 text-emerald-400">├─ 2. INSERT INTO posts [Neon DB] (262ms)   &lt;-- CRITICAL PATH</div>
          <div className="pl-8 text-rose-400">├─ 3. SELECT author FROM users [Neon DB] (257ms) &lt;-- BLOCKING</div>
          <div className="pl-8 text-rose-400">├─ 4. INSERT INTO notifications [Neon DB] (258ms) &lt;-- BLOCKING</div>
          <div className="pl-8 text-rose-400">├─ 5. Follower Notification Fanout (5x) (1,294ms) &lt;-- BLOCKING</div>
          <div className="pl-8 text-rose-400">├─ 6. SELECT COUNT(*) FROM likes (257ms) &lt;-- BLOCKING</div>
          <div className="pl-8 text-rose-400">├─ 7. Redis DEL user cache & LPUSH feed (137ms) &lt;-- BLOCKING</div>
          <div className="pl-4">│</div>
          <div className="pl-4">▼ (TOTAL ELAPSED: ~2,208 ms)</div>
          <div className="text-rose-400">[HTTP 201 Response returned to User]</div>
        </div>
      </section>

      {/* ─── 07. ARCHITECTURE AFTER ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">07</span>
          <h2>Architecture After: Decoupled Producer-Queue-Worker Topology</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// FUTURE DECOUPLED ASYNCHRONOUS PIPELINE (PART VI)</div>
          <div className="text-emerald-400">[Client Browser / Mobile App]</div>
          <div className="pl-4">│  POST /api/v1/posts</div>
          <div className="pl-4">▼</div>
          <div className="text-indigo-400">[API Gateway / NGINX Upstream]</div>
          <div className="pl-8 text-zinc-400">├─ 1. Authenticate JWT (In-Memory) (2ms)</div>
          <div className="pl-8 text-emerald-400">├─ 2. INSERT INTO posts [Neon DB] (262ms)   &lt;-- CRITICAL PATH</div>
          <div className="pl-8 text-indigo-400">├─ 3. Enqueue Job to Redis (3.5ms)          &lt;-- FAST PRODUCER</div>
          <div className="pl-4">│</div>
          <div className="pl-4">▼ (TOTAL CLIENT ELAPSED: ~265 ms • 8.3x FASTER!)</div>
          <div className="text-emerald-400">[HTTP 201 Created Returned Instantly to User]</div>
          <div className="pt-2 text-zinc-500">----------------------------------------------------------------------</div>
          <div className="text-amber-400">[Background Worker Process (Asynchronous Consumer)]</div>
          <div className="pl-8 text-zinc-400">├─ Dequeues job from Redis: "POST_CREATED"</div>
          <div className="pl-8 text-zinc-400">├─ Asynchronously batch inserts notifications</div>
          <div className="pl-8 text-zinc-400">├─ Updates follower Redis timeline caches</div>
          <div className="pl-8 text-zinc-400">└─ Auto-retries with exponential backoff if Neon DB is busy</div>
        </div>
      </section>

      {/* ─── 08. IMPLEMENTATION & INTERACTIVE WATERFALL SIMULATOR ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">08</span>
          <h2>Implementation: Synchronous vs. Asynchronous Waterfall Visualizer</h2>
        </div>

        {/* Live Interactive Simulator Box */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sliders size={16} className="text-indigo-500" />
                Interactive Write Lifecycle Simulator
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Adjust side-effect workloads to observe how synchronous request waterfall scales vs. asynchronous queuing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Zap size={12} />
                {waterfallMetrics.speedup}x Speedup
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                -{waterfallMetrics.latencySavedPercent}% Latency
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span>Followers to Notify (Fanout):</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{followerCount} followers</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="1"
                value={followerCount} 
                onChange={(e) => setFollowerCount(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>1 user</span>
                <span>10 users</span>
                <span>20 users</span>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeNotifications} 
                  onChange={(e) => setIncludeNotifications(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Sync Notification Inserts</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeAggregateCount} 
                  onChange={(e) => setIncludeAggregateCount(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Sync Live Aggregate COUNT(*)</span>
              </label>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeCacheInvalidation} 
                  onChange={(e) => setIncludeCacheInvalidation(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Sync Redis Cache Invalidation</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeTimelinePush} 
                  onChange={(e) => setIncludeTimelinePush(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Sync Redis Timeline LPUSH</span>
              </label>
            </div>
          </div>

          {/* Graphical Waterfall Bars */}
          <div className="space-y-4 pt-2">
            {/* 1. Synchronous Blocking Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <XCircle size={14} />
                  Current Architecture: Synchronous Blocking Waterfall
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{waterfallMetrics.totalSync} ms</span>
              </div>
              <div className="w-full h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 p-1 flex items-center gap-1 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <div 
                  style={{ width: `${Math.max(5, (waterfallMetrics.primary / waterfallMetrics.totalSync) * 100)}%` }}
                  className="h-full rounded bg-emerald-500 flex items-center justify-center text-[10px] font-mono text-white px-1 overflow-hidden transition-all duration-300"
                  title={`Primary DB Insert: ${Math.round(waterfallMetrics.primary)}ms`}
                >
                  DB Insert
                </div>
                {waterfallMetrics.author > 0 && (
                  <div 
                    style={{ width: `${(waterfallMetrics.author / waterfallMetrics.totalSync) * 100}%` }}
                    className="h-full rounded bg-indigo-500 flex items-center justify-center text-[10px] font-mono text-white px-1 overflow-hidden transition-all duration-300"
                    title={`Author Lookup: ${Math.round(waterfallMetrics.author)}ms`}
                  >
                    Author
                  </div>
                )}
                {waterfallMetrics.notifs > 0 && (
                  <div 
                    style={{ width: `${(waterfallMetrics.notifs / waterfallMetrics.totalSync) * 100}%` }}
                    className="h-full rounded bg-rose-500 flex items-center justify-center text-[10px] font-mono text-white px-1 overflow-hidden transition-all duration-300"
                    title={`Fanout Notifications: ${Math.round(waterfallMetrics.notifs)}ms`}
                  >
                    Notifs ({followerCount}x)
                  </div>
                )}
                {waterfallMetrics.count > 0 && (
                  <div 
                    style={{ width: `${(waterfallMetrics.count / waterfallMetrics.totalSync) * 100}%` }}
                    className="h-full rounded bg-amber-500 flex items-center justify-center text-[10px] font-mono text-white px-1 overflow-hidden transition-all duration-300"
                    title={`Aggregate Count: ${Math.round(waterfallMetrics.count)}ms`}
                  >
                    Count(*)
                  </div>
                )}
                {waterfallMetrics.cache > 0 && (
                  <div 
                    style={{ width: `${(waterfallMetrics.cache / waterfallMetrics.totalSync) * 100}%` }}
                    className="h-full rounded bg-purple-500 flex items-center justify-center text-[10px] font-mono text-white px-1 overflow-hidden transition-all duration-300"
                    title={`Redis Cache DEL: ${Math.round(waterfallMetrics.cache)}ms`}
                  >
                    Cache
                  </div>
                )}
                {waterfallMetrics.timeline > 0 && (
                  <div 
                    style={{ width: `${(waterfallMetrics.timeline / waterfallMetrics.totalSync) * 100}%` }}
                    className="h-full rounded bg-sky-500 flex items-center justify-center text-[10px] font-mono text-white px-1 overflow-hidden transition-all duration-300"
                    title={`Redis Timeline LPUSH: ${Math.round(waterfallMetrics.timeline)}ms`}
                  >
                    Feed
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                <span>Critical Path: <strong className="text-emerald-600 dark:text-emerald-400">{waterfallMetrics.criticalShare}%</strong></span>
                <span>Wasted Side Effects: <strong className="text-rose-600 dark:text-rose-400">{waterfallMetrics.secondaryShare}%</strong></span>
              </div>
            </div>

            {/* 2. Asynchronous Decoupled Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={14} />
                  Future Architecture: Decoupled Job Queue (Part VI)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{waterfallMetrics.totalAsync} ms</span>
              </div>
              <div className="w-full h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 p-1 flex items-center gap-1 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <div 
                  style={{ width: `${Math.min(100, (waterfallMetrics.totalAsync / waterfallMetrics.totalSync) * 100)}%` }}
                  className="h-full rounded bg-emerald-500 flex items-center justify-between text-[10px] font-mono text-white px-2 overflow-hidden transition-all duration-300"
                >
                  <span>DB Insert (262ms)</span>
                  <span>+ Enqueue (3.5ms)</span>
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                Background workers execute remaining {Math.round(waterfallMetrics.totalSync - waterfallMetrics.totalAsync)}ms of side-effects asynchronously without keeping user waiting.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 09. TESTING ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">09</span>
          <h2>Testing: Empirical Profiling across Neon PostgreSQL & Upstash Redis</h2>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed space-y-2">
          <p>
            We authored an automated diagnostic harness <code className="font-mono text-xs px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">backend/tests/06_synchronous_audit_test.js</code>. 
            The test established direct pooled connections to our live PostgreSQL cluster and Upstash Redis instance, measuring 10 consecutive iterations of each write sub-task in complete isolation:
          </p>
          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 space-y-1">
            <div className="text-zinc-500">// Run audit test via Node.js:</div>
            <div className="text-emerald-400">$ node tests/06_synchronous_audit_test.js</div>
            <div className="text-zinc-400">[1/4] Establishing direct diagnostic connections to Neon PostgreSQL & Upstash Redis...</div>
            <div className="text-zinc-400">[2/4] Profiling Individual Write Sub-Tasks (Isolated Micro-Benchmarks)...</div>
            <div className="text-zinc-400">[3/4] Testing Live Gateway Endpoint Under Current Architecture...</div>
            <div className="text-zinc-400">[4/4] Cleaning up benchmark test records...</div>
          </div>
        </div>
      </section>

      {/* ─── 10. RESULTS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">10</span>
          <h2>Results: Real Measured Benchmarks from Day 24 Profiler</h2>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="p-3 font-medium">Sub-Task Operation</th>
                <th className="p-3 font-medium">Target Infrastructure</th>
                <th className="p-3 font-medium">Measured Latency (Avg)</th>
                <th className="p-3 font-medium">Request Classification</th>
                <th className="p-3 font-medium">Architectural Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr className="bg-emerald-500/5">
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">1. Primary DB Insert</td>
                <td className="p-3 font-mono">PostgreSQL (posts table)</td>
                <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">262.20 ms</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium">CRITICAL PATH</span></td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Keep Synchronous (Guarantees Durability)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">2. Author Profile Query</td>
                <td className="p-3 font-mono">PostgreSQL (users table)</td>
                <td className="p-3 font-mono">257.27 ms</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">Enrichment</span></td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Cache in Redis / Read from JWT payload</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">3. Single In-App Notification</td>
                <td className="p-3 font-mono">PostgreSQL (notifications)</td>
                <td className="p-3 font-mono">258.40 ms</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">Secondary</span></td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Move to Asynchronous Queue</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">4. Follower Notification Fanout (5x)</td>
                <td className="p-3 font-mono">PostgreSQL (notifications)</td>
                <td className="p-3 font-mono font-bold text-rose-500">1,293.70 ms</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-medium">Secondary (Severe)</span></td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Move to Background Worker Batch Job</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">5. Live Aggregate Count Query</td>
                <td className="p-3 font-mono">PostgreSQL (likes table)</td>
                <td className="p-3 font-mono">257.23 ms</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">Secondary</span></td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Replace with Redis atomic INCR counter</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">6. Redis Cache Invalidation</td>
                <td className="p-3 font-mono">Upstash Redis (DEL)</td>
                <td className="p-3 font-mono">46.64 ms</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium">Secondary</span></td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Fast event-driven invalidation</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">7. Redis Timeline Feed Fanout</td>
                <td className="p-3 font-mono">Upstash Redis (LPUSH)</td>
                <td className="p-3 font-mono">90.64 ms</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium">Secondary</span></td>
                <td className="p-3 text-zinc-600 dark:text-zinc-400">Move to Asynchronous Fanout Worker</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 11. TRADE-OFFS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">11</span>
          <h2>Trade-offs: The Mandatory Cost of Asynchronous Architecture</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              What We Gain
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>8.3x Faster Write Responses:</strong> Client latency drops from ~2,208ms to ~265ms.</li>
              <li><strong>85% Reduction in DB Connection Lockup:</strong> Pool connections are returned to the pool immediately instead of waiting for notifications.</li>
              <li><strong>Zero Blast Radius:</strong> A database lock or outage in notifications cannot prevent users from posting tweets.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              What We Pay For It
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Eventual Consistency Complexity:</strong> UI must handle cases where a post exists before its notification is generated.</li>
              <li><strong>Queue Failure Modes:</strong> Background workers can crash, requiring retries, dead-letter queues, and idempotency keys (Days 26–28).</li>
              <li><strong>Operational Footprint:</strong> Requires running and monitoring background worker processes alongside web servers.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 12. WHAT BROKE NEXT? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">12</span>
          <h2>What Broke Next? The Background Queue Challenge (Bridge to Day 25)</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Now that we know exactly what work needs to be asynchronous, a new engineering question arises: 
            <strong>How do we reliably hand off jobs from the API to background workers without losing messages if a process crashes?</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Day 25: Queue Architecture</span>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Implement a reliable Redis queue (BullMQ) to decouple producers from consumers.</p>
            </div>
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Day 26: Notification Queue</span>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Wire like/comment notifications to the background worker pipeline.</p>
            </div>
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Day 27: Worker Failures</span>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Handle crashed workers with exponential backoff and dead-letter queues.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SYSTEM DESIGN GLOSSARY ─── */}
      <section className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Workflow size={18} className="text-indigo-500" />
              Core System Design Glossary: Asynchronous Processing
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Essential distributed systems vocabulary for decoupling synchronous workflows into background jobs.
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
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'architecture', 'reliability', 'bottleneck', 'patterns', 'data'].map((cat) => (
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
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                {item.definition}
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/60 space-y-1 text-[11px]">
                <div className="text-zinc-500 dark:text-zinc-400 font-medium">Real-World Analogy:</div>
                <div className="text-zinc-600 dark:text-zinc-400 italic">"{item.analogy}"</div>
                <div className="text-indigo-600 dark:text-indigo-400 font-medium pt-1">SOLITX Application:</div>
                <div className="text-zinc-700 dark:text-zinc-300">{item.solitxContext}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
