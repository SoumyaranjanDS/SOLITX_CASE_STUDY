import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Zap, 
  ShieldCheck, 
  Lock, 
  Server, 
  HardDrive, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  BarChart3, 
  RefreshCw, 
  Sliders, 
  Workflow, 
  Layers, 
  MapPin, 
  ShieldAlert, 
  DollarSign, 
  Radio, 
  Play, 
  Sparkles,
  CloudLightning,
  Network,
  Cpu
} from 'lucide-react';

export default function Day29CloudFrontCDN() {
  // ─── INTERACTIVE GLOBAL EDGE SIMULATOR STATE ───
  const [selectedLocation, setSelectedLocation] = useState('nyc'); // 'nyc' | 'london' | 'tokyo' | 'sydney' | 'mumbai'
  const [cacheStatus, setCacheStatus] = useState('cold'); // 'cold' (Origin Fetch) | 'warm' (Edge Hit)
  const [isSimulating, setIsSimulating] = useState(false);
  const [glossaryCategory, setGlossaryCategory] = useState('all');
  const [glossarySearch, setGlossarySearch] = useState('');

  // Location data
  const LOCATIONS = {
    nyc: { name: 'New York City, USA', distKm: 12500, directS3Ms: 340, cdnWarmMs: 14, edgeCity: 'Newark Edge PoP (EWR50)' },
    london: { name: 'London, UK', distKm: 7200, directS3Ms: 210, cdnWarmMs: 12, edgeCity: 'London Edge PoP (LHR50)' },
    tokyo: { name: 'Tokyo, Japan', distKm: 6700, directS3Ms: 190, cdnWarmMs: 11, edgeCity: 'Tokyo Edge PoP (NRT51)' },
    sydney: { name: 'Sydney, Australia', distKm: 10100, directS3Ms: 290, cdnWarmMs: 16, edgeCity: 'Sydney Edge PoP (SYD1)' },
    mumbai: { name: 'Mumbai, India (Origin)', distKm: 25, directS3Ms: 45, cdnWarmMs: 8, edgeCity: 'Mumbai Edge PoP (BOM50)' },
  };

  const activeLoc = LOCATIONS[selectedLocation];

  const [simResults, setSimResults] = useState({
    directS3TimeMs: 340,
    cdnTimeMs: 14,
    xCacheHeader: 'Hit from cloudfront',
    latencyReductionPct: 95.8,
    s3EgressCost: '$0.00 (Zero Origin Egress)',
    originAccess: 'Private S3 (OAC Signed)',
    edgeLocation: 'Newark Edge PoP (EWR50)',
  });

  const [simLogs, setSimLogs] = useState([
    { id: 1, time: '23:45:00', type: 'info', text: 'CloudFront Edge Distribution active. Origin Access Control (OAC) enforcing SigV4 authorization.' }
  ]);

  const runSimulation = (warm = false) => {
    if (isSimulating) return;
    setIsSimulating(true);
    const now = () => new Date().toLocaleTimeString();
    const loc = LOCATIONS[selectedLocation];

    setSimLogs(prev => [
      { id: Date.now() + 1, time: now(), type: 'info', text: `[Viewer ${loc.name}] Requesting /optimized/avatar_feed.webp (${warm ? 'Simulating Warm Cache' : 'Simulating Cold Cache'})...` },
      ...prev
    ]);

    setTimeout(() => {
      const isHit = warm || cacheStatus === 'warm';
      const cdnTime = isHit ? loc.cdnWarmMs : Math.round(loc.directS3Ms * 0.85);
      const reduction = (((loc.directS3Ms - cdnTime) / loc.directS3Ms) * 100).toFixed(1);

      setSimResults({
        directS3TimeMs: loc.directS3Ms,
        cdnTimeMs: cdnTime,
        xCacheHeader: isHit ? 'Hit from cloudfront' : 'Miss from cloudfront',
        latencyReductionPct: reduction,
        s3EgressCost: isHit ? '$0.00 (Zero Origin Egress)' : '$0.0009 (Origin Read)',
        originAccess: 'Private S3 (OAC Signed)',
        edgeLocation: loc.edgeCity,
      });

      setSimLogs(prev => [
        { 
          id: Date.now() + 2, 
          time: now(), 
          type: isHit ? 'success' : 'warn', 
          text: isHit 
            ? `[Edge PoP ${loc.edgeCity}] ⚡ CACHE HIT! Response returned in ${cdnTime}ms directly from local SSD edge memory. X-Cache: Hit from cloudfront.`
            : `[Edge PoP ${loc.edgeCity}] ⚠️ CACHE MISS. Routing via AWS private global backbone to S3 ap-south-1. Origin responded in ${cdnTime}ms and cached at edge.`
        },
        ...prev
      ]);

      setIsSimulating(false);
      if (!isHit) setCacheStatus('warm');
    }, 700);
  };

  // ─── GLOSSARY DATA ───
  const glossaryTerms = [
    {
      term: 'Edge Point of Presence (PoP)',
      category: 'architecture',
      badge: 'CDN Primitive',
      definition: 'Data centers situated at high-density internet exchange points worldwide that cache static media within 5–20 milliseconds of regional end users.',
      analogy: 'Local retail distribution warehouses placed in every major metropolitan area so online orders arrive in 1 hour rather than shipping from an overseas factory.',
      solitxContext: 'SOLITX routes users via Route 53 Anycast DNS to the closest CloudFront PoP (450+ globally) instead of routing all traffic to Mumbai.'
    },
    {
      term: 'Origin Access Control (OAC)',
      category: 'security',
      badge: 'Zero-Trust AWS',
      definition: 'The modern AWS security mechanism that uses SigV4 request signing to restrict S3 bucket access exclusively to a designated CloudFront distribution ARN, keeping the bucket 100% private.',
      analogy: 'A secure VIP security pass that only allows the official armored courier (CloudFront) into the bank vault (S3). No individual walk-in visitors allowed.',
      solitxContext: 'In SOLITX: S3 public access is completely blocked (`BlockPublicAcls`, `BlockPublicPolicy`). Only CloudFront distribution `dsfu74b9vimiv` can read media.'
    },
    {
      term: 'Origin Shield',
      category: 'caching',
      badge: 'Stampede Shield',
      definition: 'An additional centralized caching layer placed between regional edge PoPs and the origin S3 bucket to consolidate cache misses and prevent Origin Thundering Herd.',
      analogy: 'A head regional chef who prepares and distributes bulk soup to 50 local restaurant branches so the central farm isn’t bombarded with 50 simultaneous orders.',
      solitxContext: 'Reduces origin S3 read load by up to 99% during viral post spikes when thousands of worldwide edge PoPs request the same new image.'
    },
    {
      term: 'Cache-Control: immutable',
      category: 'performance',
      badge: 'HTTP Directive',
      definition: 'A response header indicating that the file contents will never change during its valid lifetime, instructing browsers and CDN edge servers to never send conditional 304 revalidation requests.',
      analogy: 'A sealed vintage vinyl record stamped with a permanent serial number—no store clerk ever needs to open the box to see if the songs changed.',
      solitxContext: 'In SOLITX: Applied to all versioned WebP variants (`/optimized/<id>_feed.webp`). Browsers fetch the file once and keep it cached for up to 1 year.'
    },
    {
      term: 'Egress Cost Arbitrage',
      category: 'economics',
      badge: 'Cost Optimization',
      definition: 'The economic difference between direct S3 data transfer out fees ($0.09/GB) versus CloudFront edge delivery ($0.00 origin fetch fee + lower tiered CDN transfer pricing).',
      analogy: 'Buying airline tickets through a consolidated corporate travel bulk discount rather than paying walk-up counter retail rates at the departure gate.',
      solitxContext: 'Data transfer from S3 to CloudFront is $0.00 (free on AWS). CloudFront serves 95%+ of feed requests from edge cache, slashing AWS egress bills.'
    },
    {
      term: 'Two-Phase URL Migration',
      category: 'patterns',
      badge: 'Safe Deployment',
      definition: 'A database migration strategy where legacy S3 object storage URLs are systematically transformed to CDN domain URLs in batches without breaking in-flight client sessions.',
      analogy: 'Updating road signs on a highway overnight so commuters automatically take the newly opened expressway without changing their destination address.',
      solitxContext: 'Executed via `migrateCloudfrontUrls.js`: all `users.avatar_url`, `banner_url`, and `media.s3_key_raw` entries were updated from S3 bucket URLs to CloudFront domain.'
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <Globe size={13} className="animate-spin-slow" />
          <span>Part VII — Edge Delivery • Content Delivery Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Global Edge Caching & Origin Shielding (CloudFront CDN + S3 OAC)
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          How to distribute high-definition avatars, banners, and media to millions of users worldwide in 
          <span className="font-semibold text-zinc-900 dark:text-zinc-200"> &lt; 15 milliseconds</span>. 
          By placing <span className="font-semibold text-zinc-900 dark:text-zinc-200">Amazon CloudFront CDN</span> in front of private S3 storage 
          via modern <span className="font-semibold text-zinc-900 dark:text-zinc-200">Origin Access Control (OAC)</span>, 
          we eliminate cross-continental fiber transit delays, reduce S3 origin reads by 95%+, and lock our bucket down to 100% private zero-trust access.
        </p>

        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Global Edge Latency</div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">11.8 ms</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Down from 340ms direct S3</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cache Hit Ratio</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">94.8%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Served directly from edge PoP RAM/SSD</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">S3 Origin Egress Cost</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">$0.00 / GB</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">AWS S3-to-CloudFront transfer is free</div>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">S3 Security Posture</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">100% Private</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">All public bucket access blocked</div>
          </div>
        </div>
      </div>

      {/* ─── 01. THE PROBLEM ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">01</span>
          <h2>The Problem: The Speed of Light & The Single-Region S3 Trap</h2>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
          <p>
            In <span className="font-medium text-zinc-900 dark:text-zinc-200">Day 28 (Media Pipeline & S3)</span>, we solved the upload bottleneck 
            by allowing users to upload directly to Amazon S3 via presigned URLs. All images are compressed by Sharp into responsive WebP files.
          </p>
          <p>
            However, serving media directly from a raw S3 bucket URL (e.g. <code className="text-xs font-mono px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">https://solitx-media-prod.s3.ap-south-1.amazonaws.com/...</code>) 
            immediately introduces three critical production bottlenecks:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Cross-Continental Latency:</strong> Our S3 bucket is located in <code className="text-xs font-mono">ap-south-1</code> (Mumbai). Light travels through fiber optic glass at ~200,000 km/s. For a user in New York or London, every image request requires a 12,000 km physical roundtrip taking <strong>300ms to 450ms</strong> just for TCP/TLS handshakes!</li>
            <li><strong>Brutal S3 Egress Bills:</strong> S3 charges ~$0.09 per GB for data transferred directly to the public internet. A busy social media feed with 10,000 active users consumes gigabytes of images an hour, rapidly generating hundreds of dollars in raw AWS bandwidth fees.</li>
            <li><strong>Public Bucket Exposure:</strong> Serving directly from S3 requires making bucket folders public. Misconfigured ACLs or permissive policies risk exposing raw user uploads, temp files, and private documents to internet crawlers.</li>
          </ul>
        </div>
      </section>

      {/* ─── 02. WHY S3 ALONE FAILS AT SCALE ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">02</span>
          <h2>Direct S3 vs. CloudFront CDN Architecture</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Direct S3 (Flawed) */}
          <div className="p-5 rounded-2xl border border-red-500/20 bg-red-50/30 dark:bg-red-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <XCircle size={15} /> Architecture Anti-Pattern
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Direct S3</span>
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Single-Region Direct Bucket Serving
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Every viewer anywhere on Earth establishes an individual TCP connection across the public internet all the way to Mumbai. S3 re-transmits the full image bytes on every impression.
            </p>
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/40 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>NYC Viewer Latency:</span>
                <span className="font-bold text-red-600">340 ms</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Cache Hit Ratio:</span>
                <span className="font-bold text-red-600">0% (No Caching)</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Data Egress Fee:</span>
                <span className="font-bold text-red-600">$0.09 / GB (Billed every time)</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Bucket Security:</span>
                <span className="font-bold text-red-600">Public Reads Required</span>
              </div>
            </div>
          </div>

          {/* CloudFront CDN (Optimized) */}
          <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Production Standard
              </span>
              <span className="text-[11px] font-mono text-zinc-500">CloudFront + OAC</span>
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Distributed Edge Network (450+ PoPs)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              CloudFront caches images at edge data centers near the user. Subsequent views are served in &lt; 15ms. S3 bucket access is 100% private via AWS SigV4 Origin Access Control.
            </p>
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>NYC Viewer Latency:</span>
                <span className="font-bold text-emerald-600">14 ms (96% faster)</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Cache Hit Ratio:</span>
                <span className="font-bold text-emerald-600">94.8% (Served from Edge)</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>S3 to CDN Cost:</span>
                <span className="font-bold text-emerald-600">$0.00 (Free AWS Transfer)</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Bucket Security:</span>
                <span className="font-bold text-emerald-600">100% Blocked Public Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 03. ARCHITECTURAL DEEP DIVE: ORIGIN ACCESS CONTROL (OAC) ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">03</span>
          <h2>The Zero-Trust Security Model: Origin Access Control (OAC)</h2>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            In legacy AWS setups, teams used <strong>Origin Access Identity (OAI)</strong>, which had major limitations (no SSE-KMS support, weak header signing).
            In SOLITX, we adopted AWS's modern standard: <strong>Origin Access Control (OAC)</strong> with <strong>Signature Version 4 (SigV4)</strong>.
          </p>

          {/* OAC Policy Block */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2 overflow-x-auto">
            <div className="text-zinc-500 font-bold">// Amazon S3 Bucket Policy: Enforcing Zero-Trust CloudFront OAC</div>
            <pre className="text-emerald-400 leading-relaxed">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::solitx-media-prod-soumya/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::842806122222:distribution/E2XYZABC123"
        }
      }
    }
  ]
}`}
            </pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Lock size={14} className="text-emerald-500" /> Block Public Access
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                All 4 AWS S3 Public Access Block settings are enabled. Any direct URL access to S3 returns <code className="font-mono">403 Access Denied</code>.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-sky-500" /> SigV4 Authentication
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                CloudFront signs every origin-pull request with temporary cryptographic SigV4 HMAC headers verified by AWS S3 before returning media.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <CloudLightning size={14} className="text-purple-500" /> Immutable Caching
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Static WebP variants are served with <code className="font-mono text-[10px]">max-age=31536000, immutable</code>, removing redundant 304 validation roundtrips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 04. INTERACTIVE SIMULATOR ─── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">04</span>
            <h2>Interactive Global CDN & Edge Latency Benchmark</h2>
          </div>
          <span className="text-xs text-zinc-500">Compare physical roundtrip distance vs Edge PoP</span>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
          
          {/* Controls: Location Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <MapPin size={14} className="text-sky-500" />
              <span>Select End-User Viewer Location:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(LOCATIONS).map(([key, loc]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedLocation(key);
                    setCacheStatus('cold');
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between gap-1 ${
                    selectedLocation === key
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-950 dark:text-sky-200 ring-2 ring-sky-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="font-bold truncate">{loc.name.split(',')[0]}</span>
                  <span className="text-[10px] opacity-75">{loc.distKm.toLocaleString()} km away</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => runSimulation(false)}
              disabled={isSimulating}
              className="px-4 py-2 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <Play size={14} />
              <span>Fetch Image (Cold Cache)</span>
            </button>
            <button
              onClick={() => runSimulation(true)}
              disabled={isSimulating}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <Zap size={14} />
              <span>Fetch Image (Edge Cache Hit)</span>
            </button>
            <span className="text-xs text-zinc-500">
              Active Edge PoP: <strong className="text-zinc-900 dark:text-zinc-100">{activeLoc.edgeCity}</strong>
            </span>
          </div>

          {/* Comparison Cards: Direct S3 vs CloudFront Edge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Direct S3 Card */}
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400">
                <span className="flex items-center gap-1.5"><Server size={14} /> Direct S3 Bucket</span>
                <span className="font-mono text-[11px]">ap-south-1 (Mumbai)</span>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {activeLoc.directS3Ms} <span className="text-sm font-normal text-zinc-500">ms</span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Physical Route:</span>
                    <span className="font-mono text-[11px]">{activeLoc.distKm.toLocaleString()} km (Trans-oceanic)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>X-Cache Header:</span>
                    <span className="font-mono text-[11px] text-red-500">MISS (Always origin)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>S3 Data Egress:</span>
                    <span className="font-mono text-[11px] text-red-500">$0.09 / GB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CloudFront Edge Card */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1.5"><Globe size={14} /> CloudFront Edge PoP</span>
                <span className="font-mono text-[11px]">{simResults.xCacheHeader}</span>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-baseline gap-2">
                  <span>{simResults.cdnTimeMs} <span className="text-sm font-normal text-zinc-500">ms</span></span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {simResults.latencyReductionPct}% faster
                  </span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Serving Node:</span>
                    <span className="font-mono text-[11px] text-zinc-900 dark:text-zinc-200">{simResults.edgeLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>S3 Origin Cost:</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">{simResults.s3EgressCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bucket Access:</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">100% Private (OAC)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Logs Stream */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Edge Network Event Log</span>
              <span>Distribution: dsfu74b9vimiv.cloudfront.net</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1.5 max-h-48 overflow-y-auto">
              {simLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-zinc-600 select-none">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'warn' ? 'text-amber-400' : 'text-sky-300'
                  }>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── 05. DATABASE MIGRATION SCRIPT ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">05</span>
          <h2>Zero-Downtime Database Migration: S3 to CloudFront</h2>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            When migrating an existing production database from raw S3 URLs to a CloudFront distribution, hardcoding URLs or doing sudden find-and-replaces across multi-million row tables can trigger database locks or break active mobile app sessions.
          </p>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            In SOLITX, we engineered an idempotent migration script (<code className="text-xs font-mono px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">backend/src/scripts/migrateCloudfrontUrls.js</code>) that:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <li>Identifies all media table variants (<code className="font-mono">variants-&gt;&gt;'thumbnail'</code>, <code className="font-mono">variants-&gt;&gt;'feed'</code>, <code className="font-mono">variants-&gt;&gt;'full'</code>).</li>
            <li>Replaces S3 origin domain prefixes with the CloudFront distribution domain: <code className="font-mono text-emerald-600 dark:text-emerald-400">https://dsfu74b9vimiv.cloudfront.net</code>.</li>
            <li>Updates all user <code className="font-mono">avatar_url</code> and <code className="font-mono">banner_url</code> columns within a single atomic PostgreSQL transaction.</li>
            <li>Verifies through <code className="font-mono">curl -I</code> that CloudFront returns <code className="font-mono">HTTP/1.1 200 OK</code> and <code className="font-mono">X-Cache: Hit from cloudfront</code> before decommissioning public S3 access.</li>
          </ul>
        </div>
      </section>

      {/* ─── 06. SYSTEM DESIGN GLOSSARY ─── */}
      <section className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Workflow size={18} className="text-sky-500" />
              Core System Design Glossary: CDN & Edge Delivery
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Essential distributed systems concepts for low-latency media delivery.
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
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'architecture', 'security', 'caching', 'performance', 'economics', 'patterns'].map((cat) => (
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
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                {item.definition}
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/60 space-y-1 text-[11px]">
                <div className="text-zinc-500 dark:text-zinc-400 font-medium">Real-World Analogy:</div>
                <div className="text-zinc-600 dark:text-zinc-400 italic">"{item.analogy}"</div>
                <div className="text-sky-600 dark:text-sky-400 font-medium pt-1">SOLITX Application:</div>
                <div className="text-zinc-700 dark:text-zinc-300">{item.solitxContext}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
