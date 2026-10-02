import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { Sun, Moon, Menu, X, ArrowRight, ArrowLeft } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Core Idea' },
  { path: '/requirements', label: 'Day 2: Requirements' },
  { path: '/day-3-estimation', label: 'Day 3: Capacity Estimation' },
  { path: '/day-4-foundation', label: 'Day 4: Foundation' },
  { path: '/day-5-rate-limiting', label: 'Day 5: Rate Limiting' },
  { path: '/day-6-database', label: 'Day 6: Database Design' },
];

export default function Layout() {
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to dark theme
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Apply dark class to HTML element based on state
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close mobile menu automatically when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0); // Scroll to top on page change
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Figure out Pagination (Next / Prev pages)
  const currentIndex = NAV_ITEMS.findIndex(item => item.path === (location.pathname.endsWith('/') && location.pathname.length > 1 ? location.pathname.slice(0, -1) : location.pathname));
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  const prevPage = activeIndex > 0 ? NAV_ITEMS[activeIndex - 1] : null;
  const nextPage = activeIndex < NAV_ITEMS.length - 1 ? NAV_ITEMS[activeIndex + 1] : null;

  const SidebarContent = () => (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="font-semibold text-lg tracking-tight text-black dark:text-white">
          SOLITX Docs
        </div>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-[#27272a] text-[#666] dark:text-[#a1a1aa] transition-colors"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <nav className="space-y-4 flex-1">
        <div>
          <div className="text-[13px] font-semibold text-[#666] dark:text-[#888] mb-3 uppercase tracking-wider">
            Case Studies
          </div>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-3 py-1.5 text-[14px] rounded-md transition-colors ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-[#444] dark:text-[#a1a1aa] hover:bg-gray-100 dark:hover:bg-[#27272a]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-200">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#eaeaea] dark:border-[#27272a] bg-[#fcfcfc] dark:bg-[#111111] sticky top-0 z-20">
        <div className="font-semibold text-lg tracking-tight text-black dark:text-white">
          SOLITX
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#27272a] text-[#666] dark:text-[#a1a1aa]"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-[#27272a] text-[#666] dark:text-[#a1a1aa]"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] z-10 bg-[#fcfcfc] dark:bg-[#111111] border-t border-[#eaeaea] dark:border-[#27272a] overflow-y-auto">
          <SidebarContent />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-[#eaeaea] dark:border-[#27272a] bg-[#fcfcfc] dark:bg-[#111111] shrink-0 sticky top-0 h-screen overflow-y-auto transition-colors duration-200">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 lg:p-16 flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Pagination / Next Page Navigation */}
        <div className="mt-16 pt-8 border-t border-[#eaeaea] dark:border-[#27272a] flex flex-col sm:flex-row gap-4 justify-between">
          {prevPage ? (
            <Link
              to={prevPage.path}
              className="flex flex-col gap-1 group w-full sm:w-1/2 p-4 rounded-xl border border-[#eaeaea] dark:border-[#27272a] hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <span className="text-[13px] text-[#666] dark:text-[#888] flex items-center gap-1">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Previous
              </span>
              <span className="font-medium text-black dark:text-white">
                {prevPage.label}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block sm:w-1/2" />
          )}

          {nextPage ? (
            <Link
              to={nextPage.path}
              className="flex flex-col items-end text-right gap-1 group w-full sm:w-1/2 p-4 rounded-xl border border-[#eaeaea] dark:border-[#27272a] hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <span className="text-[13px] text-[#666] dark:text-[#888] flex items-center gap-1">
                Next
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="font-medium text-black dark:text-white">
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
