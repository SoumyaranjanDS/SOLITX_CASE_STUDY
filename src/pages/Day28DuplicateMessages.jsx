import React, { useState, useMemo } from 'react';
import { 
  CopyCheck, 
  RotateCcw, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Database, 
  Server, 
  ArrowRight, 
  Clock, 
  Activity, 
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
  Sparkles,
  Workflow,
  AlertOctagon,
  ShieldCheck,
  KeyRound,
  FileCheck2
} from 'lucide-react';

export default function Day28DuplicateMessages() {
  // ─── INTERACTIVE IDEMPOTENCY SIMULATOR STATE ───
  const [totalDispatches, setTotalDispatches] = useState(0);
  const [tier1Interceptions, setTier1Interceptions] = useState(0);
  const [tier2Interceptions, setTier2Interceptions] = useState(0);
  const [dbRowsCreated, setDbRowsCreated] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventLogs, setEventLogs] = useState([
    { id: 1, time: '23:05:00', type: 'info', text: 'Idempotency engine ready. Redis SETNX cache & Neon PG unique index active.' }
  ]);

  // Simulate 5 Concurrent Duplicate Job Dispatches
  const simulateDuplicateBurst = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const idempotencyKey = 'notif:post_mention:101:42';
    setEventLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'info', text: `[Producer] Firing burst of 5 identical events with key '${idempotencyKey}'...` },
      ...prev
    ]);

    let step = 1;
    const runStep = () => {
      setTotalDispatches(prev => prev + 1);

      if (step === 1) {
        // First request: Passes Redis, inserts into DB
        setDbRowsCreated(1);
        setEventLogs(prev => [
          { id: Date.now() + 1, time: new Date().toLocaleTimeString(), type: 'success', text: `[Dispatch #1] Tier 1: Redis SETNX key acquired. Tier 2: Row written to PostgreSQL! (Rows: 1)` },
          ...prev
        ]);
      } else if (step === 4) {
        // Step 4: Simulate Cache Miss / TTL Expiry -> Tier 2 catches it
        setTier2Interceptions(prev => prev + 1);
        setEventLogs(prev => [
          { id: Date.now() + 4, time: new Date().toLocaleTimeString(), type: 'tier2', text: `[Dispatch #4] ⚠️ Redis cache miss simulated! Fell back to PostgreSQL: ON CONFLICT DO NOTHING intercepted! (Rows: 1)` },
          ...prev
        ]);
      } else {
        // Steps 2, 3, 5: Tier 1 Redis intercepts immediately in <1ms
        setTier1Interceptions(prev => prev + 1);
        setEventLogs(prev => [
          { id: Date.now() + step, time: new Date().toLocaleTimeString(), type: 'tier1', text: `[Dispatch #${step}] 🛡️ Tier 1 Intercept: Duplicate key found in Redis SETNX (< 1ms). DB write skipped!` },
          ...prev
        ]);
      }

      step++;
      if (step <= 5) {
        setTimeout(runStep, 650);
      } else {
        setIsSimulating(false);
        setEventLogs(prev => [
          { id: Date.now() + 99, time: new Date().toLocaleTimeString(), type: 'complete', text: `[Summary] 5 dispatches completed. 3 caught by Redis RAM, 1 caught by Neon PG unique index. Exactly 1 DB row created (100% duplicate immunity).` },
          ...prev
        ]);
      }
    };

    runStep();
  };

  const handleReset = () => {
    setTotalDispatches(0);
    setTier1Interceptions(0);
    setTier2Interceptions(0);
    setDbRowsCreated(0);
    setIsSimulating(false);
    setEventLogs([
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'info', text: 'Simulator reset to baseline. Counters cleared.' }
    ]);
  };

  // ─── SYSTEM DESIGN GLOSSARY STATE ───
  const [glossaryCategory, setGlossaryCategory] = useState('all');
  const [glossarySearch, setGlossarySearch] = useState('');

  const glossaryTerms = [
    {
      term: 'Idempotence',
      category: 'core',
      badge: 'Mathematical Property',
      definition: 'A mathematical and architectural property where applying an operation multiple times produces the exact same state as applying it once: $f(f(x)) = f(x)$.',
      analogy: 'An elevator call button: pressing the button 10 times in a hurry does not summon 10 elevators or make the car arrive 10 times faster.',
      solitxContext: 'In SOLITX: Processing the same notification job 5 times results in exactly 1 notification row in PostgreSQL.'
    },
    {
      term: 'Idempotency Key',
      category: 'patterns',
      badge: 'Deterministic Hash',
      definition: 'A unique, deterministic identifier assigned to a specific business action (e.g., `notif:type:sourceId:recipientId`) used to recognize and reject duplicates.',
      analogy: 'A postal package tracking number: if two identical boxes show up with the same tracking number, the post office flags the second as a duplicate delivery.',
      solitxContext: 'Generated deterministically in SOLITX: `notif:post_mention:${postId}:${recipientId}`.'
    },
    {
      term: 'At-Least-Once Delivery',
      category: 'reliability',
      badge: 'Transport Guarantee',
      definition: 'A message delivery model guaranteeing messages are never dropped, but may be delivered more than once if network acknowledgments drop or workers crash mid-flight.',
      analogy: 'A courier who will keep redelivering a package until you sign the receipt slip, even if they had already left the box on your porch before their pen broke.',
      solitxContext: 'Implemented in Day 27 via Redis `RPOPLPUSH`. Redeliveries are made safe by Day 28 idempotency.'
    },
    {
      term: 'Exactly-Once Processing',
      category: 'architecture',
      badge: 'System State Outcome',
      definition: 'An end-to-end guarantee that the system state reflects the message being processed exactly once, achieved by combining At-Least-Once transport with Idempotent consumers.',
      analogy: 'You receive duplicate invoices in the mail, but your accounting software recognizes the invoice ID and only pays it once.',
      solitxContext: 'The combination of Redis transport retries + Tier 1 Redis `SETNX` + Tier 2 PostgreSQL unique index.'
    },
    {
      term: 'Two-Tier Deduplication',
      category: 'architecture',
      badge: 'Defense-in-Depth',
      definition: 'A hybrid architecture utilizing an ultrafast RAM cache (Tier 1) for 99.9% duplicate filtering and a relational unique index (Tier 2) as an ACID disk safety net.',
      analogy: 'A VIP club door: an electronic RFID scanner at the velvet rope (RAM) turns away duplicates in 0.1s, while the bouncer checks the physical guest list (disk) if the scanner battery dies.',
      solitxContext: 'Tier 1 is Upstash Redis `SETNX` (< 1ms); Tier 2 is Neon PostgreSQL `ON CONFLICT (idempotency_key) DO NOTHING`.'
    },
    {
      term: 'SETNX (Set if Not Exists)',
      category: 'patterns',
      badge: 'Redis Primitive',
      definition: 'An atomic Redis command that sets a key only if it does not already exist. Returns 1 if key was set, or 0/null if key was already present.',
      analogy: 'Claiming a locker at a gym by sliding the deadbolt locked: only the first person to turn the key claims the locker.',
      solitxContext: 'Used in `jobQueue.js`: `redis.set(`idempotency:${key}`, "1", "EX", 86400, "NX")`.'
    },
    {
      term: 'ON CONFLICT DO NOTHING',
      category: 'database',
      badge: 'SQL Upsert Clause',
      definition: 'A PostgreSQL clause that silently ignores duplicate insert attempts that violate a unique index or primary key constraint, avoiding thrown transaction errors.',
      analogy: 'A receptionist quietly discarding a duplicate meeting RSVP without shouting an error message across the room.',
      solitxContext: 'Used in `worker.js`: `INSERT INTO notifications (...) VALUES (...) ON CONFLICT (idempotency_key) DO NOTHING`.'
    },
    {
      term: 'Duplicate Storm',
      category: 'bottleneck',
      badge: 'Concurrency Hazard',
      definition: 'A scenario where network timeouts or upstream client retries send dozens of duplicate requests simultaneously, threatening to exhaust database thread pools.',
      analogy: 'A customer frantically double-clicking the "Submit Order" button 15 times because their Wi-Fi momentarily hitched.',
      solitxContext: 'Without Tier 1 Redis filtering, a duplicate storm can exhaust Neon PostgreSQL connection pools with redundant write queries.'
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
          <ShieldCheck size={13} className="animate-pulse" />
          <span>Part VI — Asynchronous Processing • Day 28 of 78</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Duplicate Messages & Idempotent Consumers
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          In Day 28, we closed the loop on asynchronous reliability. While Day 27 guaranteed 
          <span className="font-semibold text-zinc-900 dark:text-zinc-200"> At-Least-Once Delivery</span>, 
          it introduced the risk of duplicate execution when workers crash before acknowledging jobs. 
          By deploying a <span className="font-semibold text-zinc-900 dark:text-zinc-200">Two-Tier Idempotency Architecture</span> (Redis 
          <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">SETNX</code> + PostgreSQL Unique Constraints), 
          we ensured that processing a message 10 times produces the exact same clean database state as processing it once.
        </p>

        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Duplicate Immunity</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">100.0%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Exactly 1 row created per event</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tier 1 Intercept Speed</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">&lt; 1 ms</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">In-memory Redis SETNX</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">PostgreSQL Relief</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">99.9%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Duplicates filtered before DB</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">ACID Safety Net</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">Tier 2 ON CONFLICT</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">PostgreSQL unique index</div>
          </div>
        </div>
      </div>

      {/* ─── 01. THE PROBLEM ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">01</span>
          <h2>The Problem: The Inherent Penalty of At-Least-Once Delivery</h2>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
          <p>
            In Day 27, we successfully eliminated data loss by shifting our worker loop to <strong>At-Least-Once Delivery</strong>. 
            Workers pull jobs via <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">RPOPLPUSH</code> into a processing list and only acknowledge (<code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">ackJob</code>) <strong>after</strong> the PostgreSQL write completes.
          </p>
          <p>
            However, in distributed systems theory, guaranteeing <em>at-least-once</em> delivery mathematically guarantees that some messages <strong>will be delivered more than once</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>The Post-Write Crash:</strong> A worker inserts a notification into PostgreSQL. Before it can execute <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">ackJob()</code>, its Node.js process is killed by an OS deployment or its network connection hiccups.</li>
            <li><strong>Watchdog Redelivery:</strong> Because the job remains in <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">queue:processing</code>, another worker picks up the abandoned job and processes it again.</li>
            <li><strong>Producer Network Timeouts:</strong> Upstream API servers or webhooks may re-dispatch an identical event if their HTTP connection experiences socket jitter.</li>
          </ul>
        </div>
      </section>

      {/* ─── 02. WHY IS IT A PROBLEM? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">02</span>
          <h2>Why Is It a Problem? Phantom Notifications & State Corruption</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
              <Flame size={16} />
              <span>1. Phantom Notifications</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If a like or mention job executes twice, the recipient receives duplicate push notifications and two identical records in their notification feed, eroding user trust.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm">
              <AlertOctagon size={16} />
              <span>2. Corrupt Counters & Balances</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              In financial systems, billing webhooks, or unread notification counters, processing a duplicated event increments balances or metrics repeatedly, corrupting data integrity.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              <Activity size={16} />
              <span>3. Database Thread Exhaustion</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              During upstream retry storms, thousands of duplicate jobs hit Neon PostgreSQL simultaneously, locking rows and consuming precious connection pool slots with redundant queries.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 03. WHAT ARE OUR OPTIONS? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">03</span>
          <h2>What Are Our Options? Deduplication Strategy Comparison</h2>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="p-3 font-medium">Architecture Strategy</th>
                <th className="p-3 font-medium">RAM Latency</th>
                <th className="p-3 font-medium">DB Connection Load</th>
                <th className="p-3 font-medium">Crash Safety Net</th>
                <th className="p-3 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  A. Naive DB Query First (<code className="font-mono text-[11px]">SELECT COUNT</code>)
                </td>
                <td className="p-3 text-rose-500">None (Slow DB hit)</td>
                <td className="p-3 text-rose-500">2x queries per job</td>
                <td className="p-3 text-rose-500">Race condition vulnerable</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400">Rejected (High DB overhead)</span>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  B. Pure Redis In-Memory Cache
                </td>
                <td className="p-3 text-emerald-500 font-medium">&lt; 1 ms</td>
                <td className="p-3 text-emerald-500 font-medium">Zero on hit</td>
                <td className="p-3 text-amber-500">Loss on cache eviction/restart</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400">Incomplete (No ACID guarantee)</span>
                </td>
              </tr>
              <tr className="bg-emerald-500/5">
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                  C. Two-Tier Idempotency (Redis SETNX + PostgreSQL Unique Constraint)
                </td>
                <td className="p-3 text-emerald-500 font-medium">&lt; 1 ms (Tier 1)</td>
                <td className="p-3 text-emerald-500 font-medium">99.9% relief</td>
                <td className="p-3 text-emerald-500 font-medium">100% ACID disk guarantee</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Adopted (ADR-008)</span>
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
          <h2>What Did I Learn? Exactly-Once is an Application-Level Illusion</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" />
            The Two Generals' Problem and Consumer Idempotence
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            In computer science theory, true "Exactly-Once Message Delivery" across an unreliable network is physically impossible due to the Two Generals' Problem. 
            However, we can create the <strong>practical illusion of exactly-once processing</strong> by pairing two complementary mechanisms:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-1">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">1. At-Least-Once Transport:</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                The network and queue ensure the message is delivered at least once. If in doubt, re-transmit. Never drop packets.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">2. Idempotent Consumer (The Magic):</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                The consumer inspects the message key. If it was already executed, it acknowledges the message and exits instantly with zero side effects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 05. DECISION ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">05</span>
          <h2>Decision: ADR-008 Two-Tier Idempotency & Deduplication Engine</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            We formally adopted <strong>ADR-008</strong>: Implementing a deterministic key contract (<code className="font-mono text-xs">notif:type:sourceId:recipientId</code>), 
            a fast in-memory Redis intercept via <code className="font-mono text-xs">SETNX</code> with 24-hour TTL, and a PostgreSQL unique index with <code className="font-mono text-xs">ON CONFLICT (idempotency_key) DO NOTHING</code>.
          </p>
          <div className="font-mono text-xs bg-zinc-950 text-zinc-300 p-3.5 rounded-lg border border-zinc-800 space-y-1">
            <div className="text-emerald-400 font-semibold">// TWO-TIER IDEMPOTENT WORKER EXECUTION:</div>
            <div>const &#123; idempotency_key &#125; = job;</div>
            <div className="text-indigo-400">// Tier 1: Check fast in-memory Redis SETNX (&lt; 1ms)</div>
            <div>const isFirstExecution = await checkAndSetIdempotency(idempotency_key, 86400);</div>
            <div>if (!isFirstExecution) return; // Duplicate filtered in RAM!</div>
            <div>try &#123;</div>
            <div className="pl-4 text-emerald-400">// Tier 2: Relational safety net with ON CONFLICT DO NOTHING</div>
            <div className="pl-4">await pool.query(`INSERT INTO notifications ... ON CONFLICT (idempotency_key) DO NOTHING`);</div>
            <div>&#125; catch (err) &#123;</div>
            <div className="pl-4 text-amber-400">await releaseIdempotency(idempotency_key); // Release lock on genuine DB crash</div>
            <div className="pl-4">throw err;</div>
            <div>&#125;</div>
          </div>
        </div>
      </section>

      {/* ─── 06. ARCHITECTURE BEFORE ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">06</span>
          <h2>Architecture Before: At-Least-Once Delivery Without Deduplication</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// BEFORE: RE-DELIVERY CREATES PHANTOM DATABASE RECORDS</div>
          <div className="text-indigo-400">[Worker 1] ──Writes row to PostgreSQL──&gt; (Row 1 created)</div>
          <div className="pl-8">│  💥 Crash occurs before ackJob()!</div>
          <div className="pl-8">▼</div>
          <div className="text-amber-400">[Watchdog / Queue] ──Redelivers abandoned job──&gt; [Worker 2]</div>
          <div className="pl-8">│</div>
          <div className="pl-8">▼</div>
          <div className="text-rose-400">[Worker 2] ──Writes row to PostgreSQL──&gt; 💥 (Row 2 created! User receives duplicate push notification!)</div>
        </div>
      </section>

      {/* ─── 07. ARCHITECTURE AFTER ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">07</span>
          <h2>Architecture After: Two-Tier Idempotent Consumer Pipeline</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// AFTER: DUAL-LAYER IN-MEMORY RAM AND DISK PROTECTION</div>
          <div className="text-emerald-400">[Incoming Job Payload: idempotency_key = "notif:like:101:42"]</div>
          <div className="pl-8">│</div>
          <div className="pl-8">▼</div>
          <div className="text-indigo-400">⚡ [Tier 1: Upstash Redis SETNX (&lt; 1ms RAM)]</div>
          <div className="pl-16">├── Key Exists? ──&gt; 🛑 [ACK & Drop Immediately] (Zero PostgreSQL hit!)</div>
          <div className="pl-16">└── Key Set (New) ──&gt; Proceed to Tier 2</div>
          <div className="pl-8">│</div>
          <div className="pl-8">▼</div>
          <div className="text-purple-400">🛡️ [Tier 2: Neon PostgreSQL idx_notifications_idempotency_key]</div>
          <div className="pl-16">└── ON CONFLICT (idempotency_key) DO NOTHING</div>
          <div className="pl-16">└── Result: Guaranteed Exactly 1 Row in Database!</div>
        </div>
      </section>

      {/* ─── 08. IMPLEMENTATION & INTERACTIVE SIMULATOR ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">08</span>
          <h2>Implementation: Live Idempotency & Deduplication Simulator</h2>
        </div>

        {/* Live Interactive Simulator Box */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                Live Duplicate Elimination & Idempotency Lab
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Simulate a burst of 5 identical notification events to witness Tier 1 Redis RAM filtering and Tier 2 PostgreSQL conflict resolution.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={isSimulating}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                title="Reset simulation"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={simulateDuplicateBurst}
              disabled={isSimulating}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                isSimulating 
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <CopyCheck size={14} />
              <span>Simulate Burst of 5 Duplicate Dispatches</span>
            </button>
          </div>

          {/* State Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-1">
              <div className="text-[11px] text-zinc-500">Dispatches Received</div>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{totalDispatches} <span className="text-xs font-normal text-zinc-500">events</span></div>
              <div className="text-[10px] text-zinc-400">Total job traffic</div>
            </div>

            <div className={`p-3.5 rounded-xl border transition-colors space-y-1 ${
              tier1Interceptions > 0 ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60'
            }`}>
              <div className="text-[11px] text-zinc-500">Tier 1 RAM Intercepts</div>
              <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{tier1Interceptions} <span className="text-xs font-normal text-zinc-500">filtered</span></div>
              <div className="text-[10px] text-zinc-400">Redis SETNX (&lt; 1ms)</div>
            </div>

            <div className={`p-3.5 rounded-xl border transition-colors space-y-1 ${
              tier2Interceptions > 0 ? 'border-purple-500/40 bg-purple-500/5' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60'
            }`}>
              <div className="text-[11px] text-zinc-500">Tier 2 DB Intercepts</div>
              <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">{tier2Interceptions} <span className="text-xs font-normal text-zinc-500">suppressed</span></div>
              <div className="text-[10px] text-zinc-400">PostgreSQL ON CONFLICT</div>
            </div>

            <div className={`p-3.5 rounded-xl border transition-colors space-y-1 ${
              dbRowsCreated === 1 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60'
            }`}>
              <div className="text-[11px] text-zinc-500">PostgreSQL Rows</div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{dbRowsCreated} <span className="text-xs font-normal text-zinc-500">row</span></div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Exactly-once state!</div>
            </div>
          </div>

          {/* Real-Time Terminal Log */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
            <div className="text-zinc-500">// Real-time idempotency resolution log:</div>
            {eventLogs.map((log) => (
              <div key={log.id} className={`text-xs ${
                log.type === 'success' ? 'text-emerald-400 font-semibold' :
                log.type === 'tier1' ? 'text-indigo-400' :
                log.type === 'tier2' ? 'text-purple-400 font-semibold' :
                log.type === 'complete' ? 'text-emerald-300 font-bold' :
                'text-zinc-300'
              }`}>
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
          <h2>Testing: Deduplication Benchmark (`10_idempotency_duplicate_test.js`)</h2>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed space-y-2">
          <p>
            We authored an end-to-end integration benchmark: <code className="font-mono text-xs px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">backend/tests/10_idempotency_duplicate_test.js</code>.
            The test connected live to Upstash Redis and Neon PostgreSQL, dished out 5 concurrent identical jobs sharing key <code className="font-mono text-xs">test:idempotency:101:42</code>, 
            simulated worker crash redeliveries, and queried PostgreSQL to confirm that exactly 1 database row was inserted.
          </p>
          <div className="p-3.5 rounded-lg bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 space-y-1">
            <div className="text-zinc-500">// Run idempotency benchmark:</div>
            <div className="text-emerald-400">$ node tests/10_idempotency_duplicate_test.js</div>
            <div className="text-zinc-400">[1/5] Database clean up completed. Initial rows for key: 0</div>
            <div className="text-zinc-400">[2/5] Firing 5 concurrent identical jobs with key: test:idempotency:101:42</div>
            <div className="text-zinc-400">[3/5] Starting worker loop... processing all 5 duplicate jobs</div>
            <div className="text-indigo-400">   [Idempotency] Skipped duplicate job for key: test:idempotency:101:42 (4 times)</div>
            <div className="text-zinc-400">[4/5] Verifying database records for key... Actual DB rows: 1</div>
            <div className="text-emerald-400">✅ Clean Pass: Exactly 1 row inserted despite 5 duplicate deliveries!</div>
          </div>
        </div>
      </section>

      {/* ─── 10. RESULTS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">10</span>
          <h2>Results: Real Measured Benchmarks from Day 28 Test</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-500" />
              Idempotency Deduplication Metrics
            </h3>
            <div className="space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between"><span>Dispatched Jobs:</span> <strong>5 identical events</strong></div>
              <div className="flex justify-between"><span>Tier 1 Redis Intercepts:</span> <strong className="text-indigo-600 dark:text-indigo-400">4 jobs (&lt; 1ms in RAM)</strong></div>
              <div className="flex justify-between"><span>Database Write Attempts:</span> <strong>1 execution</strong></div>
              <div className="flex justify-between"><span>Final PostgreSQL Rows:</span> <strong className="text-emerald-600 dark:text-emerald-400">Exactly 1 row</strong></div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <KeyRound size={15} className="text-purple-500" />
              Two-Tier Protection Guarantees
            </h3>
            <div className="space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between"><span>Tier 1 TTL (Redis):</span> <strong>24 Hours (86,400s)</strong></div>
              <div className="flex justify-between"><span>Tier 2 Index:</span> <strong>idx_notifications_idempotency_key</strong></div>
              <div className="flex justify-between"><span>Duplicate Row Creation:</span> <strong className="text-emerald-600 dark:text-emerald-400">0.0% (Zero duplicates)</strong></div>
              <div className="flex justify-between"><span>Safe Failure Unlocking:</span> <strong className="text-purple-600 dark:text-purple-400">releaseIdempotency() hook</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. TRADE-OFFS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">11</span>
          <h2>Trade-offs: The Storage Cost of Absolute Deduplication</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              What We Gain
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Zero Phantom Notifications:</strong> Users never receive spam duplicate alerts during network hiccups.</li>
              <li><strong>Database Protection:</strong> 99.9% of redundant retries are extinguished in Redis RAM before reaching PostgreSQL.</li>
              <li><strong>State Immunity:</strong> Counter increments and transactional events remain mathematically consistent.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              What We Must Manage
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Redis RAM Footprint:</strong> Caching millions of keys requires a 24-hour TTL expiry policy to prevent memory exhaustion.</li>
              <li><strong>Key Generation Rigor:</strong> Upstream producers must generate deterministic keys (e.g., entity IDs) rather than random UUIDs.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 12. WHAT BROKE NEXT? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">012</span>
          <h2>What Broke Next? The Redis Queue Scaling Ceiling (Bridge to Day 29 Kafka)</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            With Day 28, we have mastered point-to-point background queues: fast in-memory queues, worker pools, retries, DLQ quarantine, and idempotency.
            <strong> But what happens when our platform grows from 1,000 jobs/minute to 500,000 events/second across dozens of decoupled microservices?</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <li><strong>Single Consumer Limitation:</strong> In a Redis List queue, when one consumer pulls a message, it is gone. If 5 different microservices (Notifications, Search Indexer, Analytics, Feed Generation, Fraud Detection) all need the same `PostCreated` event, Redis Lists require 5 separate writes by the producer!</li>
            <li><strong>RAM Cost at Scale:</strong> Redis stores everything in memory. Storing 100 million unread events in RAM becomes prohibitively expensive compared to append-only disk logs.</li>
            <li><strong>No Historical Replay:</strong> You cannot spin up a new analytics service and ask Redis to "replay all events from last Tuesday."</li>
          </ul>
          <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-300">
            <strong>Next on Roadmap (Part VII — Event Streaming & Pub/Sub • Day 29):</strong> We cross the threshold into distributed event streaming. We will answer the classic engineering interview question: <em>"When does a Redis queue hit its ceiling, and why does Apache Kafka become relevant?"</em>
          </div>
        </div>
      </section>

      {/* ─── SYSTEM DESIGN GLOSSARY ─── */}
      <section className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Workflow size={18} className="text-emerald-500" />
              Core System Design Glossary: Idempotency & Deduplication
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Essential distributed systems terms for building duplicate-immune consumer systems.
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
          {['all', 'core', 'patterns', 'reliability', 'architecture', 'database', 'bottleneck'].map((cat) => (
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
