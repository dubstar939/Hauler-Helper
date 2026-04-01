import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  BrokerContact, 
  EmailTemplate, 
  SavedSearch, 
  Task, 
  FollowUpSequence 
} from '../../types';
import { 
  MOCK_BROKERS, 
  DB_STORAGE_KEY, 
  TEMPLATE_STORAGE_KEY, 
  SEARCH_STORAGE_KEY, 
  TASK_STORAGE_KEY, 
  AUTOMATION_STORAGE_KEY 
} from '../../constants';
import { supabase } from '../supabase';
import { useGlobal } from './GlobalContext';

interface DatabaseContextType {
  brokerList: BrokerContact[];
  setBrokerList: React.Dispatch<React.SetStateAction<BrokerContact[]>>;
  templates: EmailTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  savedSearches: SavedSearch[];
  setSavedSearches: React.Dispatch<React.SetStateAction<SavedSearch[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  sequences: FollowUpSequence[];
  setSequences: React.Dispatch<React.SetStateAction<FollowUpSequence[]>>;
  
  // Persistence Actions
  syncWithRemote: () => Promise<void>;
  isSyncing: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useGlobal();
  const [isSyncing, setIsSyncing] = useState(false);

  const [brokerList, setBrokerList] = useState<BrokerContact[]>(() => {
    let initialList = MOCK_BROKERS;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) initialList = parsed;
        } catch (e) { console.error(e); }
      }
    }
    return initialList;
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return [];
  });

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SEARCH_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TASK_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return [];
  });

  const [sequences, setSequences] = useState<FollowUpSequence[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AUTOMATION_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return [];
  });

  const syncWithRemote = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Example: Syncing brokers
      const { data, error } = await supabase.from('brokers').select('*');
      if (error) throw error;
      if (data) setBrokerList(data);
      showToast('Data synced with cloud', 'success');
    } catch (error: any) {
      console.error('Sync error:', error);
      showToast('Cloud sync failed. Using local data.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  // Local Persistence
  useEffect(() => {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(brokerList));
  }, [brokerList]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(savedSearches));
  }, [savedSearches]);

  useEffect(() => {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(AUTOMATION_STORAGE_KEY, JSON.stringify(sequences));
  }, [sequences]);

  const value = {
    brokerList, setBrokerList,
    templates, setTemplates,
    savedSearches, setSavedSearches,
    tasks, setTasks,
    sequences, setSequences,
    syncWithRemote,
    isSyncing
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
