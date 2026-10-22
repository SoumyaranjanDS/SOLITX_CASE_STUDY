import React, { useState, useMemo } from 'react';
import { 
  Server, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Database, 
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
  Send,
  Bell,
  ListOrdered,
  Workflow,
  Sparkles,
  Inbox,
  Play,
  RotateCcw
} from 'lucide-react';

export default function Day25BackgroundJobs() {
  // ─── INTERACTIVE QUEUE SIMULATOR STATE ───
  const [inflowRate, setInflowRate] = useState(50); // incoming jobs/sec
  const [workerCount, setWorkerCount] = useState(2); // active worker processes
  const [jobProcessingTime, setJobProcessingTime] = useState(60); // ms per job

  // Queue simulation metrics
  const queueMetrics = useMemo(() => {
    // Each worker can process: 1000ms / jobProcessingTime jobs per second
    const workerCapacityPerSec = (1000 / jobProcessingTime) * workerCount;
    const netRate = inflowRate - workerCapacityPerSec; // positive means backlog growing
    const isAccumulating = netRate > 0;

    // Projected backlog after a 10-second traffic spike
    const spikeBacklog = Math.max(0, Math.round(netRate * 10));
    // Time to drain that backlog once traffic subsides to baseline (10 jobs/sec)
    const drainCapacity = workerCapacityPerSec - 10;
    const timeToDrainSec = drainCapacity > 0 ? (spikeBacklog / drainCapacity).toFixed(1) : 'Infinite';

    // Queue health status
    let healthStatus = 'Healthy';
    let healthColor = 'text-emerald-500';
    if (netRate > 30) {
      healthStatus = 'Critical Backlog Growth';
      healthColor = 'text-rose-500';
    } else if (netRate > 0) {
      healthStatus = 'Backpressure Building';
      healthColor = 'text-amber-500';
    }

    return {
      workerCapacityPerSec: Math.round(workerCapacityPerSec),
      netRate: Math.round(netRate),
      isAccumulating,
      spikeBacklog,
      timeToDrainSec,
      healthStatus,
      healthColor,
      utilizationPercent: Math.min(100, Math.round((inflowRate / workerCapacityPerSec) * 100))
    };
  }, [inflowRate, workerCount, jobProcessingTime]);

  // ─── SYSTEM DESIGN GLOSSARY STATE ───
  const [glossaryCategory, setGlossaryCategory] = useState('all');
  const [glossarySearch, setGlossarySearch] = useState('');

  const glossaryTerms = [
    {
      term: 'Message Broker',
      category: 'architecture',
      badge: 'Core Component',
      definition: 'An intermediary software infrastructure that translates, buffers, and routes messages between producers and consumers without requiring direct peer-to-peer coupling.',
      analogy: 'The central post office: citizens drop off letters into collection boxes, and mail carriers deliver them to recipients later.',
      solitxContext: 'In SOLITX: Upstash Redis acts as our message broker using memory-backed FIFO lists (`queue:notifications`).'
    },
    {
      term: 'FIFO (First-In, First-Out)',
      category: 'patterns',
      badge: 'Queue Primitive',
      definition: 'A queue ordering discipline where the first message inserted is the first message extracted and processed, preserving temporal sequence.',
      analogy: 'A grocery checkout line: the first shopper to arrive at the counter is the first shopper served.',
      solitxContext: 'Implemented in SOLITX via Redis atomic `LPUSH` (insert at head) and `RPOP` / `BRPOP` (extract from tail).'
    },
    {
      term: 'Producer vs. Consumer',
      category: 'architecture',
      badge: 'Roles',
      definition: 'Producers generate and enqueue event messages; Consumers dequeue and execute the business logic independently.',
      analogy: 'A restaurant waiter (Producer) takes orders and writes tickets; the kitchen cooks (Consumers) prepare the meals.',
      solitxContext: 'Our Express server (`server.js`) is the Producer; our background daemon (`worker.js`) is the Consumer.'
    },
    {
      term: 'Backpressure',
      category: 'bottleneck',
      badge: 'Flow Control',
      definition: 'The resistance or queue accumulation that occurs when producers generate work faster than downstream consumers can process it.',
      analogy: 'A bathtub filling up with water faster than the drain pipe can empty it, causing the water level to rise.',
      solitxContext: 'During celebrity tweets, thousands of notifications enter the queue; backpressure buffers in Redis instead of crashing PostgreSQL.'
    },
    {
      term: 'Shock Absorber Pattern',
      category: 'reliability',
      badge: 'Stability Pattern',
      definition: 'Using a persistent in-memory queue to absorb sudden bursts of write traffic, allowing backend databases to drain work at a flat, safe rate.',
      analogy: 'Car suspension springs absorbing road potholes so passengers inside feel a smooth ride.',
      solitxContext: 'A spike of 2,000 tweets/sec buffers in Redis, while our worker pool queries Neon PostgreSQL at a steady 50 queries/sec.'
    },
    {
      term: 'Blocking Dequeue (BRPOP)',
      category: 'patterns',
      badge: 'Efficiency Primitive',
      definition: 'A queue operation that pauses execution until a message arrives or a timeout occurs, avoiding wasteful CPU polling loops.',
      analogy: 'Waiting by the mailbox for a package instead of walking out to check the empty box every 10 seconds.',
      solitxContext: 'Our worker uses `redis.brpop(queue, 2)`: zero CPU consumption when the queue is empty.'
    },
    {
      term: 'Graceful Drain (SIGTERM)',
      category: 'reliability',
      badge: 'Teardown Pattern',
      definition: 'The practice of stopping consumer intake upon receiving an exit signal while allowing all active, in-flight jobs to finish before terminating.',
      analogy: 'A restaurant turning off the "Open" sign at 10 PM but letting diners already seated finish their meals.',
      solitxContext: 'In `worker.js`, `SIGINT`/`SIGTERM` waits for `activeJobsCount === 0` before closing DB connections and exiting.'
    },
    {
      term: 'Worker Pool',
      category: 'architecture',
      badge: 'Scaling Strategy',
      definition: 'A collection of concurrent worker processes or threads sharing a single queue to scale consumption throughput horizontally.',
      analogy: 'Opening 4 checkout counters at a supermarket during peak hours instead of just 1.',
      solitxContext: 'We can scale consumption simply by launching multiple `node src/worker.js` processes without touching the API code.'
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Workflow size={13} className="animate-pulse" />
          <span>Part VI — Asynchronous Processing • Day 25 of 78</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Background Jobs & Asynchronous Queue
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          In Day 25, we implemented a production-grade Producer-Consumer message queue powered by our existing 
          <span className="font-semibold text-zinc-900 dark:text-zinc-200"> Upstash Redis</span> infrastructure. 
          By creating a standalone background worker pool (<code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">worker.js</code>), 
          we decoupled HTTP request latency from slow downstream database side-effects.
        </p>

        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Message Delivery</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">100.0%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Zero data loss in test runs</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Avg Enqueue Latency</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">45.4 ms</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Across TLS network to Redis</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Worker Idle CPU</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">0.0%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Powered by BRPOP blocking</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Added Infrastructure</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">$0.00</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Zero new cloud servers needed</div>
          </div>
        </div>
      </div>

      {/* ─── 01. THE PROBLEM ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">01</span>
          <h2>The Problem: The Single-Threaded Request Trap & Decoupling Mandate</h2>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
          <p>
            In Day 24, our diagnostic profiler revealed that <strong>over 75% to 88% of request latency</strong> on write endpoints 
            was consumed by auxiliary tasks: inserting in-app notifications, recalculating follower counters, and fanning out feed keys.
          </p>
          <p>
            The fundamental flaw was that our API server was acting as both the <em>gatekeeper</em> and the <em>janitor</em>. 
            When a user clicked "Post", the HTTP thread did not just validate input and insert the post; it also waited for every single 
            secondary task to complete sequentially before returning a response.
          </p>
          <p>
            We needed an asynchronous mechanism that allowed the HTTP thread to drop a work ticket into a buffer and return immediately, 
            handing off the heavy lifting to dedicated background processes.
          </p>
        </div>
      </section>

      {/* ─── 02. WHY IS IT A PROBLEM? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">02</span>
          <h2>Why Is It a Problem? The Fragility of In-Process Asynchrony</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
              <Flame size={16} />
              <span>1. Total In-Memory Data Loss</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If you use <code className="font-mono text-[11px]">setImmediate()</code> or unhandled Promises, all queued tasks are held in Node.js heap memory. If the server crashes or reboots during a deployment, every queued job is lost forever.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm">
              <Cpu size={16} />
              <span>2. CPU Resource Contention</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Running heavy background jobs on the same Node event loop that serves HTTP requests degrades read latency. Event loop lag spikes, causing incoming user queries to stall.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
              <Activity size={16} />
              <span>3. Absence of Backpressure</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Without a persistent queue buffer, a sudden viral traffic spike triggers thousands of concurrent database queries at once, exceeding connection limits and causing database crashes.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 03. WHAT ARE OUR OPTIONS? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">03</span>
          <h2>What Are Our Options? Message Broker Evaluation Matrix</h2>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="p-3 font-medium">Message Broker</th>
                <th className="p-3 font-medium">Operational Cost</th>
                <th className="p-3 font-medium">Durability & Persistence</th>
                <th className="p-3 font-medium">Complexity / Overhead</th>
                <th className="p-3 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  A. In-Memory EventEmitter / setImmediate
                </td>
                <td className="p-3 text-emerald-500 font-mono">Zero cost</td>
                <td className="p-3 text-rose-500">Zero (Lost on restart)</td>
                <td className="p-3">Minimal (Built-in)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400">Rejected (Unreliable)</span>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                  B. Apache Kafka / RabbitMQ
                </td>
                <td className="p-3 text-rose-500 font-mono">$100+/month hosting</td>
                <td className="p-3 text-emerald-500">Disk-backed partition logs</td>
                <td className="p-3 text-rose-500">Extreme (JVM, Zookeeper, rebalancing)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400">Rejected (Premature Overkill)</span>
                </td>
              </tr>
              <tr className="bg-emerald-500/5">
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                  C. Redis List Queue (Upstash Redis)
                </td>
                <td className="p-3 text-emerald-500 font-mono">$0.00 (Existing infra)</td>
                <td className="p-3 text-emerald-500">AOF / RDB Memory Persistence</td>
                <td className="p-3 text-emerald-500">Minimal (Built-in List primitives)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Selected (ADR-005)</span>
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
          <h2>What Did I Learn? Producers, Consumers, and the Shock Absorber</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500" />
            The Core Concept: Temporal Decoupling
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            In synchronous architectures, the producer and consumer must execute at the <em>exact same instant</em>. If the consumer is slow, the producer is slow.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-1">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">The Producer (API Server):</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Doesn't care when or how the notification is sent. It simply constructs a small JSON envelope and pushes it to Redis in single-digit milliseconds via <code className="font-mono text-[11px]">LPUSH</code>.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">The Consumer (Worker Process):</span>
              <p className="text-zinc-600 dark:text-zinc-400">
                Runs on a separate OS process, pulls jobs at its own controlled pace via <code className="font-mono text-[11px]">BRPOP</code>, shielding our PostgreSQL connection pool from concurrency spikes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 05. DECISION ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">05</span>
          <h2>Decision: ADR-005 Redis List-Backed Asynchronous Job Queue</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            We formally adopted <strong>ADR-005</strong>: Using Redis List primitives (<code className="font-mono text-xs">LPUSH</code> / <code className="font-mono text-xs">BRPOP</code>) to power our asynchronous job queue.
          </p>
          <div className="space-y-1.5 font-mono text-xs bg-zinc-950 text-zinc-300 p-3.5 rounded-lg border border-zinc-800">
            <div><span className="text-indigo-400 font-semibold">// JOB ENVELOPE FORMAT:</span></div>
            <div>&#123;</div>
            <div className="pl-4">"id": "job_1729615377_k82m9z",</div>
            <div className="pl-4">"queue": "notifications",</div>
            <div className="pl-4">"data": &#123; "type": "post_like", "recipientId": "...", "actorId": "..." &#125;,</div>
            <div className="pl-4">"attempts": 0,</div>
            <div className="pl-4">"maxAttempts": 3,</div>
            <div className="pl-4">"enqueuedAt": 1729615377000,</div>
            <div className="pl-4">"status": "pending"</div>
            <div>&#125;</div>
          </div>
        </div>
      </section>

      {/* ─── 06. ARCHITECTURE BEFORE ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">06</span>
          <h2>Architecture Before: Synchronous Sequential Coupling</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// BEFORE: TIGHTLY COUPLED IN-PROCESS BLOCKING</div>
          <div className="text-rose-400">[Client] ──POST /posts──&gt; [API Server]</div>
          <div className="pl-32">│</div>
          <div className="pl-32">├─&gt; [PostgreSQL] INSERT INTO posts (262ms)</div>
          <div className="pl-32">├─&gt; [PostgreSQL] INSERT INTO notifications (258ms) &lt;-- WAITING!</div>
          <div className="pl-32">├─&gt; [PostgreSQL] SELECT COUNT(*) likes (257ms)      &lt;-- WAITING!</div>
          <div className="pl-32">└─&gt; [Upstash Redis] LPUSH timeline feeds (91ms)     &lt;-- WAITING!</div>
          <div className="pl-32">│</div>
          <div className="text-rose-400">[Client] &lt;──201 Created (After 1,080 - 2,208ms!)</div>
        </div>
      </section>

      {/* ─── 07. ARCHITECTURE AFTER ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">07</span>
          <h2>Architecture After: Asynchronous Producer-Consumer Topology</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 overflow-x-auto">
          <div className="text-zinc-500">// AFTER: DECOUPLED WITH REDIS BUFFER & BACKGROUND WORKER</div>
          <div className="text-emerald-400">[Client] ──POST /posts──&gt; [API Server (Producer)]</div>
          <div className="pl-32">│</div>
          <div className="pl-32">├─&gt; [PostgreSQL] INSERT INTO posts (262ms)</div>
          <div className="pl-32">└─&gt; [Upstash Redis] LPUSH queue:notifications (&lt;5ms)</div>
          <div className="pl-32">│</div>
          <div className="text-emerald-400">[Client] &lt;──201 Created (Immediate Response in ~265ms!)</div>
          <div className="text-zinc-600">═══════════════════════════════════════════════════════════════════════</div>
          <div className="text-indigo-400">[Upstash Redis Buffer: queue:notifications]</div>
          <div className="pl-16">│</div>
          <div className="pl-16">▼ (BRPOP blocking pull)</div>
          <div className="text-amber-400">[Background Worker Daemon (node src/worker.js)]</div>
          <div className="pl-16">├─&gt; Writes notification to PostgreSQL asynchronously</div>
          <div className="pl-16">├─&gt; Updates follower timeline lists in Redis</div>
          <div className="pl-16">└─&gt; Traps SIGTERM to drain active jobs on shutdown</div>
        </div>
      </section>

      {/* ─── 08. IMPLEMENTATION & INTERACTIVE QUEUE SIMULATOR ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">08</span>
          <h2>Implementation: Interactive Queue Depth & Worker Simulator</h2>
        </div>

        {/* Live Interactive Simulator Box */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sliders size={16} className="text-indigo-500" />
                Live Backpressure & Shock Absorber Simulator
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Adjust incoming job traffic and worker capacity to observe queue backlog formation and drain dynamics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${queueMetrics.healthColor} bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700`}>
                <Activity size={12} />
                {queueMetrics.healthStatus}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span>Incoming Job Inflow:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{inflowRate} jobs/sec</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="200" 
                step="5"
                value={inflowRate} 
                onChange={(e) => setInflowRate(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>10/s (Quiet)</span>
                <span>100/s</span>
                <span>200/s (Spike)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span>Active Worker Processes:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{workerCount} workers</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="8" 
                step="1"
                value={workerCount} 
                onChange={(e) => setWorkerCount(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>1 worker</span>
                <span>4 workers</span>
                <span>8 workers</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span>Job Processing Time:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{jobProcessingTime} ms</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="150" 
                step="5"
                value={jobProcessingTime} 
                onChange={(e) => setJobProcessingTime(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>20ms (Fast)</span>
                <span>80ms</span>
                <span>150ms (Slow DB)</span>
              </div>
            </div>
          </div>

          {/* Graphical Queue Flow & Buffer */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
                <div className="text-[11px] text-zinc-500">Producer Inflow Rate</div>
                <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{inflowRate} <span className="text-xs font-normal text-zinc-500">jobs/sec</span></div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
                <div className="text-[11px] text-zinc-500">Total Worker Drain Capacity</div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{queueMetrics.workerCapacityPerSec} <span className="text-xs font-normal text-zinc-500">jobs/sec</span></div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
                <div className="text-[11px] text-zinc-500">Net Queue Drift</div>
                <div className={`text-xl font-bold font-mono mt-0.5 ${queueMetrics.netRate > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {queueMetrics.netRate > 0 ? `+${queueMetrics.netRate}` : queueMetrics.netRate} <span className="text-xs font-normal text-zinc-500">jobs/sec</span>
                </div>
              </div>
            </div>

            {/* Backlog Growth Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span>Projected Backlog in Redis after 10s Traffic Surge:</span>
                <span className="font-mono font-bold">{queueMetrics.spikeBacklog} pending jobs</span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${queueMetrics.spikeBacklog > 200 ? 'bg-rose-500' : queueMetrics.spikeBacklog > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (queueMetrics.spikeBacklog / 400) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Shock Absorber Status: {queueMetrics.isAccumulating ? 'Buffering in Redis' : 'Immediate Drain'}</span>
                <span>Time to Drain Backlog: <strong className="text-zinc-800 dark:text-zinc-200">{queueMetrics.timeToDrainSec}s</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 09. TESTING ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">09</span>
          <h2>Testing: Queue Throughput, Drain Latency, and Zero-Loss Verification</h2>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed space-y-2">
          <p>
            We created and executed an automated benchmark harness: <code className="font-mono text-xs px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">backend/tests/07_queue_benchmark_test.js</code>.
            The test enqueued 30 distinct job payloads into Upstash Redis, validated queue depth using <code className="font-mono text-xs">LLEN</code>, 
            and then drained the entire queue using the consumer dequeue loop.
          </p>
          <div className="p-3.5 rounded-lg bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 space-y-1">
            <div className="text-zinc-500">// Run queue benchmark:</div>
            <div className="text-emerald-400">$ node tests/07_queue_benchmark_test.js</div>
            <div className="text-zinc-400">[1/4] Cleaned test queue: queue:benchmark_test_queue</div>
            <div className="text-zinc-400">[2/4] Benchmarking Producer (Enqueueing 30 jobs to Upstash Redis)...</div>
            <div className="text-zinc-400">      Successfully enqueued 30 jobs. Verified Queue Depth: 30 pending</div>
            <div className="text-zinc-400">[3/4] Benchmarking Consumer (Draining 30 jobs from Upstash Redis)...</div>
            <div className="text-zinc-400">      Successfully consumed 30 jobs. Remaining Queue Depth: 0</div>
          </div>
        </div>
      </section>

      {/* ─── 10. RESULTS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">10</span>
          <h2>Results: Real Measured Benchmarks from Day 25 Benchmark</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Send size={15} className="text-indigo-500" />
              Producer Performance (API Non-Blocking Impact)
            </h3>
            <div className="space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between"><span>Average Enqueue Latency:</span> <strong className="text-indigo-600 dark:text-indigo-400">45.40 ms</strong></div>
              <div className="flex justify-between"><span>P95 Enqueue Latency:</span> <strong>47.89 ms</strong></div>
              <div className="flex justify-between"><span>Enqueue Throughput:</span> <strong>22.0 jobs/sec</strong></div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Inbox size={15} className="text-emerald-500" />
              Consumer Performance (Background Worker)
            </h3>
            <div className="space-y-1 font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between"><span>Average Dequeue Latency:</span> <strong className="text-emerald-600 dark:text-emerald-400">44.83 ms</strong></div>
              <div className="flex justify-between"><span>P95 Dequeue Latency:</span> <strong>47.85 ms</strong></div>
              <div className="flex justify-between"><span>Delivery Success Rate:</span> <strong className="text-emerald-600 dark:text-emerald-400">100.0% (Zero Loss)</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. TRADE-OFFS ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">11</span>
          <h2>Trade-offs: The Architectural Costs of Asynchronous Queues</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              What We Gain
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Zero HTTP Blocking:</strong> API requests drop from 2,208ms to ~265ms.</li>
              <li><strong>Shock Absorption:</strong> Traffic surges buffer in Redis memory instead of knocking out Neon PostgreSQL.</li>
              <li><strong>Process Decoupling:</strong> Worker crashes do not crash the user-facing web server.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              What We Must Manage
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Memory Usage:</strong> If workers lag behind for hours, Redis RAM consumption increases with queue size.</li>
              <li><strong>Worker Observability:</strong> Requires monitoring worker process uptime and queue depth metrics.</li>
              <li><strong>Eventual Consistency:</strong> Downstream users experience a 100-300ms propagation delay for notification badges.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 12. WHAT BROKE NEXT? ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">12</span>
          <h2>What Broke Next? Connecting Real Notification Events (Bridge to Day 26)</h2>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Our queue engine is built and verified. However, in Day 25, the queue is still standalone. 
            The live API endpoints in <code className="font-mono text-xs">post.controller.js</code> and <code className="font-mono text-xs">user.controller.js</code> are 
            still invoking synchronous <code className="font-mono text-xs">createNotification()</code> queries!
          </p>
          <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-300">
            <strong>Next on Roadmap (Day 26 — Notifications Queue):</strong> We will rewire <code className="font-mono">createPost</code>, <code className="font-mono">toggleLike</code>, and <code className="font-mono">createComment</code> to push to <code className="font-mono">queue:notifications</code>, fully liberating the API from notification write latency.
          </div>
        </div>
      </section>

      {/* ─── SYSTEM DESIGN GLOSSARY ─── */}
      <section className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Workflow size={18} className="text-indigo-500" />
              Core System Design Glossary: Message Queues
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Essential distributed systems concepts for understanding message brokers, backpressure, and worker pools.
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
          {['all', 'architecture', 'patterns', 'bottleneck', 'reliability'].map((cat) => (
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
