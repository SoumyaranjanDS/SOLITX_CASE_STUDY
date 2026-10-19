import { useEffect, useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  Search,
  Compass,
  Server,
  Database,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Zap,
  Sparkles
} from 'lucide-react';

const NAVIGATION_SECTIONS = [
  {
    id: 'blueprint',
    title: 'Blueprint & Architecture',
    icon: Compass,
    badge: 'Specs',
    items: [
      { path: '/', label: 'Core Philosophy & Architecture', day: null },
      { path: '/requirements', label: 'Requirements & Non-Goals', day: null },
      { path: '/day-3-estimation', label: 'Capacity & Traffic Estimation', day: 'D03' },
    ]
  },
  {
    id: 'monolith',
    title: 'Phase I: Monolith & Core DB',
    icon: Server,
    badge: 'Days 4-10',
    items: [
      { path: '/day-4-foundation', label: 'Monolith Foundation & Express', day: 'D04' },
      { path: '/day-5-rate-limiting', label: 'In-Memory Rate Limiting', day: 'D05' },
      { path: '/day-6-database', label: 'Relational Schema & Constraints', day: 'D06' },
      { path: '/day-7-indexing', label: 'PostgreSQL Indexing & B-Trees', day: 'D07' },
      { path: '/day-8-load-testing', label: 'Load Testing & Benchmark Baselines', day: 'D08' },
      { path: '/day-9-connection-pooling', label: 'Single-Node Connection Pooling', day: 'D09' },
      { path: '/day-10-pagination', label: 'Keyset & Cursor Pagination', day: 'D10' },
    ]
  },
  {
    id: 'caching',
    title: 'Phase II: Distributed Caching',
    icon: Database,
    badge: 'Days 11–16',
    items: [
      { path: '/day-11-api-protection', label: 'Distributed API Protection', day: 'D11' },
      { path: '/day-12-repeated-reads', label: 'The Repeated Reads Bottleneck', day: 'D12' },
      { path: '/day-13-redis', label: 'Redis Cache-Aside Pattern', day: 'D13' },
      { path: '/day-14-cache-invalidation', label: 'Write-Through Cache Invalidation', day: 'D14' },
      { path: '/day-15-cache-stampede', label: 'Cache Stampede & Thundering Herd', day: 'D15' },
      { path: '/day-16-distributed-rate-limiting', label: 'Cache Lifecycles & TTLs', day: 'D16' },
    ]
  },
  {
    id: 'production',
    title: 'Phase III: Production Workflows',
    icon: ShieldCheck,
    badge: 'Days 17–18',
    items: [
      { path: '/day-17-oauth-usernames', label: 'OAuth 2.0 & Handle Provisioning', day: 'D17' },
      { path: '/day-18-feed-post-lifecycle', label: 'Post Lifecycle & Fan-Out Reads', day: 'D18' },
    ]
  },
  {
    id: 'scale',
    title: 'Phase IV: Horizontal Scale',
    icon: Layers,
    badge: 'Days 19–23',
    highlight: true,
    items: [
      { path: '/day-19-server-bottleneck', label: 'Single Server Resource Ceiling', day: 'D19' },
      { path: '/day-21-connection-pooling', label: 'Connection Pooling Under Scale', day: 'D21' },
      { path: '/day-22-statelessness-audit', label: 'Statelessness & Fault Injection', day: 'D22', isNew: true },
    ]
  }
];

export default function Layout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});
  const location = useLocation();

  // Flattened list for Next/Prev pagination navigation
  const allItems = useMemo(() => {
    return NAVIGATION_SECTIONS.flatMap(section => section.items);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSection = (id) => {
    setCollapsedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Figure out Pagination (Next / Prev pages)
  const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1
    ? location.pathname.slice(0, -1)
    : location.pathname;
  const currentIndex = allItems.findIndex(item => item.path === normalizedPath);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  const prevPage = activeIndex > 0 ? allItems[activeIndex - 1] : null;
  const nextPage = activeIndex < allItems.length - 1 ? allItems[activeIndex + 1] : null;

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return NAVIGATION_SECTIONS;
    const query = searchQuery.toLowerCase().trim();

    return NAVIGATION_SECTIONS.map(section => {
      const matchingItems = section.items.filter(item =>
        item.label.toLowerCase().includes(query) ||
        (item.day && item.day.toLowerCase().includes(query))
      );
      return {
        ...section,
        items: matchingItems
      };
    }).filter(section => section.items.length > 0);
  }, [searchQuery]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#09090b] text-slate-800 dark:text-slate-200">
      {/* ─── BRAND HEADER ─── */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group no-underline">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-purple-500 flex items-center justify-center text-white shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Zap size={18} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  SOLITX
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-500/20">
                  Case Study
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                78-Day System Architecture
              </div>
            </div>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* ─── SEARCH / QUICK FILTER BAR ─── */}
        <div className="mt-3.5 relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 22 case studies..."
            className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg bg-white dark:bg-[#121216] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] dark:focus:border-purple-500 focus:ring-1 focus:ring-[#7C3AED] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ─── GROUPED NAVIGATION SECTIONS ─── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800">
        {filteredSections.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400">
            <p className="text-xs mb-1">No case studies match "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] font-semibold text-[#7C3AED] hover:underline cursor-pointer"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          filteredSections.map((section) => {
            const SectionIcon = section.icon;
            const isCollapsed = !searchQuery && Boolean(collapsedSections[section.id]);

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <SectionIcon size={13} className="text-[#7C3AED] dark:text-purple-400" />
                    <span className="truncate">{section.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 lowercase">
                      {section.badge}
                    </span>
                    {!searchQuery && (
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    )}
                  </div>
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <ul className="space-y-0.5 pt-0.5">
                    {section.items.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all no-underline ${isActive
                              ? 'bg-purple-100/70 dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-300 font-semibold border-l-2 border-[#7C3AED]'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center gap-2 truncate">
                                {item.day ? (
                                  <span
                                    className={`shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${isActive
                                        ? 'bg-[#7C3AED] text-white shadow-xs'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-[#7C3AED]/15 group-hover:text-[#7C3AED]'
                                      }`}
                                  >
                                    {item.day}
                                  </span>
                                ) : (
                                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#7C3AED]" />
                                )}
                                <span className="truncate">{item.label}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {item.isNew && (
                                  <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Live
                                  </span>
                                )}
                                {isActive && (
                                  <ChevronRight size={13} className="text-[#7C3AED] dark:text-purple-400" />
                                )}
                              </div>
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* ─── BOTTOM PROGRESS & EXTERNAL LINKS FOOTER ─── */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0c0c0e]/80 shrink-0 space-y-3">
        {/* Journey Progress Widget */}
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles size={12} className="text-[#7C3AED]" />
              Day 22 of 78
            </span>
            <span className="font-mono text-[10px] font-bold text-[#7C3AED]">
              28.2%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-purple-500 transition-all duration-500"
              style={{ width: '28.2%' }}
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
            Phase IV: Horizontal Scale & Statelessness
          </div>
        </div>

        {/* External Quick Links */}
        <div className="flex items-center gap-2 text-[11px]">
          <a
            href="https://solitx.soumya.site"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 text-slate-700 dark:text-slate-300 font-medium no-underline transition-colors"
          >
            <span>Live App</span>
            <ExternalLink size={11} className="text-slate-400" />
          </a>
          <a
            href="https://github.com/SoumyaranjanDS/SOLITX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 text-slate-700 dark:text-slate-300 no-underline transition-colors"
            aria-label="GitHub Repository"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-[#0a0a0a] transition-colors duration-200">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] sticky top-0 z-20">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-purple-500 flex items-center justify-center text-white">
            <Zap size={15} className="fill-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
            SOLITX
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] z-30 bg-[#f8fafc] dark:bg-[#09090b] border-t border-slate-200 dark:border-slate-800 overflow-y-auto">
          <SidebarContent />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 border-r border-slate-200 dark:border-slate-800/80 shrink-0 sticky top-0 h-screen transition-colors duration-200">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 lg:p-16 flex flex-col min-w-0">
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Prev / Next Pagination Controls */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          {prevPage ? (
            <Link
              to={prevPage.path}
              className="flex flex-col gap-1 group w-full sm:w-1/2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 no-underline transition-all bg-white dark:bg-[#0c0c0e]"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-[#7C3AED] transition-colors">
                <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
                Previous Chapter
              </span>
              <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {prevPage.label}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block sm:w-1/2" />
          )}

          {nextPage ? (
            <Link
              to={nextPage.path}
              className="flex flex-col items-end text-right gap-1 group w-full sm:w-1/2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 no-underline transition-all bg-white dark:bg-[#0c0c0e]"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-[#7C3AED] transition-colors">
                Next Chapter
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {nextPage.label}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block sm:w-1/2" />
          )}
        </div>
      </main>
    </div>
  );
}
