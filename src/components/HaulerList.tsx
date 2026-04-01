import React from 'react';
import { 
  Mail, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Check,
  ChevronUp,
  ChevronDown,
  Plus,
  Send,
  FileText
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useDatabase } from '../context/DatabaseContext';
import { Hauler, HaulerStatus, HaulerType } from '../../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface HaulerCardProps {
  hauler: Hauler;
  onSelect: () => void;
  onDraft: () => void;
  onDelete: () => void;
  onAddTask: () => void;
}

const HaulerCard: React.FC<HaulerCardProps> = ({
  hauler,
  onSelect,
  onDraft,
  onDelete,
  onAddTask
}) => {
  const { selectedHaulerIds, toggleHaulerSelection } = useGlobal();
  const isSelected = selectedHaulerIds.has(hauler.id);

  const statusColors = {
    [HaulerStatus.DRAFT]: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    [HaulerStatus.SENT]: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    [HaulerStatus.REPLIED]: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  };

  const typeColors = {
    [HaulerType.CURRENT]: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    [HaulerType.NEW]: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    [HaulerType.CLIENT]: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group bg-white dark:bg-gray-900 border rounded-2xl p-5 transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 relative overflow-hidden",
        isSelected ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-gray-100 dark:border-gray-800"
      )}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); toggleHaulerSelection(hauler.id); }}
          className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
            isSelected 
              ? "bg-indigo-600 border-indigo-600 text-white" 
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 group-hover:border-indigo-400"
          )}
        >
          {isSelected && <Check size={14} strokeWidth={3} />}
        </button>
      </div>

      <div className="pl-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                {hauler.name}
              </h3>
              <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider", typeColors[hauler.type])}>
                {hauler.type}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                {hauler.location}
              </div>
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-gray-400" />
                {hauler.email}
              </div>
            </div>
          </div>
          <div className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider flex items-center gap-1.5", statusColors[hauler.status])}>
            {hauler.status === HaulerStatus.SENT && <CheckCircle2 size={12} />}
            {hauler.status === HaulerStatus.DRAFT && <Clock size={12} />}
            {hauler.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Last Action</p>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              <Calendar size={14} className="text-indigo-500" />
              {hauler.lastActionDate || 'No actions yet'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Source</p>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {hauler.contactSource}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDraft}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Send size={14} />
            Draft Email
          </button>
          <button
            onClick={onAddTask}
            className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all active:scale-95"
            title="Add Task"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all active:scale-95"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const HaulerList: React.FC<{
  onDraft: (h: Hauler) => void;
  onAddTask: (h: Hauler) => void;
}> = ({ onDraft, onAddTask }) => {
  const { 
    sortConfig, 
    handleSort,
    sourceFilter, setSourceFilter,
    contactSearchQuery, setContactSearchQuery,
    haulerTypeFilter, setHaulerTypeFilter,
    selectedHaulerIds,
    toggleAllHaulers
  } = useGlobal();

  const { haulers, handleDeleteHauler: baseDeleteHauler } = useDatabase();
  const { showToast } = useGlobal();

  const handleDeleteHauler = (hauler: Hauler) => {
    baseDeleteHauler(hauler);
    showToast(`Removed "${hauler.name}".`);
  };

  const sortedHaulers = React.useMemo(() => {
    let items = [...haulers];
    if (sourceFilter !== 'all') items = items.filter(h => h.contactSource === sourceFilter);
    if (haulerTypeFilter !== 'all') items = items.filter(h => h.type === haulerTypeFilter);
    if (contactSearchQuery.trim()) {
      const q = contactSearchQuery.toLowerCase().trim();
      items = items.filter(h => 
        (h.name?.toLowerCase() || "").includes(q) || 
        (h.email?.toLowerCase() || "").includes(q)
      );
    }
    items.sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';
      if (sortConfig.key === 'lastActionDate') {
        return sortConfig.direction === 'asc' 
          ? new Date(valA).getTime() - new Date(valB).getTime() 
          : new Date(valB).getTime() - new Date(valA).getTime();
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [haulers, sortConfig, sourceFilter, contactSearchQuery, haulerTypeFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            Search Results
            <span className="text-sm font-bold px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
              {sortedHaulers.length}
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and contact your waste partners</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleAllHaulers(sortedHaulers.map(h => h.id))}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
              sortedHaulers.length > 0 && sortedHaulers.every(h => selectedHaulerIds.has(h.id))
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            <Check size={14} />
            {sortedHaulers.length > 0 && sortedHaulers.every(h => selectedHaulerIds.has(h.id)) ? "Deselect All" : "Select All"}
          </button>
          <div className="relative">
            <input
              type="text"
              value={contactSearchQuery}
              onChange={(e) => setContactSearchQuery(e.target.value)}
              placeholder="Filter results..."
              className="pl-4 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white w-64"
            />
          </div>
          <button
            onClick={() => handleSort('name')}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Sort by Name"
          >
            {sortConfig.key === 'name' && sortConfig.direction === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedHaulerIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-gray-800"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-gray-800">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">
                {selectedHaulerIds.size}
              </div>
              <span className="text-sm font-bold uppercase tracking-wider">Selected</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const firstSelected = sortedHaulers.find(h => selectedHaulerIds.has(h.id));
                  if (firstSelected) onDraft(firstSelected);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <Send size={14} />
                Bulk Email
              </button>
              <button 
                onClick={() => {
                  sortedHaulers
                    .filter(h => selectedHaulerIds.has(h.id))
                    .forEach(h => onAddTask(h));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <Plus size={14} />
                Bulk Tasks
              </button>
              <button 
                onClick={() => toggleAllHaulers([])}
                className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest ml-2"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sortedHaulers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
            <Mail size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No results found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search criteria or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {sortedHaulers.map((hauler) => (
              <HaulerCard
                key={hauler.id}
                hauler={hauler}
                onSelect={() => {}}
                onDraft={() => onDraft(hauler)}
                onDelete={() => handleDeleteHauler(hauler)}
                onAddTask={() => onAddTask(hauler)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
