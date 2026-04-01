import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Hauler, 
  HaulerStatus, 
  HaulerType, 
  BrokerContact, 
  EmailTemplate, 
  SavedSearch, 
  Task, 
  TaskStatus, 
  TaskPriority, 
  ThemeConfig, 
  FollowUpSequence,
  SortConfig,
  SortKey,
  Placeholder
} from '../../types';
import { 
  MOCK_BROKERS, 
  DB_STORAGE_KEY, 
  TEMPLATE_STORAGE_KEY, 
  SEARCH_STORAGE_KEY, 
  TASK_STORAGE_KEY, 
  THEME_STORAGE_KEY, 
  AUTOMATION_STORAGE_KEY,
  PLACEHOLDERS,
  SENDER_EMAIL
} from '../../constants';
import { supabase } from '../supabase';
import { normalizeEmail, normalizeHaulerName, extractState } from '../lib/utils';

interface GlobalContextType {
  // State
  location: string;
  setLocation: (loc: string) => void;
  facilityAddress: string;
  setFacilityAddress: (addr: string) => void;
  currentHaulerName: string;
  setCurrentHaulerName: (name: string) => void;
  clientRef: string;
  setClientRef: (ref: string) => void;
  accountInfo: string;
  setAccountInfo: (info: string) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  searchStatus: string;
  setSearchStatus: (status: string) => void;
  searchPhase: number;
  setSearchPhase: (phase: number) => void;
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
  themeConfig: ThemeConfig;
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  toggleDarkMode: () => void;
  sortConfig: SortConfig;
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>;
  haulerTypeFilter: 'all' | HaulerType;
  setHaulerTypeFilter: (filter: 'all' | HaulerType) => void;
  serviceAreaFilter: string;
  setServiceAreaFilter: (filter: string) => void;
  stateFilter: string;
  setStateFilter: (filter: string) => void;
  contactSearchQuery: string;
  setContactSearchQuery: (query: string) => void;
  sourceFilter: 'all' | 'Search' | 'Broker List';
  setSourceFilter: (filter: 'all' | 'Search' | 'Broker List') => void;
  selectedHaulerIds: Set<string>;
  setSelectedHaulerIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Actions
  handleSort: (key: SortKey) => void;
  toggleHaulerSelection: (id: string) => void;
  toggleAllHaulers: (haulersToSelect: string[]) => void;
  handleResetFilters: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [currentHaulerName, setCurrentHaulerName] = useState('');
  const [clientRef, setClientRef] = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [searchPhase, setSearchPhase] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [haulerTypeFilter, setHaulerTypeFilter] = useState<'all' | HaulerType>('all');
  const [serviceAreaFilter, setServiceAreaFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'Search' | 'Broker List'>('all');
  const [selectedHaulerIds, setSelectedHaulerIds] = useState<Set<string>>(new Set());

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return {
      primaryColor: '#4f46e5',
      fontFamily: 'Inter',
      companyName: 'Hauler Hunter'
    };
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Actions
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    if (!message) {
      setToast(null);
      return;
    }
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const toggleHaulerSelection = useCallback((id: string) => {
    setSelectedHaulerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllHaulers = useCallback((haulersToSelect: string[]) => {
    setSelectedHaulerIds(prev => {
      const allSelected = haulersToSelect.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        haulersToSelect.forEach(id => next.delete(id));
        return next;
      } else {
        const next = new Set(prev);
        haulersToSelect.forEach(id => next.add(id));
        return next;
      }
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setLocation('');
    setFacilityAddress('');
    setCurrentHaulerName('');
    setClientRef('');
    setAccountInfo('');
    setServiceAreaFilter('');
    setStateFilter('');
    setHaulerTypeFilter('all');
    setContactSearchQuery('');
    setSearchPhase(0);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfig));
    document.documentElement.style.setProperty('--primary-color', themeConfig.primaryColor);
    document.documentElement.style.setProperty('--font-family', themeConfig.fontFamily);
  }, [themeConfig]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const value = {
    location, setLocation,
    facilityAddress, setFacilityAddress,
    currentHaulerName, setCurrentHaulerName,
    clientRef, setClientRef,
    accountInfo, setAccountInfo,
    isSearching, setIsSearching,
    searchStatus, setSearchStatus,
    searchPhase, setSearchPhase,
    viewMode, setViewMode,
    themeConfig, setThemeConfig,
    isDarkMode, setIsDarkMode,
    toast, showToast,
    toggleDarkMode,
    sortConfig, setSortConfig,
    haulerTypeFilter, setHaulerTypeFilter,
    serviceAreaFilter, setServiceAreaFilter,
    stateFilter, setStateFilter,
    contactSearchQuery, setContactSearchQuery,
    sourceFilter, setSourceFilter,
    selectedHaulerIds, setSelectedHaulerIds,
    handleSort,
    toggleHaulerSelection,
    toggleAllHaulers,
    handleResetFilters
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
