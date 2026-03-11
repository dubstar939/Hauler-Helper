
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon, 
  EnvelopeIcon, 
  CheckCircleIcon, 
  TrashIcon, 
  MapPinIcon, 
  PaperClipIcon, 
  XMarkIcon, 
  CheckBadgeIcon, 
  InformationCircleIcon, 
  LinkIcon, 
  ArrowTopRightOnSquareIcon, 
  ArrowUpOnSquareStackIcon, 
  ServerIcon, 
  SunIcon, 
  MoonIcon, 
  SparklesIcon, 
  CircleStackIcon, 
  EyeIcon, 
  PencilSquareIcon, 
  UserIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  BarsArrowDownIcon, 
  PlusIcon, 
  FunnelIcon,
  DocumentPlusIcon,
  CpuChipIcon,
  TagIcon,
  GlobeAltIcon,
  GlobeAmericasIcon,
  ExclamationTriangleIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentIcon,
  UserGroupIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  DocumentIcon,
  UserPlusIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  CircleStackIcon as CircleStackIconSolid,
  CheckIcon,
  PencilIcon,
  BookmarkIcon,
  ClockIcon,
  KeyIcon,
  ListBulletIcon,
  CommandLineIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import L from 'leaflet';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Hauler, HaulerStatus, HaulerType, BrokerContact, HaulerAttachment, SearchResult, EmailTemplate, SavedSearch } from './types';
import { MOCK_BROKERS, BID_TEMPLATE_CURRENT, BID_TEMPLATE_NEW, EMAIL_SIGNATURE } from './constants';

const SENDER_EMAIL = "chrisw@wasteexperts.com";
const DB_STORAGE_KEY = 'hauler_hunter_db_v1';
const TEMPLATE_STORAGE_KEY = 'hauler_hunter_templates_v1';
const SEARCH_STORAGE_KEY = 'hauler_hunter_saved_searches_v1';

const PLACEHOLDERS = [
  { key: '{haulerName}', label: 'Hauler Name' },
  { key: '{address}', label: 'Address' },
  { key: '{location}', label: 'City/State' },
  { key: '{clientRef}', label: 'Client Ref' },
  { key: '{accountInfo}', label: 'Account Info' },
  { key: '{signature}', label: 'Signature' },
];

type SortKey = 'name' | 'status' | 'type' | 'lastActionDate';
interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 't-default-current',
    name: 'Standard Retain Bid',
    category: HaulerType.CURRENT,
    subject: 'Retaining Bid for Client {clientRef} - {haulerName}',
    content: BID_TEMPLATE_CURRENT
  },
  {
    id: 't-default-new',
    name: 'New Site RFP',
    category: HaulerType.NEW,
    subject: 'New Price Opportunity - Waste & Recycling Services - {address}',
    content: BID_TEMPLATE_NEW
  }
];

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Extracts a 2-letter state code from a location string (e.g., "Belleville, IL" -> "IL")
 */
const extractState = (loc: string): string | null => {
  if (!loc) return null;
  // Look for 2-letter uppercase words or words after a comma
  const parts = loc.split(/[\s,]+/);
  for (const part of parts) {
    if (part.length === 2 && /^[A-Z]{2}$/i.test(part)) {
      return part.toUpperCase();
    }
  }
  return null;
};

/**
 * Utility to convert HTML from Quill to Plain Text for Outlook mailto: links
 */
const htmlToPlainText = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Basic line break handling for common block elements
  const blocks = temp.querySelectorAll('p, div, li, br');
  blocks.forEach(block => {
    if (block.tagName === 'BR') {
      block.after('\n');
    } else {
      block.after('\n');
    }
  });

  return temp.textContent || temp.innerText || "";
};

const App: React.FC = () => {
  const [location, setLocation] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [currentHaulerName, setCurrentHaulerName] = useState('');
  const [clientRef, setClientRef] = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [searchPhase, setSearchPhase] = useState<number>(0);
  const [haulers, setHaulers] = useState<Hauler[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [globalDbSearchQuery, setGlobalDbSearchQuery] = useState('');
  const [showDbSearchResults, setShowDbSearchResults] = useState(false);
  const [haulerTypeFilter, setHaulerTypeFilter] = useState<'all' | HaulerType>('all');
  const [serviceAreaFilter, setServiceAreaFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return DEFAULT_TEMPLATES;
  });

  const [brokerList, setBrokerList] = useState<BrokerContact[]>(() => {
    let initialList = MOCK_BROKERS;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initialList = parsed;
          }
        } catch (e) { console.error("Failed to parse saved database", e); }
      }
    }
    return initialList.filter(b => b.brokerEmail && b.brokerEmail.trim() !== '');
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
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  const [selectedHauler, setSelectedHauler] = useState<Hauler | null>(null);
  const [isAddingHauler, setIsAddingHauler] = useState(false);
  const [newHaulerData, setNewHaulerData] = useState<BrokerContact>({
    haulerName: '',
    brokerEmail: '',
    secondaryEmail: '',
    notes: '',
    states: []
  });

  const [isDrafting, setIsDrafting] = useState(false);
  const [isManagingDb, setIsManagingDb] = useState(false);
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  
  // Database Editing State
  const [editingBrokerIndex, setEditingBrokerIndex] = useState<number | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [editStatesValue, setEditStatesValue] = useState('');

  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [isOutlookConnected, setIsOutlookConnected] = useState(true); 
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [sourceFilter, setSourceFilter] = useState<'all' | 'Search' | 'Broker List'>('all');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [searchRadius, setSearchRadius] = useState<number | ''>('');
  const [globalAttachments] = useState<HaulerAttachment[]>([
    { name: 'Standard_Bid_Template.pdf', size: 245000, type: 'application/pdf' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbSearchRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const savedSearchesRef = useRef<HTMLDivElement>(null);
  const templateSubjectRef = useRef<HTMLInputElement>(null);
  const templateBodyRef = useRef<HTMLTextAreaElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const draftQuillRef = useRef<any>(null);

  const sortedHaulers = useMemo(() => {
    let items = [...haulers];
    if (sourceFilter !== 'all') items = items.filter(h => h.contactSource === sourceFilter);
    if (haulerTypeFilter !== 'all') items = items.filter(h => h.type === haulerTypeFilter);
    if (serviceAreaFilter.trim()) {
      const q = serviceAreaFilter.toLowerCase().trim();
      items = items.filter(h => {
        const brokerEntry = brokerList.find(b => b.brokerEmail === h.email);
        const notes = brokerEntry?.notes?.toLowerCase() || '';
        const states = brokerEntry?.states?.join(' ').toLowerCase() || '';
        return h.location.toLowerCase().includes(q) || notes.includes(q) || states.includes(q);
      });
    }
    if (stateFilter.trim()) {
      const q = stateFilter.toLowerCase().trim();
      items = items.filter(h => {
        const brokerEntry = brokerList.find(b => b.brokerEmail === h.email);
        return brokerEntry?.states?.some(s => s.toLowerCase().includes(q));
      });
    }
    if (contactSearchQuery.trim()) {
      const q = contactSearchQuery.toLowerCase().trim();
      items = items.filter(h => h.name.toLowerCase().includes(q) || h.email.toLowerCase().includes(q));
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
  }, [haulers, sortConfig, sourceFilter, contactSearchQuery, haulerTypeFilter, serviceAreaFilter, brokerList]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrafting(false);
        setIsManagingDb(false);
        setIsManagingTemplates(false);
        setIsAddingHauler(false);
        setEditingTemplate(null);
        setShowDbSearchResults(false);
        setEditingBrokerIndex(null);
        setShowSavedSearches(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    if (mapInstanceRef.current) {
      const tileUrl = isDarkMode 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.setUrl(tileUrl);
        }
      });
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dbSearchRef.current && !dbSearchRef.current.contains(event.target as Node)) {
        setShowDbSearchResults(false);
      }
      if (savedSearchesRef.current && !savedSearchesRef.current.contains(event.target as Node)) {
        setShowSavedSearches(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (viewMode === 'map' && mapContainerRef.current && !mapInstanceRef.current) {
      const initialLat = 39.8283; 
      const initialLng = -98.5795;
      
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 4);
      
      const tileUrl = isDarkMode 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (viewMode !== 'map' && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'map' && mapInstanceRef.current) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const bounds = L.latLngBounds([]);
      let hasPoints = false;

      sortedHaulers.forEach(h => {
        if (h.coordinates) {
          hasPoints = true;
          const marker = L.marker(h.coordinates, {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div class="bg-green-600 w-8 h-8 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })
          }).addTo(mapInstanceRef.current!);

          marker.bindPopup(`
            <div class="p-2">
              <h4 class="font-black text-sm">${h.name}</h4>
              <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">${h.contactSource === 'Search' ? 'Web Search' : 'Broker List'}</p>
              <button id="marker-draft-${h.id}" class="w-full py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 transition">Draft Email</button>
            </div>
          `);

          marker.on('popupopen', () => {
             const btn = document.getElementById(`marker-draft-${h.id}`);
             if (btn) {
               btn.onclick = () => {
                 setSelectedHauler(h);
                 setIsDrafting(true);
               };
             }
          });

          markersRef.current.push(marker);
          bounds.extend(h.coordinates);
        }
      });

      if (hasPoints) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [sortedHaulers, viewMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleResetFilters = useCallback(() => {
    setLocation('');
    setFacilityAddress('');
    setCurrentHaulerName('');
    setClientRef('');
    setAccountInfo('');
    setSearchRadius('');
    setServiceAreaFilter('');
    setStateFilter('');
    setHaulerTypeFilter('all');
    setContactSearchQuery('');
    setSearchPhase(0);
  }, []);

  const handleSaveSearch = () => {
    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      name: location || 'Unnamed Area',
      location,
      facilityAddress,
      currentHaulerName,
      searchRadius,
      haulerTypeFilter,
      serviceAreaFilter,
      stateFilter,
      clientRef,
      accountInfo
    };
    setSavedSearches(prev => [newSearch, ...prev].slice(0, 20)); 
    setImportFeedback("Search criteria bookmarked.");
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const handleLoadSearch = (s: SavedSearch) => {
    setLocation(s.location);
    setFacilityAddress(s.facilityAddress);
    setCurrentHaulerName(s.currentHaulerName);
    setSearchRadius(s.searchRadius);
    setHaulerTypeFilter(s.haulerTypeFilter);
    setServiceAreaFilter(s.serviceAreaFilter);
    setStateFilter(s.stateFilter || '');
    setClientRef(s.clientRef);
    setAccountInfo(s.accountInfo);
    setShowSavedSearches(false);
    setImportFeedback(`Loaded criteria for ${s.name}`);
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const handleDeleteSavedSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  const handleCopyEmail = useCallback((email: string) => {
    navigator.clipboard.writeText(email);
    setImportFeedback("Email copied to clipboard");
    setTimeout(() => setImportFeedback(null), 2000);
  }, []);

  const handleCopyBrokerInfo = useCallback((h: Hauler) => {
    const info = `${h.name} (${h.email})`;
    navigator.clipboard.writeText(info);
    setImportFeedback("Broker info copied: " + h.name);
    setTimeout(() => setImportFeedback(null), 2000);
  }, []);

  const handleAddToDatabase = useCallback((h: Hauler | null) => {
    if (!h) return;
    const isDuplicate = brokerList.some(b => b.brokerEmail.toLowerCase() === h.email.toLowerCase());
    if (isDuplicate) {
      setImportFeedback("Hauler already exists in database.");
      setTimeout(() => setImportFeedback(null), 3000);
      return;
    }
    const newBroker: BrokerContact = {
      haulerName: h.name,
      brokerEmail: h.email,
      notes: `Captured from AI Search in ${h.location}`,
      states: []
    };
    setBrokerList(prev => [...prev, newBroker]);
    setImportFeedback(`Added "${h.name}" to internal database.`);
    setTimeout(() => setImportFeedback(null), 3000);
  }, [brokerList]);

  const filteredDbList = useMemo(() => {
    if (!dbSearchQuery.trim()) return brokerList;
    const q = dbSearchQuery.toLowerCase().trim();
    return brokerList.filter(b => 
      b.haulerName.toLowerCase().includes(q) || 
      b.brokerEmail.toLowerCase().includes(q) ||
      (b.notes?.toLowerCase().includes(q) ?? false) ||
      (b.states?.some(s => s.toLowerCase().includes(q)) ?? false)
    );
  }, [brokerList, dbSearchQuery]);

  const matchingDbBrokers = useMemo(() => {
    if (!globalDbSearchQuery.trim()) return [];
    const q = globalDbSearchQuery.toLowerCase().trim();
    return brokerList.filter(b => 
      b.haulerName.toLowerCase().includes(q) || b.brokerEmail.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [brokerList, globalDbSearchQuery]);

  const updateHaulerField = useCallback((id: string, field: keyof Hauler, value: any) => {
    setHaulers(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h));
    if (selectedHauler?.id === id) {
      setSelectedHauler(prev => prev ? ({ ...prev, [field]: value }) : null);
    }
  }, [selectedHauler]);

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHauler) return;
    const newAttachment: HaulerAttachment = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream'
    };
    const updatedAttachments = [...selectedHauler.attachments, newAttachment];
    updateHaulerField(selectedHauler.id, 'attachments', updatedAttachments);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    setImportFeedback(`Attached: ${file.name}`);
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const handleRemoveAttachment = (index: number) => {
    if (!selectedHauler) return;
    const updated = selectedHauler.attachments.filter((_, i) => i !== index);
    updateHaulerField(selectedHauler.id, 'attachments', updated);
  };

  const applyTemplateToDraft = (template: EmailTemplate) => {
    if (!selectedHauler) return;
    const placeholders = {
      '{haulerName}': selectedHauler.name,
      '{address}': facilityAddress || location || "Facility Address",
      '{location}': location || "Specified Area",
      '{clientRef}': clientRef || "xxxx.xxxx.xxxxx",
      '{accountInfo}': accountInfo || "ACCOUNT NAME (ACC #)",
      '{signature}': EMAIL_SIGNATURE.trim()
    };
    let newSubject = template.subject;
    let newContent = template.content;
    Object.entries(placeholders).forEach(([key, val]) => {
      newSubject = newSubject.replace(new RegExp(key, 'g'), val);
      newContent = newContent.replace(new RegExp(key, 'g'), val);
    });
    
    // Quill uses HTML, but the templates are currently plain text
    // Convert newlines to breaks for Quill
    const htmlContent = newContent.replace(/\r?\n/g, '<br/>');

    updateHaulerField(selectedHauler.id, 'draftSubject', newSubject);
    updateHaulerField(selectedHauler.id, 'draftContent', htmlContent);
    setImportFeedback(`Applied template: ${template.name}`);
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const handleManualAddHauler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHaulerData.haulerName.trim() || !newHaulerData.brokerEmail.trim()) {
      alert("Both hauler name and primary email are required.");
      return;
    }
    const normalizedNewEmail = newHaulerData.brokerEmail.trim().toLowerCase();
    if (brokerList.some(b => b.brokerEmail.trim().toLowerCase() === normalizedNewEmail)) {
      alert("A hauler with this email already exists in the database.");
      return;
    }
    setBrokerList(prev => [newHaulerData, ...prev]);
    setImportFeedback(`Added "${newHaulerData.haulerName}" to internal database.`);
    setNewHaulerData({ haulerName: '', brokerEmail: '', secondaryEmail: '', notes: '', states: [] });
    setIsAddingHauler(false);
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    if (templates.find(t => t.id === editingTemplate.id)) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    } else {
      setTemplates(prev => [...prev, editingTemplate]);
    }
    setEditingTemplate(null);
    setImportFeedback("Template saved.");
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const insertPlaceholder = (placeholder: string, target: 'subject' | 'content') => {
    if (!editingTemplate) return;
    const field = target === 'subject' ? 'subject' : 'content';
    const el = target === 'subject' ? templateSubjectRef.current : templateBodyRef.current;
    
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const text = editingTemplate[field];
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newValue = before + placeholder + after;
    setEditingTemplate({ ...editingTemplate, [field]: newValue });
    
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  /**
   * Specifically for Quill Draft Editor
   */
  const insertPlaceholderIntoDraft = (placeholder: string) => {
    if (!selectedHauler || !draftQuillRef.current) return;
    const quill = draftQuillRef.current.getEditor();
    const range = quill.getSelection();
    if (range) {
      quill.insertText(range.index, placeholder);
    } else {
      quill.insertText(quill.getLength(), placeholder);
    }
  };

  const handleClearDatabase = () => {
    if (!window.confirm("CRITICAL ACTION: This will permanently wipe ALL contacts. Proceed?")) return;
    setBrokerList([]);
    setHaulers(prev => prev.filter(h => h.contactSource !== 'Broker List'));
    setImportFeedback("Database wiped.");
    setTimeout(() => setImportFeedback(null), 3500);
  };

  const handleRestoreDefaults = () => {
    if (!window.confirm("Restore default contact list?")) return;
    setBrokerList(prev => {
      const existingEmails = new Set(prev.map(b => b.brokerEmail.toLowerCase()));
      const defaultsToAdd = MOCK_BROKERS.filter(b => !existingEmails.has(b.brokerEmail.toLowerCase()));
      return [...prev, ...defaultsToAdd];
    });
    setImportFeedback(`Restored ${MOCK_BROKERS.length} records.`);
    setTimeout(() => setImportFeedback(null), 3500);
  };

  const handleDeleteHauler = (hauler: Hauler) => {
    if (!window.confirm(`Remove "${hauler.name}"?`)) return;
    setHaulers(prev => prev.filter(h => h.id !== hauler.id));
    if (hauler.contactSource === 'Broker List') {
      const targetEmailNormalized = hauler.email.trim().toLowerCase();
      setBrokerList(prev => prev.filter(b => b.brokerEmail.trim().toLowerCase() !== targetEmailNormalized));
    }
    setImportFeedback(`Removed "${hauler.name}".`);
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const geocodeLocation = async (locString: string): Promise<[number, number] | undefined> => {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locString)}&limit=1`);
      const data = await resp.json();
      if (data && data[0]) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.warn("Geocoding failed for:", locString);
    }
    return undefined;
  };

  const startEditingBroker = (index: number, currentEmail: string, currentStates: string[] = []) => {
    setEditingBrokerIndex(index);
    setEditEmailValue(currentEmail);
    setEditStatesValue(currentStates.join(', '));
  };

  const cancelEditingBroker = () => {
    setEditingBrokerIndex(null);
    setEditEmailValue('');
    setEditStatesValue('');
  };

  const handleUpdateBroker = () => {
    if (editingBrokerIndex === null) return;
    
    const brokerToUpdate = filteredDbList[editingBrokerIndex];
    if (!brokerToUpdate) return;

    const newStates = editStatesValue.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);

    setBrokerList(prev => prev.map(b => {
      if (b.haulerName === brokerToUpdate.haulerName && b.brokerEmail === brokerToUpdate.brokerEmail) {
        return { ...b, brokerEmail: editEmailValue.trim(), states: newStates };
      }
      return b;
    }));

    setEditingBrokerIndex(null);
    setEditEmailValue('');
    setEditStatesValue('');
    setImportFeedback("Broker record updated successfully.");
    setTimeout(() => setImportFeedback(null), 2000);
  };

  const handleDeleteBroker = (broker: BrokerContact) => {
    if (!window.confirm(`Permanently delete "${broker.haulerName}" from the internal database?`)) return;
    const targetEmailNormalized = broker.brokerEmail.trim().toLowerCase();
    setBrokerList(prev => prev.filter(b => b.brokerEmail.trim().toLowerCase() !== targetEmailNormalized));
    // Also remove from session list if it came from Broker List
    setHaulers(prev => prev.filter(h => !(h.contactSource === 'Broker List' && h.email.trim().toLowerCase() === targetEmailNormalized)));
    setImportFeedback(`Deleted "${broker.haulerName}" from database.`);
    setTimeout(() => setImportFeedback(null), 3000);
  };

  const addBrokerToSession = (broker: BrokerContact) => {
    const existing = haulers.find(h => h.email === broker.brokerEmail && h.contactSource === 'Broker List');
    if (existing) return existing;
    const addressToUse = facilityAddress || location || "Facility Address";
    const newHauler: Hauler = {
      id: `h-${Date.now()}-manual-Broker List`,
      name: broker.haulerName,
      location: location || "Custom Lookup",
      email: broker.brokerEmail,
      website: '',
      type: HaulerType.NEW,
      status: HaulerStatus.DRAFT,
      contactSource: 'Broker List',
      lastActionDate: new Date().toLocaleDateString(),
      attachments: [...globalAttachments],
      draftSubject: `New Price Opportunity - Waste & Recycling Services - ${addressToUse}`,
      draftContent: BID_TEMPLATE_NEW
        .replace(/{haulerName}/g, broker.haulerName)
        .replace(/{address}/g, addressToUse)
        .replace(/{location}/g, location || "Specified Area")
        .replace(/{clientRef}/g, clientRef || "xxxx.xxxx.xxxxx")
        .replace(/{accountInfo}/g, accountInfo || "ACCOUNT NAME (ACC #)")
        .replace(/{signature}/g, EMAIL_SIGNATURE.trim())
    };
    setHaulers(prev => [newHauler, ...prev]);
    setImportFeedback(`Added "${broker.haulerName}" to results.`);
    setTimeout(() => setImportFeedback(null), 3000);
    return newHauler;
  };

  const composeEmailFromDb = (broker: BrokerContact) => {
    const hauler = addBrokerToSession(broker);
    setSelectedHauler(hauler);
    setIsDrafting(true);
    setIsManagingDb(false);
  };

  const handleLocalRefine = () => {
    if (!selectedHauler) return;
    setIsRefining(true);
    
    // Simulate local refinement logic
    setTimeout(() => {
      const currentContent = htmlToPlainText(selectedHauler.draftContent || '');
      let refined = currentContent;
      
      // Simple local "refinement" - making it more formal
      if (!refined.includes("formal request")) {
        refined = "This is a formal request for pricing.\n\n" + refined;
      }
      
      if (!refined.includes("Thank you for your prompt attention")) {
        refined = refined + "\n\nThank you for your prompt attention to this matter.";
      }

      const htmlBody = refined.trim().replace(/\r?\n/g, '<br/>');
      updateHaulerField(selectedHauler.id, 'draftContent', htmlBody);
      setImportFeedback("Email tone enhanced locally.");
      setIsRefining(false);
      setTimeout(() => setImportFeedback(null), 3000);
    }, 800);
  };

  const processResults = async (results: SearchResult[], source: 'Search' | 'Broker List') => {
    const newHaulers: Hauler[] = await Promise.all(results.map(async (res, idx) => {
      const cleanSearchName = res.name.toLowerCase().replace(/\s+\d{3}-\d{3}-\d{4}/g, '').replace(/\(fka\).*/g, '').trim();
      const isCurrent = currentHaulerName && (cleanSearchName.includes(currentHaulerName.toLowerCase()) || currentHaulerName.toLowerCase().includes(cleanSearchName));
      const addressToUse = facilityAddress || location || "Facility Address";
      const subject = isCurrent ? `Retaining Bid for Client ${clientRef || 'xxxx.xxxx.xxxxx'} - ${res.name}` : `New Price Opportunity - Waste & Recycling Services - ${addressToUse}`;
      const rawContent = (isCurrent ? BID_TEMPLATE_CURRENT : BID_TEMPLATE_NEW)
        .replace(/{haulerName}/g, res.name).replace(/{address}/g, addressToUse).replace(/{location}/g, location || "Specified Area")
        .replace(/{clientRef}/g, clientRef || "xxxx.xxxx.xxxxx").replace(/{accountInfo}/g, accountInfo || "ACCOUNT NAME (ACC #)")
        .replace(/{signature}/g, EMAIL_SIGNATURE.trim());
      
      const coords = await geocodeLocation(res.name + " " + (location || "United States"));

      return {
        id: `h-${Date.now()}-${idx}-${source}`, name: res.name, location: location || (source === 'Search' && !location ? "United States" : "Custom Lookup"),
        email: res.email, website: res.website, type: isCurrent ? HaulerType.CURRENT : HaulerType.NEW, status: HaulerStatus.DRAFT,
        contactSource: source, lastActionDate: new Date().toLocaleDateString(), attachments: [...globalAttachments],
        draftSubject: subject, draftContent: rawContent.trim(),
        coordinates: coords
      };
    }));
    setHaulers(prev => [...newHaulers, ...prev].slice(0, 100));
  };

  const handleLocalSearch = () => {
    if (!location) return;
    setIsSearching(true);
    setSearchStatus("Querying Internal Broker Registry...");
    setSearchPhase(1);
    const searchState = extractState(location);
    
    setTimeout(() => {
      const locLower = location.toLowerCase();
      const filtered = brokerList.filter(broker => {
        const nameMatch = broker.haulerName.toLowerCase().includes(locLower);
        const notesMatch = broker.notes?.toLowerCase().includes(locLower);
        const stateMatch = broker.states?.some(s => s.toLowerCase().includes(locLower));
        
        // If we found a state in the search query, prioritize haulers that serve that state
        if (searchState) {
          const servesState = broker.states?.some(s => s.toUpperCase() === searchState);
          const isNational = broker.notes?.toLowerCase().includes('all') || broker.notes?.toLowerCase().includes('national');
          
          // If the broker has a specific list of states and it doesn't include our search state,
          // and it's not a national broker, we should probably exclude it unless there's a name/notes match
          if (broker.states && broker.states.length > 0 && !servesState && !isNational) {
            // Only allow if there's a very strong name or notes match
            if (!nameMatch && !notesMatch) return false;
          }
        }

        return nameMatch || notesMatch || stateMatch;
      });
      const results: SearchResult[] = filtered.slice(0, 15).map(b => ({ name: b.haulerName, email: b.brokerEmail || '', website: '', snippet: b.notes || 'Local database match.' }));
      processResults(results, 'Broker List');
      setIsSearching(false);
      setSearchStatus('');
      setSearchPhase(0);
    }, 1200);
  };

  const handleDeepSearch = () => {
    if (!location) return;
    setIsSearching(true);
    setSearchStatus("Performing Deep Registry Scan...");
    setSearchPhase(1);
    const searchState = extractState(location);
    
    setTimeout(() => {
      const locLower = location.toLowerCase();
      // Deep search includes fuzzy matching and keyword expansion
      const filtered = brokerList.filter(broker => {
        const nameMatch = broker.haulerName.toLowerCase().includes(locLower);
        const notesMatch = broker.notes?.toLowerCase().includes(locLower);
        const stateMatch = broker.states?.some(s => s.toLowerCase().includes(locLower));
        
        // Also check for common waste management terms if location is a state
        const isStateSearch = locLower.length === 2;
        const stateKeywordMatch = isStateSearch && broker.notes?.toLowerCase().includes(locLower);
        
        // State-based filtering for accuracy
        if (searchState) {
          const servesState = broker.states?.some(s => s.toUpperCase() === searchState);
          const isNational = broker.notes?.toLowerCase().includes('all') || broker.notes?.toLowerCase().includes('national');
          
          if (broker.states && broker.states.length > 0 && !servesState && !isNational) {
            if (!nameMatch && !notesMatch) return false;
          }
        }

        return nameMatch || notesMatch || stateMatch || stateKeywordMatch;
      });

      const results: SearchResult[] = filtered.slice(0, 25).map(b => ({ 
        name: b.haulerName, 
        email: b.brokerEmail || '', 
        website: '', 
        snippet: b.notes || 'Deep registry match.' 
      }));
      
      processResults(results, 'Search');
      setIsSearching(false);
      setSearchStatus('');
      setSearchPhase(0);
      setImportFeedback(`Deep search found ${results.length} matches.`);
      setTimeout(() => setImportFeedback(null), 3000);
    }, 1500);
  };

  const handleUSWideSearch = () => {
    setIsSearching(true);
    setSearchStatus("Scanning Nationwide Network...");
    setSearchPhase(1);
    const searchState = extractState(location);
    
    setTimeout(() => {
      // Find all haulers that serve "All Areas" or have many states
      const filtered = brokerList.filter(broker => {
        const isNational = broker.notes?.toLowerCase().includes('all') || 
                          broker.notes?.toLowerCase().includes('national');
        
        // A hauler is considered "wide" if it's national or has more than 10 states (increased from 5)
        const isWide = isNational || (broker.states && broker.states.length > 10);
        
        // If we have a search state, even "wide" haulers should be checked if they explicitly exclude it
        if (searchState && broker.states && broker.states.length > 0) {
          const servesState = broker.states?.some(s => s.toUpperCase() === searchState);
          if (!servesState && !isNational) return false;
        }

        return isWide;
      });

      const results: SearchResult[] = filtered.slice(0, 20).map(b => ({ 
        name: b.haulerName, 
        email: b.brokerEmail || '', 
        website: '', 
        snippet: b.notes || 'National partner match.' 
      }));
      
      processResults(results, 'Search');
      setIsSearching(false);
      setSearchStatus('');
      setSearchPhase(0);
      setImportFeedback(`Nationwide search identified ${results.length} partners.`);
      setTimeout(() => setImportFeedback(null), 3000);
    }, 1800);
  };

  const handleBrokerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return;
        const splitCSVLine = (line: string): string[] => {
          const parts = line.match(/(?:[^,"']+|"(?:[^"]|"")*"|'(?:[^']|"")*')+/g);
          return parts ? parts.map(part => part.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim()) : [];
        };
        let currentHeaders: string[] = [];
        let colMap: { [key: string]: number } = {};
        const incomingBrokers: BrokerContact[] = [];
        for (let i = 0; i < lines.length; i++) {
          const parts = splitCSVLine(lines[i]);
          if (parts.length === 0) continue;
          const lowerParts = parts.map(p => p.toLowerCase());
          const isHeader = (lowerParts.includes('name') || lowerParts.includes('hauler name')) && (lowerParts.includes('email') || lowerParts.includes('hauler contact'));
          if (isHeader) {
            currentHeaders = lowerParts;
            colMap = {};
            currentHeaders.forEach((h, idx) => { colMap[h] = idx; });
            continue;
          }
          if (currentHeaders.length === 0) continue;
          const haulerName = parts[colMap['hauler name'] ?? colMap['name']] || '';
          const brokerEmail = parts[colMap['hauler contact'] ?? colMap['email']] || '';
          if (!haulerName || !brokerEmail) continue;
          incomingBrokers.push({ haulerName, brokerEmail, notes: parts.filter((_, idx) => idx !== (colMap['hauler name'] ?? colMap['name']) && idx !== (colMap['hauler contact'] ?? colMap['email'])).join(' | ') });
        }
        if (incomingBrokers.length > 0) {
          setBrokerList(prev => {
            const existing = new Set(prev.map(b => b.brokerEmail.toLowerCase()));
            return [...prev, ...incomingBrokers.filter(b => !existing.has(b.brokerEmail.toLowerCase()))];
          });
          setImportFeedback(`Imported ${incomingBrokers.length} new contacts.`);
        }
      } catch (err) { setImportFeedback("Error parsing CSV."); } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setImportFeedback(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const initiateOutlookSend = (hauler: Hauler) => {
    const subject = encodeURIComponent(hauler.draftSubject || '');
    // Outlook mailto: doesn't support HTML properly, so we convert the rich text back to plain text
    const plainTextBody = htmlToPlainText(hauler.draftContent || '');
    const body = encodeURIComponent(plainTextBody);
    window.location.href = `mailto:${hauler.email}?subject=${subject}&body=${body}`;
    setHaulers(prev => prev.map(h => h.id === hauler.id ? { ...h, status: HaulerStatus.SENT, lastActionDate: new Date().toLocaleDateString() } : h));
    setIsDrafting(false);
  };

  const SourceFilterButton = ({ label, value, icon: Icon }: { label: string, value: typeof sourceFilter, icon: any }) => {
    const isActive = sourceFilter === value;
    return (
      <button 
        onClick={() => setSourceFilter(value)}
        aria-pressed={isActive}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
          isActive ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
        } focus-visible:ring-2 focus-visible:ring-green-500 outline-none`}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {label}
      </button>
    );
  };

  const isHaulerInDb = (email: string) => {
    return brokerList.some(b => b.brokerEmail.toLowerCase() === email.toLowerCase());
  };

  const isSelectedHaulerInDb = useMemo(() => {
    if (!selectedHauler) return true;
    return isHaulerInDb(selectedHauler.email);
  }, [selectedHauler, brokerList]);

  return (
    <div className="min-h-screen pb-20 text-gray-900 dark:text-gray-100 transition-colors duration-200 font-sans">
      <div role="status" aria-live="polite" className="sr-only">
        {importFeedback}
        {isSearching ? searchStatus : ""}
      </div>

      {importFeedback && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-right duration-300 pointer-events-none">
          <div className="bg-gray-900 dark:bg-gray-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-700">
            <CheckCircleIcon className="w-6 h-6 text-green-400" aria-hidden="true" />
            <span className="text-sm font-bold">{importFeedback}</span>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg" aria-hidden="true"><TrashIcon className="w-6 h-6 text-white" /></div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Hauler Hunter</h1>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOutlookConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} aria-hidden="true"></span>
                  Account: {SENDER_EMAIL}
                </div>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-3">
              <button 
                onClick={toggleDarkMode} 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-500 outline-none"
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsManagingTemplates(true)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase hover:bg-amber-100 transition shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
              >
                <DocumentTextIcon className="w-4 h-4" aria-hidden="true" /> Templates
              </button>
              <button 
                onClick={() => setIsAddingHauler(true)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase hover:bg-blue-100 transition shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              >
                <UserPlusIcon className="w-4 h-4" aria-hidden="true" /> Add New
              </button>
              <button 
                onClick={() => setIsManagingDb(true)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase border border-gray-100 dark:border-gray-600 hover:bg-gray-100 transition focus-visible:ring-2 focus-visible:ring-gray-400 outline-none"
              >
                <ServerIcon className="w-4 h-4 text-green-600" aria-hidden="true" /> {brokerList.length} Records
              </button>
              <label className="cursor-pointer bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-amber-800 rounded-md py-1.5 px-3 text-sm font-bold text-green-700 hover:bg-green-100 transition shadow-sm flex items-center gap-2 focus-within:ring-2 focus-within:ring-green-500">
                <ArrowUpOnSquareStackIcon className="w-4 h-4" aria-hidden="true" /> Import CSV
                <input type="file" ref={fileInputRef} className="sr-only" accept=".csv,.txt" onChange={handleBrokerUpload} aria-label="Upload broker CSV" />
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content">
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><MapPinIcon className="w-5 h-5 text-green-600" aria-hidden="true" /> Identify Partners</h2>
            <div className="flex items-center gap-4">
              <div className="relative" ref={savedSearchesRef}>
                <button 
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                  className="text-[10px] font-black uppercase text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors outline-none focus-visible:underline"
                >
                  <ClockIcon className="w-3 h-3" /> History
                </button>
                {showSavedSearches && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-[9px] font-black uppercase tracking-widest text-gray-500">Saved Criteria</div>
                    <ul className="max-h-60 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                      {savedSearches.length === 0 ? (
                        <li className="p-6 text-center text-xs text-gray-400 italic">No bookmarks yet</li>
                      ) : (
                        savedSearches.map(s => (
                          <li key={s.id} onClick={() => handleLoadSearch(s)} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[180px]">{s.name}</div>
                                <div className="text-[9px] text-gray-500 mt-1">{s.timestamp}</div>
                              </div>
                              <button onClick={(e) => handleDeleteSavedSearch(s.id, e)} className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <button 
                onClick={handleSaveSearch}
                className="text-[10px] font-black uppercase text-gray-500 hover:text-green-600 flex items-center gap-1 transition-colors outline-none focus-visible:underline"
              >
                <BookmarkIcon className="w-3 h-3" /> Save
              </button>
              <button 
                type="button" 
                onClick={handleResetFilters} 
                className="text-[10px] font-black uppercase text-gray-500 hover:text-red-500 transition-colors focus-visible:underline outline-none"
              >
                Reset All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-3">
              <label htmlFor="search-area" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Search Area (City & State)</label>
              <input 
                id="search-area" type="text" value={location} onChange={(e) => setLocation(e.target.value)} 
                placeholder="e.g. Dallas, TX" 
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 border outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" 
              />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="facility-address" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Facility Address</label>
              <input 
                id="facility-address" type="text" value={facilityAddress} onChange={(e) => setFacilityAddress(e.target.value)} 
                placeholder="123 Industrial Way..." 
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 border outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" 
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="radius-mi" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Radius</label>
              <input 
                id="radius-mi" type="number" value={searchRadius} onChange={(e) => setSearchRadius(e.target.value === '' ? '' : Number(e.target.value))} 
                placeholder="Mi" 
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 border outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" 
              />
            </div>
            <div className="md:col-span-5 flex items-end gap-2">
              <button 
                onClick={handleLocalSearch} disabled={isSearching} 
                className="flex-1 bg-green-600 text-white font-black py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 uppercase text-[11px] shadow-md focus-visible:ring-2 focus-visible:ring-green-400 outline-none"
              >
                {isSearching && searchPhase === 1 && !searchStatus.includes("AI") ? <ArrowPathIcon className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CircleStackIcon className="w-4 h-4" aria-hidden="true" />} Search DB
              </button>
              <button 
                onClick={handleDeepSearch} disabled={isSearching} 
                className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 uppercase text-[11px] shadow-md focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
              >
                {isSearching && searchPhase > 0 ? <ArrowPathIcon className="w-4 h-4 animate-spin" aria-hidden="true" /> : <MagnifyingGlassIcon className="w-4 h-4" aria-hidden="true" />} Deep Registry Scan
              </button>
              <button 
                onClick={handleUSWideSearch} disabled={isSearching} 
                className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 uppercase text-[11px] shadow-md focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none"
              >
                {isSearching && searchPhase === 1 ? <ArrowPathIcon className="w-4 h-4 animate-spin" aria-hidden="true" /> : <GlobeAmericasIcon className="w-4 h-4" aria-hidden="true" />} Nationwide Network
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label htmlFor="current-hauler" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Current Hauler (System)</label>
              <input 
                id="current-hauler" type="text" value={currentHaulerName} onChange={(e) => setCurrentHaulerName(e.target.value)} 
                placeholder="e.g. Waste Management" 
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm border outline-none focus:border-green-500 transition-all" 
              />
            </div>
            <div>
              <label htmlFor="hauler-type-filter" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Hauler Type (Filter)</label>
              <select 
                id="hauler-type-filter" value={haulerTypeFilter} onChange={(e) => setHaulerTypeFilter(e.target.value as any)}
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm border outline-none focus:border-green-500 transition-all"
              >
                <option value="all">All Partners</option>
                <option value={HaulerType.CURRENT}>Current Only</option>
                <option value={HaulerType.NEW}>Prospects Only</option>
              </select>
            </div>
            <div>
              <label htmlFor="state-filter" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 tracking-wider">State (Filter)</label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                <input 
                  id="state-filter" type="text" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} 
                  placeholder="e.g. TX, CA, FL" 
                  className="w-full rounded-xl pl-9 pr-4 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm border outline-none focus:border-green-500 transition-all" 
                />
              </div>
            </div>
            <div>
              <label htmlFor="area-filter" className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Service Area (Filter)</label>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                <input 
                  id="area-filter" type="text" value={serviceAreaFilter} onChange={(e) => setServiceAreaFilter(e.target.value)} 
                  placeholder="Filter by area/keyword..." 
                  className="w-full rounded-xl pl-9 pr-4 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm border outline-none focus:border-green-500 transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1.5 tracking-wider">Client Ref / Account Info</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={clientRef} onChange={(e) => setClientRef(e.target.value)} placeholder="Ref#" aria-label="Client Reference" className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm border outline-none focus:border-green-500 transition-all" />
                <input type="text" value={accountInfo} onChange={(e) => setAccountInfo(e.target.value)} placeholder="Acc Info" aria-label="Account Info" className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 text-sm border outline-none focus:border-green-500 transition-all" />
              </div>
            </div>
          </div>
        </section>

        {isSearching && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 mb-8 text-center shadow-xl border-l-4 border-l-green-600 animate-in fade-in zoom-in duration-300" aria-busy="true">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className={`w-20 h-20 border-4 ${searchPhase === 5 ? 'border-amber-100 border-t-amber-600' : 'border-green-100 border-t-green-600'} rounded-full animate-spin`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {searchPhase === 5 ? <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" /> : <MagnifyingGlassIcon className="w-8 h-8 text-green-600 animate-pulse" />}
                </div>
              </div>
              <div>
                <h3 className={`text-2xl font-black mb-3 tracking-tight ${searchPhase === 5 ? 'text-amber-700 dark:text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                  {searchStatus}
                </h3>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className={`h-1 w-8 rounded-full transition-all duration-500 ${searchPhase >= step ? (searchPhase === 5 ? 'bg-amber-500' : 'bg-green-600') : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2">
                    {searchPhase === 5 ? "Switching to Secondary Lookup..." : "Grounded AI Analysis in Progress..."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {haulers.length > 0 && !isSearching && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2 px-1">
              <nav className="flex flex-wrap gap-2" aria-label="Source filters">
                <SourceFilterButton label="All Identified" value="all" icon={MagnifyingGlassIcon} />
                <SourceFilterButton label="Web Search" value="Search" icon={SparklesIcon} />
                <SourceFilterButton label="Broker List" value="Broker List" icon={ServerIcon} />
              </nav>
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    aria-label="List View"
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    aria-label="Map View"
                  >
                    <GlobeAltIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 tracking-widest">
                  Showing {sortedHaulers.length} of {haulers.length} results
                </div>
              </div>
            </div>

            {viewMode === 'map' ? (
              <div className="w-full h-[600px] bg-gray-200 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner overflow-hidden animate-in fade-in zoom-in duration-300">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
            ) : (
              sortedHaulers.length === 0 ? (
                <div className="py-20 text-center bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700" role="status">
                  <NoSymbolIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
                  <h3 className="text-gray-600 dark:text-gray-400 font-bold uppercase text-xs tracking-widest">No partners match current filters</h3>
                  <button onClick={handleResetFilters} className="mt-4 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase hover:underline">Clear all filters</button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {sortedHaulers.map((h) => {
                    const inDb = isHaulerInDb(h.email);
                    return (
                      <li key={h.id} className="bg-white dark:bg-gray-800 rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border-gray-100 dark:border-gray-700 hover:border-green-300/50 hover:shadow-md transition-all group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-black truncate tracking-tight">{h.name}</h3>
                            <div className="flex gap-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${h.contactSource === 'Broker List' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                                {h.contactSource === 'Broker List' ? 'Broker List' : 'Web Search'}
                              </span>
                              {h.contactSource === 'Search' && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
                                  <SparklesIcon className="w-2.5 h-2.5" /> Verified
                                </span>
                              )}
                              {inDb && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                                  <CheckBadgeIcon className="w-2.5 h-2.5" /> In Database
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${h.type === HaulerType.CURRENT ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                {h.type} Partner
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                                <EnvelopeIcon className="w-4 h-4 text-gray-500" aria-hidden="true" /> 
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{h.email}</span>
                              </div>
                              <button 
                                onClick={() => handleCopyEmail(h.email)}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                title="Copy Email Address"
                              >
                                <ClipboardIcon className="w-4 h-4" /> Copy Email
                              </button>
                            </div>
                            {h.website && <a href={h.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline focus-visible:underline outline-none"><GlobeAltIcon className="w-4 h-4" aria-hidden="true" /> Link</a>}
                            <div className="flex items-center gap-1.5"><MapPinIcon className="w-4 h-4" aria-hidden="true" /> <span className="truncate max-w-[200px] text-xs font-medium">{h.location}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                          <div className="flex items-center gap-2 mr-2 border-r border-gray-200 dark:border-gray-700 pr-3">
                            <button 
                              onClick={() => handleCopyBrokerInfo(h)}
                              className="p-2.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition focus-visible:ring-2 focus-visible:ring-gray-400 outline-none"
                              title="Copy Full Broker Info"
                              aria-label={`Copy info for ${h.name}`}
                            >
                              <ClipboardDocumentIcon className="w-5 h-5" aria-hidden="true" />
                            </button>
                            {h.contactSource === 'Search' && !inDb && (
                              <button 
                                onClick={() => handleAddToDatabase(h)}
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none text-[10px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-800"
                                title="Add to Database"
                                aria-label={`Save ${h.name} to database`}
                              >
                                <PlusCircleIcon className="w-5 h-5" aria-hidden="true" /> Add to DB
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => handleDeleteHauler(h)} 
                            className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition focus-visible:ring-2 focus-visible:ring-red-400 outline-none"
                            aria-label={`Remove ${h.name} from list`}
                          >
                            <TrashIcon className="w-5 h-5" aria-hidden="true" />
                          </button>
                          <button 
                            onClick={() => { setSelectedHauler(h); setIsDrafting(true); }} 
                            className="px-5 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-green-100 transition shadow-sm focus-visible:ring-2 focus-visible:ring-green-400 outline-none"
                          >
                            <PencilSquareIcon className="w-4 h-4" aria-hidden="true" /> DRAFT
                          </button>
                          <button 
                            onClick={() => initiateOutlookSend(h)} 
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"
                          >
                            OUTLOOK
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            )}

            {/* Intelligence Sources Section Removed */}
          </section>
        )}
      </main>

      {/* Template Manager Modal */}
      {isManagingTemplates && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md transition-all"
          role="dialog" aria-modal="true" aria-labelledby="templates-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden border border-white/20 flex flex-col">
            <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-amber-600 p-3 rounded-2xl text-white shadow-lg shadow-amber-600/20"><DocumentTextIcon className="w-7 h-7" aria-hidden="true" /></div>
                <h3 id="templates-title" className="text-2xl font-black tracking-tight">Email Templates</h3>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditingTemplate({ id: `t-${Date.now()}`, name: '', category: HaulerType.NEW, subject: '', content: '' })} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase hover:bg-amber-700 transition shadow-md focus-visible:ring-2 focus-visible:ring-amber-400 outline-none">
                  <PlusIcon className="w-4 h-4" aria-hidden="true" /> New Template
                </button>
                <button onClick={() => setIsManagingTemplates(false)} className="text-gray-500 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 outline-none" aria-label="Close templates">
                  <XMarkIcon className="w-7 h-7" aria-hidden="true" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {editingTemplate ? (
                <form onSubmit={handleSaveTemplate} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="temp-name" className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2 tracking-widest">Internal Name</label>
                      <input id="temp-name" type="text" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold outline-none focus:border-amber-500 transition-all" placeholder="e.g. Standard New Site RFP" required />
                    </div>
                    <div>
                      <label htmlFor="temp-cat" className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2 tracking-widest">Category</label>
                      <select id="temp-cat" value={editingTemplate.category} onChange={e => setEditingTemplate({...editingTemplate, category: e.target.value as HaulerType})} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold outline-none focus:border-amber-500 transition-all">
                        <option value={HaulerType.CURRENT}>Current Provider</option>
                        <option value={HaulerType.NEW}>New Prospect</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-amber-600">
                      <KeyIcon className="w-4 h-4" /> Available Placeholders (Click to Insert)
                    </div>
                    <div className="flex wrap gap-2">
                      {PLACEHOLDERS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => {
                            const lastFocus = document.activeElement;
                            if (lastFocus === templateSubjectRef.current) {
                              insertPlaceholder(p.key, 'subject');
                            } else {
                              insertPlaceholder(p.key, 'content');
                            }
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 hover:border-amber-400 hover:shadow-sm transition-all"
                        >
                          {p.label} <code className="ml-1 opacity-60 font-mono">{p.key}</code>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="temp-sub" className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2 tracking-widest">Subject Line</label>
                    <input 
                      ref={templateSubjectRef}
                      id="temp-sub" 
                      type="text" 
                      value={editingTemplate.subject} 
                      onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} 
                      className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold outline-none focus:border-amber-500 transition-all" 
                      placeholder="Supports {clientRef}, {address}, etc." 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="temp-body" className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2 tracking-widest">Message Body</label>
                    <textarea 
                      ref={templateBodyRef}
                      id="temp-body" 
                      value={editingTemplate.content} 
                      onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})} 
                      className="w-full h-80 px-5 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm leading-relaxed outline-none focus:border-amber-500 font-medium" 
                      placeholder="Write your template here..." 
                      required 
                    />
                  </div>
                  <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => setEditingTemplate(null)} className="px-8 py-3 font-bold text-gray-500 hover:text-gray-700 transition-colors focus-visible:underline outline-none">Cancel</button>
                    <button type="submit" className="px-10 py-3 bg-amber-600 text-white rounded-2xl text-sm font-black hover:bg-amber-700 shadow-xl focus-visible:ring-2 focus-visible:ring-amber-400 outline-none">SAVE CHANGES</button>
                  </div>
                </form>
              ) : (
                <ul className="grid grid-cols-1 gap-4">
                  {templates.map(t => (
                    <li key={t.id} className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:border-amber-400 hover:shadow-md transition-all">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black tracking-tight">{t.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider ${t.category === HaulerType.CURRENT ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'}`}>{t.category}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-2 italic truncate max-w-xl">{t.subject}</div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingTemplate(t)} className="p-3 bg-white dark:bg-gray-800 text-gray-500 hover:text-amber-600 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 outline-none" aria-label={`Edit ${t.name}`}><PencilSquareIcon className="w-5 h-5" aria-hidden="true" /></button>
                        <button onClick={() => setTemplates(prev => prev.filter(x => x.id !== t.id))} className="p-3 bg-white dark:bg-gray-800 text-gray-500 hover:text-red-600 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-red-400 outline-none" aria-label={`Delete ${t.name}`}><TrashIcon className="w-5 h-5" aria-hidden="true" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Database Modal */}
      {isManagingDb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md transition-all" role="dialog" aria-modal="true" aria-labelledby="db-title">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden border border-white/20 flex flex-col">
            <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-600 p-3 rounded-2xl text-white shadow-lg"><ServerIcon className="w-7 h-7" aria-hidden="true" /></div>
                <div>
                  <h3 id="db-title" className="text-2xl font-black tracking-tight">Internal Database</h3>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">{brokerList.length} Contacts Indexed</p>
                </div>
              </div>
              <div className="flex-1 max-w-md w-full">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <input 
                    type="text" value={dbSearchQuery} onChange={(e) => setDbSearchQuery(e.target.value)} 
                    placeholder="Quick Search Contacts..." 
                    aria-label="Search contact database"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold outline-none focus:border-green-500 transition-all" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRestoreDefaults} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none">RESTORE</button>
                <button onClick={handleClearDatabase} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-700 shadow-lg focus-visible:ring-2 focus-visible:ring-red-400 outline-none">WIPE DB</button>
                <button onClick={() => {setIsManagingDb(false); setDbSearchQuery(''); setEditingBrokerIndex(null);}} className="text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 outline-none" aria-label="Close database">
                  <XMarkIcon className="w-7 h-7" aria-hidden="true" />
                </button>
              </div>
            </div>
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
              {filteredDbList.map((broker, i) => (
                <div key={i} className="p-6 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-6 hover:border-green-400 transition-all group">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black tracking-tight truncate">{broker.haulerName}</h4>
                    {editingBrokerIndex === i ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <input 
                            type="email" 
                            value={editEmailValue} 
                            onChange={(e) => setEditEmailValue(e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-green-500"
                            placeholder="Email Address"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={editStatesValue} 
                            onChange={(e) => setEditStatesValue(e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-green-500"
                            placeholder="States (e.g. TX, CA, FL)"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateBroker(); if (e.key === 'Escape') cancelEditingBroker(); }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleUpdateBroker} className="flex-1 py-1 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 rounded hover:bg-green-200 text-[10px] font-black uppercase">Save</button>
                          <button onClick={cancelEditingBroker} className="flex-1 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 rounded hover:bg-red-200 text-[10px] font-black uppercase">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mt-1 group/email">
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate block">{broker.brokerEmail}</span>
                          <button 
                            onClick={() => startEditingBroker(i, broker.brokerEmail, broker.states)} 
                            className="opacity-0 group-hover/email:opacity-100 p-1 text-gray-400 hover:text-green-600 transition-all focus:opacity-100 outline-none"
                            aria-label="Edit broker"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                        </div>
                        {broker.states && broker.states.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {broker.states.map(s => (
                              <span key={s} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[9px] font-black uppercase">{s}</span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {broker.notes && <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 italic truncate">{broker.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteBroker(broker)} 
                      className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition focus-visible:ring-2 focus-visible:ring-red-400 outline-none"
                      title="Delete from Database"
                      aria-label={`Delete ${broker.haulerName} from database`}
                    >
                      <TrashIcon className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <button onClick={() => composeEmailFromDb(broker)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-400 outline-none">COMPOSE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isDrafting && selectedHauler && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm transition-all"
          role="dialog" aria-modal="true" aria-labelledby="compose-title"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-white/10">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg"><EnvelopeIcon className="w-6 h-6" aria-hidden="true" /></div>
                <div>
                  <h3 id="compose-title" className="text-xl font-black tracking-tight">Email Composer</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[9px] font-black uppercase tracking-wider">{selectedHauler.type} BID REQUEST</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider transition-all hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-400 outline-none">
                    <DocumentDuplicateIcon className="w-5 h-5" aria-hidden="true" /> LOAD TEMPLATE
                  </button>
                  <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-white dark:bg-gray-800 border-2 border-amber-100 dark:border-amber-800 rounded-2xl shadow-2xl z-20 w-80 overflow-hidden">
                    <div className="p-3 text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/10">Compatible with {selectedHauler.type}</div>
                    {templates.filter(t => t.category === selectedHauler.type).map(t => (
                      <button key={t.id} onClick={() => applyTemplateToDraft(t)} className="w-full px-5 py-4 text-left text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 border-b last:border-0 border-gray-100 dark:border-gray-700 flex items-center justify-between focus-visible:bg-amber-50 outline-none">
                        {t.name} <ArrowUturnLeftIcon className="w-4 h-4 text-amber-500" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setIsDrafting(false)} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 focus-visible:ring-2 focus-visible:ring-gray-400 outline-none" aria-label="Close composer">
                  <XMarkIcon className="w-8 h-8" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="px-10 py-8 space-y-5 border-b border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-6">
                <span className="w-16 text-gray-600 dark:text-gray-400 font-black uppercase tracking-widest text-[11px]">Recipient:</span>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 px-5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 font-bold text-sm flex items-center justify-between shadow-inner">
                  {selectedHauler.email}
                  <button onClick={() => handleCopyEmail(selectedHauler.email)} className="text-gray-500 hover:text-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400 outline-none" aria-label="Copy recipient email">
                    <ClipboardDocumentIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label htmlFor="draft-sub" className="w-16 text-gray-600 dark:text-gray-400 font-black uppercase tracking-widest text-[11px]">Subject:</label>
                <input id="draft-sub" type="text" value={selectedHauler.draftSubject || ''} onChange={(e) => updateHaulerField(selectedHauler.id, 'draftSubject', e.target.value)} className="flex-1 bg-white dark:bg-gray-950 px-5 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 font-black text-sm outline-none focus:border-blue-500 transition-all shadow-sm" />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950">
              <div className="px-10 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <div className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1.5 border-r border-gray-200 dark:border-gray-700 pr-4">
                  <CommandLineIcon className="w-4 h-4" /> Placeholders
                </div>
                <div className="flex flex-wrap gap-2">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => insertPlaceholderIntoDraft(p.key)}
                      className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:border-blue-300 transition-all shadow-sm"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 relative overflow-y-auto px-10 py-4 quill-draft-container">
                <ReactQuill 
                  // @ts-ignore
                  ref={draftQuillRef}
                  theme="snow" 
                  value={selectedHauler.draftContent || ''} 
                  onChange={(val) => updateHaulerField(selectedHauler.id, 'draftContent', val)}
                  modules={QUILL_MODULES}
                  placeholder="Craft your message or apply a template..."
                  className="h-full border-none"
                />
              </div>

              <div className="px-10 py-5 border-t border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-900/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase text-gray-600 dark:text-gray-400 tracking-widest flex items-center gap-2">
                    <PaperClipIcon className="w-4 h-4" aria-hidden="true" /> Project Attachments ({selectedHauler.attachments.length})
                  </h4>
                  <button 
                    onClick={() => attachmentInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"
                  >
                    <PlusIcon className="w-4 h-4" aria-hidden="true" /> UPLOAD FILE
                  </button>
                  <input type="file" ref={attachmentInputRef} className="sr-only" onChange={handleAddAttachment} aria-label="Add attachment" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedHauler.attachments.map((file, i) => (
                    <div key={i} className="group relative flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold shadow-sm transition-all hover:border-blue-400 pr-12">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-xl"><DocumentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" /></div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate max-w-[150px] text-gray-900 dark:text-white leading-tight">{file.name}</span>
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{formatFileSize(file.size)}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveAttachment(i)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all focus-visible:opacity-100 outline-none"
                        aria-label={`Remove ${file.name}`}
                      >
                        <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-10 py-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <button onClick={handleLocalRefine} disabled={isRefining} className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none">
                  {isRefining ? <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden="true" /> : <SparklesIcon className="w-5 h-5" aria-hidden="true" />} ENHANCE TONE
                </button>
                {!isSelectedHaulerInDb && (
                  <button 
                    onClick={() => handleAddToDatabase(selectedHauler)} 
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none"
                  >
                    <PlusCircleIcon className="w-5 h-5" aria-hidden="true" /> ADD TO DATABASE
                  </button>
                )}
              </div>
              <div className="flex items-center gap-6">
                <button onClick={() => setIsDrafting(false)} className="px-6 py-4 font-black text-sm text-gray-500 hover:text-gray-700 tracking-widest uppercase focus-visible:underline outline-none">Discard Draft</button>
                <button onClick={() => initiateOutlookSend(selectedHauler)} className="flex items-center gap-4 px-12 py-5 bg-blue-600 text-white rounded-2xl text-base font-black hover:bg-blue-700 shadow-2xl group transition-all focus-visible:ring-2 focus-visible:ring-blue-400 outline-none">
                  <PaperAirplaneIcon className="w-6 h-6 -rotate-45 group-hover:translate-x-2 group-hover:-translate-y-1 transition-transform" aria-hidden="true" /> PROCESS IN OUTLOOK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Hauler Modal */}
      {isAddingHauler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md transition-all" role="dialog" aria-modal="true" aria-labelledby="add-hauler-title">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
             <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 id="add-hauler-title" className="text-xl font-black tracking-tight">Register New Partner</h3>
              <button onClick={() => {setIsAddingHauler(false); setNewHaulerData({ haulerName: '', brokerEmail: '', secondaryEmail: '', notes: '', states: [] });}} className="text-gray-500 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus-visible:ring-2 focus-visible:ring-gray-400 outline-none" aria-label="Close form">
                <XMarkIcon className="w-7 h-7" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleManualAddHauler} className="p-8 space-y-6">
              <div>
                <label htmlFor="new-hauler-name" className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2 tracking-widest">Company Name</label>
                <input id="new-hauler-name" type="text" value={newHaulerData.haulerName} onChange={e => setNewHaulerData({...newHaulerData, haulerName: e.target.value})} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-sm" placeholder="e.g. Dallas Sanitation Experts" required />
              </div>
              <div>
                <label htmlFor="new-hauler-email" className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2 tracking-widest">Broker Contact Email</label>
                <input id="new-hauler-email" type="email" value={newHaulerData.brokerEmail} onChange={e => setNewHaulerData({...newHaulerData, brokerEmail: e.target.value})} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-sm" placeholder="contact@partner.com" required />
              </div>
              <div>
                <label htmlFor="new-hauler-states" className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2 tracking-widest">Regional States (Comma Separated)</label>
                <input 
                  id="new-hauler-states" 
                  type="text" 
                  value={newHaulerData.states?.join(', ') || ''} 
                  onChange={e => {
                    const states = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
                    setNewHaulerData({...newHaulerData, states});
                  }} 
                  className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-sm" 
                  placeholder="e.g. TX, CA, FL" 
                />
              </div>
              <div>
                <label htmlFor="new-hauler-notes" className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2 tracking-widest">Additional Notes / Area</label>
                <textarea id="new-hauler-notes" value={newHaulerData.notes || ''} onChange={e => setNewHaulerData({...newHaulerData, notes: e.target.value})} rows={3} className="w-full px-5 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium leading-relaxed outline-none focus:border-indigo-500 transition-all shadow-sm" placeholder="Describe service area, specialties, or internal notes..." />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none">PERSIST TO DATABASE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
