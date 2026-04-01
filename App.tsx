import React, { useState, useCallback, useMemo } from 'react';
import { useGlobal } from './src/context/GlobalContext';
import { useDatabase } from './src/context/DatabaseContext';
import { Sidebar } from './src/components/Sidebar';
import { SearchPanel } from './src/components/SearchPanel';
import { HaulerList } from './src/components/HaulerList';
import { HaulerMap } from './src/components/HaulerMap';
import { EmailDraftModal } from './src/components/EmailDraftModal';
import { DatabaseModal } from './src/components/DatabaseModal';
import { TemplateModal } from './src/components/TemplateModal';
import { TaskModal } from './src/components/TaskModal';
import { BrandingModal } from './src/components/BrandingModal';
import { AutomationModal } from './src/components/AutomationModal';
import { Toast } from './src/components/Toast';
import { Hauler, TaskStatus, TaskPriority } from './types';
import { AnimatePresence, motion } from 'motion/react';

const App: React.FC = () => {
  const { 
    viewMode, 
    showToast,
    themeConfig
  } = useGlobal();

  const { tasks, setTasks } = useDatabase();

  // Modal States
  const [activeHaulerForDraft, setActiveHaulerForDraft] = useState<Hauler | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isSavedSearchesModalOpen, setIsSavedSearchesModalOpen] = useState(false);

  const upcomingTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === TaskStatus.PENDING).length;
  }, [tasks]);

  const handleAddTask = useCallback((hauler: Hauler) => {
    const newTask = {
      id: crypto.randomUUID(),
      title: `Follow up with ${hauler.name}`,
      description: `Follow up regarding waste services for ${hauler.location}`,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      haulerId: hauler.id,
      haulerName: hauler.name
    };
    setTasks([newTask, ...tasks]);
    showToast(`Task created for ${hauler.name}`, 'success');
  }, [tasks, setTasks, showToast]);

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-950 flex"
      style={{ fontFamily: themeConfig.fontFamily }}
    >
      {/* Sidebar Navigation */}
      <Sidebar 
        onOpenDb={() => setIsDbModalOpen(true)}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenTasks={() => setIsTaskModalOpen(true)}
        onOpenBranding={() => setIsBrandingModalOpen(true)}
        onOpenAutomation={() => setIsAutomationModalOpen(true)}
        onOpenSavedSearches={() => setIsSavedSearchesModalOpen(true)}
        upcomingTasksCount={upcomingTasksCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Search Panel */}
        <SearchPanel />

        {/* Dynamic Content View */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {viewMode === 'list' ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <HaulerList 
                  onDraft={(h) => setActiveHaulerForDraft(h)}
                  onAddTask={handleAddTask}
                />
              </motion.div>
            ) : (
              <motion.div
                key="map"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <HaulerMap 
                  onDraft={(h) => setActiveHaulerForDraft(h)}
                  onAddTask={handleAddTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {activeHaulerForDraft && (
          <EmailDraftModal 
            hauler={activeHaulerForDraft} 
            onClose={() => setActiveHaulerForDraft(null)} 
          />
        )}
      </AnimatePresence>

      <DatabaseModal 
        isOpen={isDbModalOpen} 
        onClose={() => setIsDbModalOpen(false)} 
      />

      <TemplateModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)} 
      />

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
      />

      <BrandingModal 
        isOpen={isBrandingModalOpen} 
        onClose={() => setIsBrandingModalOpen(false)} 
      />

      <AutomationModal 
        isOpen={isAutomationModalOpen} 
        onClose={() => setIsAutomationModalOpen(false)} 
      />

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
};

export default App;
