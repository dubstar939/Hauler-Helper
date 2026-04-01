import React from 'react';
import { 
  Search, 
  MapPin, 
  Building2, 
  Hash, 
  Info, 
  RotateCcw, 
  Bookmark,
  ChevronDown,
  Globe,
  Database,
  Zap
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useHaulerHunter } from '../hooks/useHaulerHunter';
import { cn } from '../lib/utils';
import { HaulerType } from '../../types';

export const SearchPanel: React.FC = () => {
  const {
    location, setLocation,
    facilityAddress, setFacilityAddress,
    currentHaulerName, setCurrentHaulerName,
    clientRef, setClientRef,
    accountInfo, setAccountInfo,
    isSearching,
    searchStatus,
    searchPhase,
    handleResetFilters,
    haulerTypeFilter, setHaulerTypeFilter,
    showToast
  } = useGlobal();

  const { handleLocalSearch, handleDeepSearch, handleUSWideSearch } = useHaulerHunter();

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white";
  const labelClasses = "block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Location & Address */}
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Target Market (City, State)</label>
              <div className="relative group">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Belleville, IL"
                  className={inputClasses}
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Facility Address</label>
              <div className="relative group">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={facilityAddress}
                  onChange={(e) => setFacilityAddress(e.target.value)}
                  placeholder="123 Industrial Way"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Client & Account Info */}
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Client Reference ID</label>
              <div className="relative group">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={clientRef}
                  onChange={(e) => setClientRef(e.target.value)}
                  placeholder="xxxx.xxxx.xxxxx"
                  className={inputClasses}
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Account Info (Name/Acc#)</label>
              <div className="relative group">
                <Info size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={accountInfo}
                  onChange={(e) => setAccountInfo(e.target.value)}
                  placeholder="ACCOUNT NAME (ACC #)"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Current Hauler & Type */}
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Current Hauler Name</label>
              <div className="relative group">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={currentHaulerName}
                  onChange={(e) => setCurrentHaulerName(e.target.value)}
                  placeholder="e.g. Waste Management"
                  className={inputClasses}
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Partner Category</label>
              <div className="relative group">
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={haulerTypeFilter}
                  onChange={(e) => setHaulerTypeFilter(e.target.value as any)}
                  className={cn(inputClasses, "appearance-none pr-10")}
                >
                  <option value="all">All Categories</option>
                  <option value={HaulerType.CURRENT}>Current Partners</option>
                  <option value={HaulerType.NEW}>New Opportunities</option>
                  <option value={HaulerType.CLIENT}>Client Issues</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-end gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleLocalSearch}
                disabled={!location || isSearching}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
              >
                <Database size={16} />
                Local
              </button>
              <button
                onClick={handleDeepSearch}
                disabled={!location || isSearching}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                <Search size={16} />
                Deep
              </button>
            </div>
            <button
              onClick={handleUSWideSearch}
              disabled={isSearching}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-95"
            >
              <Globe size={16} />
              Nationwide Scan
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-500 hover:text-red-500 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                onClick={() => showToast("Search criteria bookmarked.")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-500 hover:text-indigo-600 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Bookmark size={14} />
                Save
              </button>
            </div>
          </div>
        </div>

        {isSearching && (
          <div className="mt-6 flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 animate-pulse">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
              {searchStatus || "Scanning network..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
