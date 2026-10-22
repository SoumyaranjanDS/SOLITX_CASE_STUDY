import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
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
  Sliders, 
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
  LifeBuoy
} from 'lucide-react';

export default function Day27WorkerFailureRecovery() {
  // ─── INTERACTIVE FAULT INJECTION SIMULATOR STATE ───
  const [mainQueueCount, setMainQueueCount] = useState(3);
  const [inFlightCount, setInFlightCount] = useState(0);
  const [dlqCount, setDlqCount] = useState(0);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventLogs, setEventLogs] = useState([
    { id: 1, time: '22:38:00', type: 'info', text: 'Queue system initialized. 3 healthy jobs pending.' }
  ]);

  // Simulate Transient Database Lock (Retries with Exponential Backoff)
  const simulateTransientFailure = () => {
    if (isSimulating || mainQueueCount === 0) return;
    setIsSimulating(true);

    const logs = [];
    const newAttempts = currentAttempts + 1;
    setCurrentAttempts(newAttempts);

    // Step 1: Dequeue to in-flight
    setMainQueueCount(prev => Math.max(0, prev - 1));
    setInFlightCount(1);
    logs.push({ 
      id: Date.now() + 1, 
      time: new Date().toLocaleTimeString(), 
      type: 'process',
      text: `[Worker] Dequeued job via RPOPLPUSH. In-flight processing locked.` 
    });
    setEventLogs(prev => [logs[0], ...prev]);

    setTimeout(() => {
      // Step 2: Database timeout error
      logs.push({ 
        id: Date.now() + 2, 
        time: new Date().toLocaleTimeString(), 
        type: 'error',
        text: `[Database] ❌ Transient Neon DB lock timeout encountered! (Attempt ${newAttempts}/3)` 
      });
      setEventLogs(prev => [logs[0], ...prev]);

      // Step 3: Calculate backoff delay
      const backoffDelay = Math.pow(2, newAttempts) * 1000;
      setTimeout(() => {
        setInFlightCount(0);
        setMainQueueCount(prev => prev + 1);
        setEventLogs(prev => [
          { 
            id: Date.now() + 3, 
            time: new Date().toLocaleTimeString(), 
            type: 'retry',
            text: `[Worker] 🔄 Re-enqueued job with exponential backoff delay of ${backoffDelay}ms (2^${newAttempts}s).` 
          },
          ...prev
        ]);
        setIsSimulating(false);
      }, 700);
    }, 800);
  };

  // Simulate Poison Pill (Fails 3x consecutively -> Quarantined to DLQ)
  const simulatePoisonPill = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    setEventLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'error', text: `[Simulation] Injecting unrecoverable poison pill (Permanent Constraint Error)...` },
      ...prev
    ]);

    let attempt = 1;
    const runAttempt = () => {
      setInFlightCount(1);
      setTimeout(() => {
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000;
          setEventLogs(prev => [
            { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'error', text: `[Worker] Attempt ${attempt}/3 failed. Backing off ${delay}ms...` },
            ...prev
          ]);
          attempt++;
          setTimeout(runAttempt, 800);
        } else {
          // Final attempt exceeded -> DLQ
          setInFlightCount(0);
          setDlqCount(prev => prev + 1);
          setCurrentAttempts(0);
          setEventLogs(prev => [
            { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'dlq', text: `[Worker] ⚠️ Max retries (3/3) exceeded! Quarantined poison pill to DEAD-LETTER QUEUE (queue:notifications:dead_letter).` },
            ...prev
          ]);
          setIsSimulating(false);
        }
      }, 600);
    };

    runAttempt();
  };

  // Replay DLQ
  const handleReplayDLQ = () => {
    if (dlqCount === 0 || isSimulating) return;
    setMainQueueCount(prev => prev + dlqCount);
    setEventLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'info', text: `[Admin Tool] Replayed ${dlqCount} job(s) from Dead-Letter Queue back to main queue for re-processing.` },
      ...prev
    ]);
    setDlqCount(0);
    setCurrentAttempts(0);
  };

  const handleReset = () => {
    setMainQueueCount(3);
    setInFlightCount(0);
    setDlqCount(0);
    setCurrentAttempts(0);
    setIsSimulating(false);
    setEventLogs([
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'info', text: 'Queue state reset to baseline (3 pending jobs).' }
    ]);
  };

  // ─── SYSTEM DESIGN GLOSSARY STATE ───
  const [glossaryCategory, setGlossaryCategory] = useState('all');
  const [glossarySearch, setGlossarySearch] = useState('');

  const glossaryTerms = [
    {
      term: 'At-Least-Once Delivery',
      category: 'reliability',
      badge: 'Core Guarantee',
      definition: 'A messaging guarantee ensuring every message is delivered and processed one or more times. Messages are never lost, but may be duplicated upon worker crash recovery.',
      analogy: 'A registered mail delivery where the postal worker requires a signature: if they crash their bike before submitting the signature card, the package is re-delivered.',
      solitxContext: 'In SOLITX: The worker moves jobs to `queue:processing` and only removes them after PostgreSQL confirms the write.'
    },
    {
      term: 'Acknowledgment (ACK)',
      category: 'patterns',
      badge: 'Signal Primitive',
      definition: 'An explicit confirmation sent from consumer to broker indicating that a message was processed successfully and can now be safely deleted.',
      analogy: 'Saying "Roger that, message received" over a military radio before the sender stops transmitting.',
      solitxContext: 'In `worker.js`: `await ackJob(queueName, raw)` deletes the in-flight job from Redis after `pool.query()` succeeds.'
    },
    {
      term: 'Poison Pill Payload',
      category: 'bottleneck',
      badge: 'Failure Mode',
      definition: 'A malformed or corrupted message that causes consumer processes to crash or fail every single time it is processed.',
      analogy: 'A bad ingredient in an automated food assembly line that jams the conveyor belt every time it arrives.',
      solitxContext: 'A notification payload referencing a deleted foreign key. Without a DLQ, the worker would crash and retry it infinitely.'
    },
    {
      term: 'Dead-Letter Queue (DLQ)',
      category: 'architecture',
      badge: 'Quarantine Buffer',
      definition: 'A designated secondary queue where unprocessable or repeatedly failed messages are quarantined so they do not block healthy messages behind them.',
      analogy: 'The "Undeliverable Mail / Dead Letter Office" where damaged letters with unreadable addresses are stored for manual inspection.',
      solitxContext: 'In SOLITX: After 3 failed attempts, jobs are moved to `queue:notifications:dead_letter` for engineer inspection.'
    },
    {
      term: 'Exponential Backoff',
      category: 'reliability',
      badge: 'Retry Algorithm',
      definition: 'An algorithm that doubles the wait time between each successive retry attempt to allow downstream systems time to recover from temporary contention.',
      analogy: 'Knocking on a closed bathroom door: you knock, wait 10 seconds, then wait 30 seconds, then wait 2 minutes rather than hammering continuously.',
      solitxContext: 'In SOLITX: Delay scales as $2^{\\text{attempts}} \\times 1,000\\text{ms}$ (Attempt 1 = 2s, Attempt 2 = 4s, Attempt 3 = 8s).'
    },
    {
      term: 'Head-of-Line (HoL) Blocking',
      category: 'bottleneck',
      badge: 'Queue Hazard',
      definition: 'A scenario where one failing message at the front of a FIFO queue blocks all subsequent valid messages from being processed.',
      analogy: 'One car with a broken engine stalling at the entrance of a one-lane highway tunnel, trapping 500 cars behind it.',
      solitxContext: 'Quarantining failed messages to the DLQ prevents a single bad notification from stalling millions of user notifications.'
    },
    {
      term: 'Transient vs. Permanent Faults',
      category: 'reliability',
      badge: 'Failure Triage',
      definition: 'Transient faults (database lock, network glitch) resolve automatically after a delay; Permanent faults (schema violation, invalid JSON) will never succeed.',
      analogy: 'Transient: Busy signal on a phone call. Permanent: The number has been disconnected.',
      solitxContext: 'Transient locks are healed by Exponential Backoff; Permanent schema errors are captured by the Dead-Letter Queue.'
    },
    {
      term: 'DLQ Replayability',
      category: 'operations',
      badge: 'Admin Tooling',
      definition: 'The capability to re-enqueue quarantined messages from a Dead-Letter Queue back into the active processing queue after bugs are patched.',
      analogy: 'Re-feeding failed paper invoices into an optical scanner after updating the barcode recognition software.',
      solitxContext: 'In SOLITX: `replayDeadLetter("notifications", 10)` moves quarantined jobs back to the active queue with 1 command.'
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <LifeBuoy size={13} className="animate-pulse" />
          <span>Part VI — Asynchronous Processing • Day 27 of 78</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Failure in Background Jobs: Retries & Dead-Letter Queues
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          In Day 27, we engineered fault tolerance for our asynchronous workers. 
          By combining <span className="font-semibold text-zinc-900 dark:text-zinc-200">atomic in-flight tracking (RPOPLPUSH)</span>, 
          <span className="font-semibold text-zinc-900 dark:text-zinc-200"> Exponential Backoff retries</span>, and 
          <span className="font-semibold text-zinc-900 dark:text-zinc-200"> Dead-Letter Queue (DLQ) quarantine</span>, 
          we ensured that worker crashes and database timeouts never cause message loss or queue head-of-line blocking.
        </p>

        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Crash Data Loss</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">0.0%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">In-flight tracking in Redis</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Backoff Scaling</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">2s → 4s → 8s</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Exponential delay (2^n)</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Queue Blocking</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Zero HoL</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">DLQ isolates poison pills</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">DLQ Replayability</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">100.0%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Admin tooling restores jobs</div>
          </div>
        </div>
      </div>

      {/* ─── 01. THE PROBLEM ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">01</span>
          <h2>The Problem: When Background Workers Crash Mid-Flight</h2>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
          <p>
            In Day 25 and 26, our background workers used a simple <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">BRPOP</code> loop. 
            The moment a worker pulled a job, <strong>Redis removed it from the queue immediately</strong>.
          </p>
          <p>
            This created a critical architectural vulnerability:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Worker Crash:</strong> If the worker process ran out of memory, was terminated by an OS deployment, or crashed due to an unhandled exception before saving to PostgreSQL, <strong>that notification was permanently lost</strong>.</li>
            <li><strong>Transient Database Locks:</strong> If Neon PostgreSQL threw a temporary 200ms lock timeout, the job threw an error and disappeared into the void.</li>
            <li><strong>Poison Pills:</strong> If a job had invalid data, it would fail, but without a quarantine mechanism, it could cause worker crash loops.</li>
          </ul>
        </div>
      </section>

      {/* ─── 02. WHY IS IT A PROBLEM? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">02</span>
          <h2>Why Is It a Problem? Silent Data Loss vs. Infinite Crash Loops</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
              <Flame size={16} />
              <span>1. Silent Message Loss</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When a job is popped destructively, any failure mid-execution results in unrecoverable data loss. Users never receive notifications, and engineers have zero record of the failure.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm">
              <AlertOctagon size={16} />
              <span>2. Head-of-Line Blocking</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If you naively re-enqueue a failing poison pill immediately to the front of the queue, the worker fails it again instantly, burning 100% CPU and blocking thousands of valid jobs behind it.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              <Activity size={16} />
              <span>3. Thundering Retry Storms</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Retrying failed jobs with zero delay hammers a struggling database. If PostgreSQL is already locked, immediate retries make the lock contention worse.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 03. WHAT ARE OUR OPTIONS? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">03</span>
          <h2>What Are Our Options? Error Handling Pattern Comparison</h2>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="p-3 font-medium">Failure Strategy</th>
                <th className="p-3 font-medium">Crash Safety</th>
                <th className="p-3 font-medium">DB Lock Handling</th>
                <th className="p-3 font-medium">Poison Pill Isolation</th>
                <th className="p-3 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  A. Pop & Forget (Catch & Log)
                </td>
                <td className="p-3 text-rose-500">Zero (Permanent Loss)</td>
                <td className="p-3 text-rose-500">Drops job immediately</td>
                <td className="p-3">None</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400">Rejected (Unsafe)</span>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  B. Infinite Immediate Retry
                </td>
                <td className="p-3 text-amber-500">Partial</td>
                <td className="p-3 text-rose-500">Exhausts DB connections</td>
                <td className="p-3 text-rose-500">Crashes queue (HoL Blocking)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400">Rejected (Dangerous)</span>
                </td>
              </tr>
              <tr className="bg-emerald-500/5">
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                  C. In-Flight Tracking + Exponential Backoff + DLQ
                </td>
                <td className="p-3 text-emerald-500 font-medium">100% (At-Least-Once)</td>
                <td className="p-3 text-emerald-500 font-medium">Smooth backoff (2s → 4s → 8s)</td>
                <td className="p-3 text-emerald-500 font-medium">Quarantined to DLQ</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Adopted (ADR-007)</span>
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
          <h2>What Did I Learn? Failure Classification & The Three Primitives</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-rose-500" />
            Distinguishing Between Transient and Permanent Faults
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Not all errors are created equal. The key to resilient queue design is treating errors based on their recoverability:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-1">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">1. Transient Faults (Temporary):</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Network blips, database connection spikes, row lock waits. <strong>Solution:</strong> Exponential Backoff retries give the system time to breathe.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20 space-y-1">
              <span className="font-semibold text-rose-600 dark:text-rose-400">2. Permanent Faults (Poison Pills):</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Invalid JSON, deleted foreign keys, schema mismatches. Retrying will fail forever. <strong>Solution:</strong> Dead-Letter Queue quarantine preserves the message for engineer inspection without stalling other users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 05. DECISION ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">05</span>
          <h2>Decision: ADR-007 Worker Resilience, Retries, and DLQ Architecture</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            We formally adopted <strong>ADR-007</strong>: Implementing an atomic in-flight processing set (<code className="font-mono text-xs">queue:notifications:processing</code>), 
            3-attempt Exponential Backoff (<code className="font-mono text-xs">2^n * 1000ms</code>), and a Dead-Letter Queue (<code className="font-mono text-xs">queue:notifications:dead_letter</code>) with admin replay capabilities.
          </p>
          <div className="font-mono text-xs bg-zinc-950 text-zinc-300 p-3.5 rounded-lg border border-zinc-800 space-y-1">
            <div className="text-rose-400 font-semibold">// RESILIENT WORKER LIFECYCLE:</div>
            <div>const item = await dequeueReliable(queueName); // Atomic RPOPLPUSH</div>
            <div>try &#123;</div>
            <div className="pl-4">await handler(item.job);</div>
            <div className="pl-4 text-emerald-400">await ackJob(queueName, item.raw); // Success: Delete from in-flight</div>
            <div>&#125; catch (err) &#123;</div>
            <div className="pl-4 text-amber-400">await handleJobFailure(queueName, item.job, item.raw, err); // Retries or DLQ</div>
            <div>&#125;</div>
          </div>
        </div>
      </section>

      {/* ─── 06. ARCHITECTURE BEFORE ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">06</span>
          <h2>Architecture Before: Pop-and-Forget Dequeueing</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// BEFORE: DESTRUCTIVE DEQUEUE WITHOUT AT-LEAST-ONCE GUARANTEE</div>
          <div className="text-amber-400">[Upstash Redis queue:notifications]</div>
          <div className="pl-8">│  BRPOP (Deletes message immediately from Redis!)</div>
          <div className="pl-8">▼</div>
          <div className="text-rose-400">[Worker Process] ──CRASH / DB TIMEOUT!──&gt; 💥 (Job vanished forever!)</div>
        </div>
      </section>

      {/* ─── 07. ARCHITECTURE AFTER ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">07</span>
          <h2>Architecture After: In-Flight Tracking, Backoff & DLQ Quarantine</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// AFTER: AT-LEAST-ONCE DELIVERY WITH EXPONENTIAL BACKOFF & DLQ</div>
          <div className="text-emerald-400">[queue:notifications]</div>
          <div className="pl-8">│  RPOPLPUSH (Atomic transfer)</div>
          <div className="pl-8">▼</div>
          <div className="text-indigo-400">[queue:notifications:processing] (Job preserved in-flight!)</div>
          <div className="pl-8">│</div>
          <div className="pl-8">├──&gt; [PostgreSQL Success] ──&gt; ACK: Delete from processing list</div>
          <div className="pl-8">│</div>
          <div className="pl-8">└──&gt; [PostgreSQL Lock / Failure]</div>
          <div className="pl-16">├──&gt; Attempts &lt; 3: Re-enqueue with Exponential Backoff (2s → 4s)</div>
          <div className="pl-16">└──&gt; Attempts ≥ 3: Move to [queue:notifications:dead_letter] (Quarantine)</div>
        </div>
      </section>

      {/* ─── 08. IMPLEMENTATION & INTERACTIVE SIMULATOR ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">08</span>
          <h2>Implementation: Interactive Dead-Letter Queue & Retry Simulator</h2>
        </div>

        {/* Live Interactive Simulator Box */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <LifeBuoy size={16} className="text-rose-500" />
                Live Fault Injection & Recovery Lab
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Simulate transient database locks and poison-pill payloads to observe in-flight protection, backoff, and DLQ quarantine.
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

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={simulateTransientFailure}
              disabled={isSimulating || mainQueueCount === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                isSimulating 
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              <Activity size={13} />
              <span>Inject Transient DB Lock (Retry Test)</span>
            </button>

            <button
              onClick={simulatePoisonPill}
              disabled={isSimulating}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                isSimulating 
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              <AlertOctagon size={13} />
              <span>Inject Poison Pill (DLQ Quarantine Test)</span>
            </button>

            <button
              onClick={handleReplayDLQ}
              disabled={isSimulating || dlqCount === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                dlqCount === 0 || isSimulating
                  ? 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <RefreshCw size={13} />
              <span>Replay Dead-Letter Queue ({dlqCount})</span>
            </button>
          </div>

          {/* Queue State Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-1">
              <div className="text-[11px] text-zinc-500">Main Pending Queue</div>
              <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{mainQueueCount} <span className="text-xs font-normal text-zinc-500">jobs</span></div>
              <div className="text-[10px] text-zinc-400">queue:notifications</div>
            </div>

            <div className={`p-3.5 rounded-xl border transition-colors space-y-1 ${
              inFlightCount > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60'
            }`}>
              <div className="text-[11px] text-zinc-500">In-Flight (Processing Set)</div>
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{inFlightCount} <span className="text-xs font-normal text-zinc-500">jobs</span></div>
              <div className="text-[10px] text-zinc-400">queue:notifications:processing</div>
            </div>

            <div className={`p-3.5 rounded-xl border transition-colors space-y-1 ${
              dlqCount > 0 ? 'border-rose-500/40 bg-rose-500/5' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60'
            }`}>
              <div className="text-[11px] text-zinc-500">Dead-Letter Queue (DLQ)</div>
              <div className={`text-2xl font-bold font-mono ${dlqCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'}`}>
                {dlqCount} <span className="text-xs font-normal text-zinc-500">jobs</span>
              </div>
              <div className="text-[10px] text-zinc-400">queue:notifications:dead_letter</div>
            </div>
          </div>

          {/* Real-Time Terminal Log */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
            <div className="text-zinc-500">// Real-time worker error and retry log:</div>
            {eventLogs.map((log) => (
              <div key={log.id} className={`text-xs ${
                log.type === 'error' ? 'text-rose-400 font-semibold' :
                log.type === 'retry' ? 'text-amber-400' :
                log.type === 'dlq' ? 'text-purple-400 font-bold' :
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
          <h2>Testing: Fault Recovery Benchmark (`09_queue_failure_recovery_test.js`)</h2>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed space-y-2">
          <p>
            We authored an automated fault recovery benchmark: <code className="font-mono text-xs px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">backend/tests/09_queue_failure_recovery_test.js</code>.
            The test injected simulated database lock timeouts, validated in-flight atomic transfers via <code className="font-mono text-xs">RPOPLPUSH</code>, 
            verified exponential delay progression, and confirmed 100% quarantine and replayability.
          </p>
          <div className="p-3.5 rounded-lg bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 space-y-1">
            <div className="text-zinc-500">// Run failure recovery benchmark:</div>
            <div className="text-emerald-400">$ node tests/09_queue_failure_recovery_test.js</div>
            <div className="text-zinc-400">[2/5] Testing In-Flight Safety: Preserved in processing set (count: 1)</div>
            <div className="text-zinc-400">[3/5] Testing Exponential Backoff: Attempt 1 delay: 2000ms | Attempt 2: 4000ms</div>
            <div className="text-zinc-400">[4/5] Testing DLQ Quarantine: Attempt 3 moved to queue:dead_letter (1 quarantined)</div>
            <div className="text-zinc-400">[5/5] Testing DLQ Replay: Replayed 1 job back to main queue cleanly!</div>
          </div>
        </div>
      </section>

      {/* ─── 10. RESULTS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">10</span>
          <h2>Results: Real Measured Benchmarks from Day 27 Test</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <LifeBuoy size={15} className="text-emerald-500" />
              In-Flight Crash Safety
            </h3>
            <div className="space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between"><span>Crash Data Loss:</span> <strong className="text-emerald-600 dark:text-emerald-400">0.0% (Zero loss)</strong></div>
              <div className="flex justify-between"><span>Transfer Mechanism:</span> <strong>Atomic RPOPLPUSH</strong></div>
              <div className="flex justify-between"><span>ACK Verification:</span> <strong className="text-emerald-600 dark:text-emerald-400">Confirmed on DB write</strong></div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              Backoff & DLQ Quarantine
            </h3>
            <div className="space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between"><span>Attempt 1 Delay:</span> <strong>2,000 ms</strong></div>
              <div className="flex justify-between"><span>Attempt 2 Delay:</span> <strong>4,000 ms</strong></div>
              <div className="flex justify-between"><span>DLQ Quarantine on Attempt 3:</span> <strong className="text-rose-500">100% Isolated</strong></div>
              <div className="flex justify-between"><span>Replay Restoration:</span> <strong className="text-purple-600 dark:text-purple-400">100% Restored</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. TRADE-OFFS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">11</span>
          <h2>Trade-offs: The Mandatory Price of At-Least-Once Delivery</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              What We Gain
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Zero Message Loss:</strong> Worker crashes no longer destroy pending notifications.</li>
              <li><strong>Self-Healing Pipelines:</strong> Transient database deadlocks recover automatically without human intervention.</li>
              <li><strong>Queue Immunity:</strong> Bad payloads are quarantined to DLQ instead of crashing the worker daemon.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              What We Must Manage
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>The Duplicate Message Hazard:</strong> If a worker crashes <em>after</em> writing to PostgreSQL but <em>before</em> sending the ACK, the job will be retried and executed a second time!</li>
              <li><strong>DLQ Monitoring:</strong> Quarantined jobs require periodic review and replay procedures.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 12. WHAT BROKE NEXT? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">12</span>
          <h2>What Broke Next? The Duplicate Message Hazard (Bridge to Day 28)</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            By solving worker crashes with retries, we solved data loss. But in distributed systems, fixing data loss creates a brand new challenge: 
            <strong>If a worker writes the notification to PostgreSQL but the server is killed before it calls <code className="font-mono text-xs">ackJob()</code>, the next worker will pull the job again and insert a duplicate notification!</strong>
          </p>
          <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-300">
            <strong>Next on Roadmap (Day 28 — Duplicate Messages & Idempotency):</strong> We will build **Idempotent Consumers** using unique database constraint indexes and Redis deduplication keys, ensuring that even if a message is retried 10 times, the user receives exactly one notification.
          </div>
        </div>
      </section>

      {/* ─── SYSTEM DESIGN GLOSSARY ─── */}
      <section className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Workflow size={18} className="text-rose-500" />
              Core System Design Glossary: Fault Tolerance & DLQs
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Essential distributed systems terms for building self-healing worker pools.
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
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'reliability', 'architecture', 'patterns', 'bottleneck', 'operations'].map((cat) => (
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
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                {item.definition}
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/60 space-y-1 text-[11px]">
                <div className="text-zinc-500 dark:text-zinc-400 font-medium">Real-World Analogy:</div>
                <div className="text-zinc-600 dark:text-zinc-400 italic">"{item.analogy}"</div>
                <div className="text-rose-600 dark:text-rose-400 font-medium pt-1">SOLITX Application:</div>
                <div className="text-zinc-700 dark:text-zinc-300">{item.solitxContext}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
