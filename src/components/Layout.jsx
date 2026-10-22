import { useEffect, useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const NAVIGATION_SECTIONS = [
  {
    id: 'blueprint',
    title: 'Blueprint & Architecture',
    items: [
      { path: '/', label: 'Core Philosophy', day: null },
      { path: '/requirements', label: 'System Requirements', day: null },
      { path: '/day-3-estimation', label: 'Capacity Estimation', day: '03' },
    ]
  },
  {
    id: 'monolith',
    title: 'Phase I: Monolith & Database',
    items: [
      { path: '/day-4-foundation', label: 'Monolith Foundation', day: '04' },
      { path: '/day-5-rate-limiting', label: 'In-Memory Rate Limiting', day: '05' },
      { path: '/day-6-database', label: 'Database Schema & Design', day: '06' },
      { path: '/day-7-indexing', label: 'PostgreSQL Indexing', day: '07' },
      { path: '/day-8-load-testing', label: 'Load Testing & Benchmarks', day: '08' },
      { path: '/day-9-connection-pooling', label: 'Connection Pooling', day: '09' },
      { path: '/day-10-pagination', label: 'Keyset & Cursor Pagination', day: '10' },
    ]
  },
  {
    id: 'caching',
    title: 'Phase II: Distributed Caching',
    items: [
      { path: '/day-11-api-protection', label: 'Distributed API Protection', day: '11' },
      { path: '/day-12-repeated-reads', label: 'Repeated Reads Bottleneck', day: '12' },
      { path: '/day-13-redis', label: 'Redis Cache-Aside Pattern', day: '13' },
      { path: '/day-14-cache-invalidation', label: 'Write-Through Invalidation', day: '14' },
      { path: '/day-15-cache-stampede', label: 'Cache Stampede Prevention', day: '15' },
      { path: '/day-16-distributed-rate-limiting', label: 'Cache Lifecycles & TTLs', day: '16' },
    ]
  },
  {
    id: 'production',
    title: 'Phase III: Production Workflows',
    items: [
      { path: '/day-17-oauth-usernames', label: 'OAuth 2.0 & Custom Handles', day: '17' },
      { path: '/day-18-feed-post-lifecycle', label: 'Post Lifecycle & Feed Reads', day: '18' },
    ]
  },
  {
    id: 'scale',
    title: 'Phase IV: Horizontal Scale',
    items: [
      { path: '/day-19-server-bottleneck', label: 'Single Server Resource Ceiling', day: '19' },
      { path: '/day-21-connection-pooling', label: 'Pooled Connections Under Scale', day: '21' },
      { path: '/day-22-statelessness-audit', label: 'Statelessness & Fault Injection', day: '22' },
      { path: '/day-23-scaling-experiment', label: 'Scaling Experiment (1 vs 2 vs 3)', day: '23' },
    ]
  },
  {
    id: 'async',
    title: 'Phase V: Asynchronous Processing',
    items: [
      { path: '/day-24-synchronous-audit', label: 'Synchronous Work Audit', day: '24' },
      { path: '/day-25-background-jobs', label: 'Background Jobs & Queue', day: '25' },
    ]
  }
];

export default function Layout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 select-none">
      {/* ─── BRAND HEADER ─── */}
      <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group no-underline"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs tracking-tighter">
              S
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-white leading-tight">
                SOLITX
              </div>
              <div className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                Architecture Journey
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {/* ─── SEARCH INPUT ─── */}
        <div className="mt-3 relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation..."
            className="w-full text-[13px] font-normal pl-8 pr-8 py-1.5 rounded-md bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* ─── NAVIGATION TREE ─── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 text-[13px] overscroll-contain">
        {filteredSections.length === 0 ? (
          <div className="text-center py-10 px-4 text-zinc-400">
            <p className="text-[13px] mb-2 font-normal">No results found for "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-medium text-zinc-900 dark:text-zinc-200 hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.id}>
              {/* Category Header */}
              <div className="px-2.5 mb-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
                {section.title}
              </div>

              {/* Items List */}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => isMobile && setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-2.5 py-1.5 rounded-md no-underline font-medium text-[13px] leading-snug transition-all ${
                          isActive
                            ? 'tab-3d-black'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center truncate">
                            {item.day ? (
                              <span
                                className={`font-mono text-[11px] w-5 text-right shrink-0 mr-2.5 transition-colors ${
                                  isActive
                                    ? 'text-zinc-300 font-semibold'
                                    : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                                }`}
                              >
                                {item.day}
                              </span>
                            ) : (
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 mr-3 transition-colors ${
                                  isActive
                                    ? 'bg-white'
                                    : 'bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-500'
                                }`}
                              />
                            )}
                            <span className={`truncate whitespace-nowrap ${isActive ? 'text-white' : ''}`}>
                              {item.label}
                            </span>
                          </div>

                          {isActive && (
                            <ChevronRight size={13} className="text-zinc-400 shrink-0 ml-1.5" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      {/* ─── FOOTER ─── */}
      <div className="p-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <span>Day 25 of 78 Completed</span>
          <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">32.1%</span>
        </div>
        <div className="w-full h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200 transition-all duration-300"
            style={{ width: '32.1%' }}
          />
        </div>

        <div className="pt-1 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <a
            href="https://solitx.soumya.site"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors no-underline"
          >
            <span>Live App</span>
            <ExternalLink size={10} />
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <a
            href="https://github.com/SoumyaranjanDS/SOLITX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors no-underline"
          >
            <span>GitHub</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-[#09090b] transition-colors duration-200">
      {/* ─── MOBILE STICKY TOP NAVBAR ─── */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
            S
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-white">
            SOLITX
          </span>
        </Link>

        {/* Current Active Chapter Tag on Mobile */}
        <div className="flex-1 px-3 truncate text-center">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
            {currentItem.day ? `${currentItem.day} · ` : ''}{currentItem.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={17} />
          </button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER & BACKDROP OVERLAY ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Fade In / Fade Out */}
            <motion.div 
              key="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Sidebar Slide In / Slide Out */}
            <motion.div 
              key="mobile-drawer-sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative z-10 w-72 max-w-[85vw] h-full shadow-xl flex flex-col bg-[#fafafa] dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-zinc-800"
            >
              {renderSidebar(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:block w-64 border-r border-zinc-200 dark:border-zinc-800/80 shrink-0 sticky top-0 h-screen transition-colors duration-200">
        {renderSidebar(false)}
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:px-8 sm:py-10 md:p-12 lg:p-14 flex flex-col min-w-0 overflow-x-hidden">
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>

        {/* Prev / Next Pagination Controls */}
        <div className="mt-14 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between">
          {prevPage ? (
            <Link
              to={prevPage.path}
              className="flex flex-col gap-1 group w-full sm:w-1/2 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 no-underline transition-colors bg-white dark:bg-[#0c0c0e]"
            >
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                <ArrowLeft size={11} className="group-hover:-translate-x-1 transition-transform" />
                Previous Chapter
              </span>
              <span className="font-medium text-[13px] text-zinc-900 dark:text-white truncate">
                {prevPage.label}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block sm:w-1/2" />
          )}

          {nextPage ? (
            <Link
              to={nextPage.path}
              className="flex flex-col items-end text-right gap-1 group w-full sm:w-1/2 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 no-underline transition-colors bg-white dark:bg-[#0c0c0e]"
            >
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                Next Chapter
                <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="font-medium text-[13px] text-zinc-900 dark:text-white truncate">
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
