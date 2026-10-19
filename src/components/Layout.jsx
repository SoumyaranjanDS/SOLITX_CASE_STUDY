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

// Streamlined, punchy single-line labels
const NAVIGATION_SECTIONS = [
  {
    id: 'blueprint',
    title: 'Blueprint',
    icon: Compass,
    badge: 'Specs',
    items: [
      { path: '/', label: 'Core Philosophy', day: null },
      { path: '/requirements', label: 'Requirements', day: null },
      { path: '/day-3-estimation', label: 'Capacity Estimation', day: 'D03' },
    ]
  },
  {
    id: 'monolith',
    title: 'Phase I: Monolith',
    icon: Server,
    badge: 'D4–10',
    items: [
      { path: '/day-4-foundation', label: 'Monolith Setup', day: 'D04' },
      { path: '/day-5-rate-limiting', label: 'Rate Limiting', day: 'D05' },
      { path: '/day-6-database', label: 'Database Schema', day: 'D06' },
      { path: '/day-7-indexing', label: 'Database Indexing', day: 'D07' },
      { path: '/day-8-load-testing', label: 'Load Testing', day: 'D08' },
      { path: '/day-9-connection-pooling', label: 'Connection Pooling', day: 'D09' },
      { path: '/day-10-pagination', label: 'Keyset Pagination', day: 'D10' },
    ]
  },
  {
    id: 'caching',
    title: 'Phase II: Caching',
    icon: Database,
    badge: 'D11–16',
    items: [
      { path: '/day-11-api-protection', label: 'API Protection', day: 'D11' },
      { path: '/day-12-repeated-reads', label: 'Repeated Reads', day: 'D12' },
      { path: '/day-13-redis', label: 'Redis Cache-Aside', day: 'D13' },
      { path: '/day-14-cache-invalidation', label: 'Cache Invalidation', day: 'D14' },
      { path: '/day-15-cache-stampede', label: 'Cache Stampede', day: 'D15' },
      { path: '/day-16-distributed-rate-limiting', label: 'Cache Lifecycles', day: 'D16' },
    ]
  },
  {
    id: 'production',
    title: 'Phase III: Flows',
    icon: ShieldCheck,
    badge: 'D17–18',
    items: [
      { path: '/day-17-oauth-usernames', label: 'OAuth & Usernames', day: 'D17' },
      { path: '/day-18-feed-post-lifecycle', label: 'Post Lifecycle', day: 'D18' },
    ]
  },
  {
    id: 'scale',
    title: 'Phase IV: Scale',
    icon: Layers,
    badge: 'D19–23',
    highlight: true,
    items: [
      { path: '/day-19-server-bottleneck', label: 'Server Bottleneck', day: 'D19' },
      { path: '/day-21-connection-pooling', label: 'Scale Pooling', day: 'D21' },
      { path: '/day-22-statelessness-audit', label: 'Statelessness Audit', day: 'D22', isNew: true },
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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Auto-scroll to top and close drawer on route change
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

  const currentItem = allItems[activeIndex] || allItems[0];
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

  const renderSidebar = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#09090b] text-slate-800 dark:text-slate-200 select-none">
      {/* ─── BRAND HEADER ─── */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 group no-underline"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-purple-500 flex items-center justify-center text-white shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Zap size={15} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  SOLITX
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-purple-100 text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-500/20">
                  Case Study
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                78-Day Architecture
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ─── SEARCH / QUICK FILTER BAR ─── */}
        <div className="mt-2.5 relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters..."
            className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg bg-white dark:bg-[#121216] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] dark:focus:border-purple-500 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ─── GROUPED NAVIGATION SECTIONS ─── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3 text-xs overscroll-contain">
        {filteredSections.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-400">
            <p className="text-xs mb-1">No matches found</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] font-semibold text-[#7C3AED] hover:underline cursor-pointer"
            >
              Reset filter
            </button>
          </div>
        ) : (
          filteredSections.map((section) => {
            const SectionIcon = section.icon;
            const isCollapsed = !searchQuery && Boolean(collapsedSections[section.id]);

            return (
              <div key={section.id} className="space-y-0.5">
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <SectionIcon size={12} className="text-[#7C3AED] dark:text-purple-400" />
                    <span>{section.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-200/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400">
                      {section.badge}
                    </span>
                    {!searchQuery && (
                      <ChevronDown
                        size={11}
                        className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    )}
                  </div>
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <ul className="space-y-1 pt-0.5">
                    {section.items.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={() => isMobile && setIsMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all no-underline ${
                              isActive
                                ? 'tab-3d-active font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center gap-2 truncate">
                                {item.day ? (
                                  <span
                                    className={`shrink-0 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                                      isActive
                                        ? 'bg-black/25 text-white border border-white/25 shadow-inner'
                                        : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:bg-[#7C3AED]/15 group-hover:text-[#7C3AED]'
                                    }`}
                                  >
                                    {item.day}
                                  </span>
                                ) : (
                                  <span
                                    className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                                      isActive ? 'bg-white shadow-xs' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-[#7C3AED]'
                                    }`}
                                  />
                                )}
                                <span className="truncate whitespace-nowrap">{item.label}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {item.isNew && (
                                  <span className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                                    isActive 
                                      ? 'bg-white/20 text-white border border-white/30' 
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    Live
                                  </span>
                                )}
                                {isActive && (
                                  <ChevronRight size={13} className="text-white shrink-0 drop-shadow-xs" />
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

      {/* ─── BOTTOM PROGRESS FOOTER ─── */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-[#0c0c0e]/80 shrink-0 space-y-2.5">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles size={11} className="text-[#7C3AED]" />
              Day 22 of 78
            </span>
            <span className="font-mono text-[10px] font-bold text-[#7C3AED]">
              28.2%
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-purple-500 transition-all duration-500"
              style={{ width: '28.2%' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <a
            href="https://solitx.soumya.site"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md border border-slate-200 dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 text-slate-700 dark:text-slate-300 font-medium no-underline transition-colors"
          >
            <span>Live App</span>
            <ExternalLink size={10} className="text-slate-400" />
          </a>
          <a
            href="https://github.com/SoumyaranjanDS/SOLITX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 text-slate-700 dark:text-slate-300 no-underline transition-colors"
            aria-label="GitHub Repository"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-[#0a0a0a] transition-colors duration-200 font-sans">
      {/* ─── MOBILE STICKY TOP NAVBAR ─── */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#7C3AED] to-purple-500 flex items-center justify-center text-white">
            <Zap size={13} className="fill-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
            SOLITX
          </span>
        </Link>

        {/* Current Active Chapter Tag on Mobile */}
        <div className="flex-1 px-3 truncate text-center">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
            {currentItem.day ? `${currentItem.day}: ` : ''}{currentItem.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={17} />
          </button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER & BACKDROP OVERLAY ─── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl flex flex-col bg-[#f8fafc] dark:bg-[#09090b] border-r border-slate-200 dark:border-slate-800">
            {renderSidebar(true)}
          </div>
        </div>
      )}

      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-800/80 shrink-0 sticky top-0 h-screen transition-colors duration-200">
        {renderSidebar(false)}
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:px-8 sm:py-10 md:p-12 lg:p-14 flex flex-col min-w-0 overflow-x-hidden">
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>

        {/* Prev / Next Pagination Controls */}
        <div className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          {prevPage ? (
            <Link
              to={prevPage.path}
              className="flex flex-col gap-1 group w-full sm:w-1/2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 no-underline transition-all bg-white dark:bg-[#0c0c0e] shadow-xs hover:shadow-sm"
            >
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-[#7C3AED] transition-colors">
                <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                Previous Chapter
              </span>
              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {prevPage.label}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block sm:w-1/2" />
          )}

          {nextPage ? (
            <Link
              to={nextPage.path}
              className="flex flex-col items-end text-right gap-1 group w-full sm:w-1/2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#7C3AED] dark:hover:border-purple-500 no-underline transition-all bg-white dark:bg-[#0c0c0e] shadow-xs hover:shadow-sm"
            >
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-[#7C3AED] transition-colors">
                Next Chapter
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
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
