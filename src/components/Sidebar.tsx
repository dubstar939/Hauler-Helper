import React from 'react';
import { 
  Search, 
  Database, 
  FileText, 
  CheckSquare, 
  Settings, 
  Zap, 
  Moon, 
  Sun,
  LayoutGrid,
  Map as MapIcon,
  PlusCircle,
  Bookmark,
  Bell
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  onOpenDb: () => void;
  onOpenTemplates: () => void;
  onOpenTasks: () => void;
  onOpenBranding: () => void;
  onOpenAutomation: () => void;
  onOpenSavedSearches: () => void;
  upcomingTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenDb,
  onOpenTemplates,
  onOpenTasks,
  onOpenBranding,
  onOpenAutomation,
  onOpenSavedSearches,
  upcomingTasksCount
}) => {
  const { 
    isDarkMode, 
    setIsDarkMode, 
    viewMode, 
    setViewMode,
    themeConfig
  } = useGlobal();

  const navItems = [
    { icon: Database, label: 'Database', onClick: onOpenDb },
    { icon: FileText, label: 'Templates', onClick: onOpenTemplates },
    { icon: CheckSquare, label: 'Tasks', onClick: onOpenTasks, badge: upcomingTasksCount },
    { icon: Bookmark, label: 'Saved Searches', onClick: onOpenSavedSearches },
    { icon: Zap, label: 'Automation', onClick: onOpenAutomation },
    { icon: Settings, label: 'Branding', onClick: onOpenBranding },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        {themeConfig.logoUrl ? (
          <img src={themeConfig.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <LayoutGrid size={20} />
          </div>
        )}
        <h1 className="font-bold text-xl text-gray-900 dark:text-white truncate">
          {themeConfig.companyName}
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
          <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            View Mode
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                viewMode === 'list' 
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              <LayoutGrid size={16} />
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                viewMode === 'map' 
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              <MapIcon size={16} />
              Map
            </button>
          </div>
        </div>

        <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Management
        </p>
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-indigo-400 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className="group-hover:scale-110 transition-transform" />
              {item.label}
            </div>
            {item.badge ? (
              <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
};
