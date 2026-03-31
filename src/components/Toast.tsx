import React from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobal } from '../context/GlobalContext';
import { cn } from '../lib/utils';

export const Toast: React.FC = () => {
  const { toast, showToast } = useGlobal();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border min-w-[300px]",
              toast.type === 'success' ? "bg-white dark:bg-gray-900 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400" :
              toast.type === 'error' ? "bg-white dark:bg-gray-900 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400" :
              "bg-white dark:bg-gray-900 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              toast.type === 'success' ? "bg-green-50 dark:bg-green-900/20" :
              toast.type === 'error' ? "bg-red-50 dark:bg-red-900/20" :
              "bg-indigo-50 dark:bg-indigo-900/20"
            )}>
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            
            <p className="text-sm font-black flex-1">{toast.message}</p>
            
            <button 
              onClick={() => showToast('')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
