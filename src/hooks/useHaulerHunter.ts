import { useCallback } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { SearchResult, Hauler, HaulerType, HaulerStatus, BrokerContact } from '../../types';
import { normalizeEmail, normalizeHaulerName, extractState } from '../lib/utils';
import { BID_TEMPLATE_CURRENT, BID_TEMPLATE_NEW, EMAIL_SIGNATURE, SENDER_EMAIL } from '../../constants';

export const useHaulerHunter = () => {
  const {
    location,
    facilityAddress,
    currentHaulerName,
    clientRef,
    accountInfo,
    setIsSearching,
    setSearchStatus,
    setSearchPhase,
    setHaulers,
    brokerList,
    showToast
  } = useGlobal();

  const geocodeLocation = async (locString: string): Promise<[number, number] | undefined> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locString)}&limit=1`, {
        headers: {
          'User-Agent': 'HaulerHunter/1.0 (contact: ' + SENDER_EMAIL + ')'
        }
      });
      const data = await resp.json();
      if (data && data[0]) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.warn("Geocoding failed for:", locString);
    }
    return undefined;
  };

  const processResults = useCallback(async (results: SearchResult[], source: 'Search' | 'Broker List') => {
    const uniqueIncoming: SearchResult[] = [];
    const seenIncoming = new Set<string>();
    
    for (const res of results) {
      const normEmail = normalizeEmail(res.email);
      const normName = normalizeHaulerName(res.name);
      const key = normEmail || normName;
      
      if (!seenIncoming.has(key)) {
        uniqueIncoming.push(res);
        seenIncoming.add(key);
      }
    }

    const newHaulers: Hauler[] = await Promise.all(uniqueIncoming.map(async (res, idx) => {
      const cleanSearchName = (res.name || "").toLowerCase().replace(/\s+\d{3}-\d{3}-\d{4}/g, '').replace(/\(fka\).*/g, '').trim();
      const isCurrent = currentHaulerName && (cleanSearchName.includes(currentHaulerName.toLowerCase()) || currentHaulerName.toLowerCase().includes(cleanSearchName));
      const addressToUse = facilityAddress || location || "Facility Address";
      const subject = isCurrent ? `Retaining Bid for Client ${clientRef || 'xxxx.xxxx.xxxxx'} - ${res.name}` : `New Price Opportunity - Waste & Recycling Services - ${addressToUse}`;
      const rawContent = (isCurrent ? BID_TEMPLATE_CURRENT : BID_TEMPLATE_NEW)
        .replace(/{haulerName}/g, res.name).replace(/{address}/g, addressToUse).replace(/{location}/g, location || "Specified Area")
        .replace(/{clientRef}/g, clientRef || "xxxx.xxxx.xxxxx").replace(/{accountInfo}/g, accountInfo || "ACCOUNT NAME (ACC #)")
        .replace(/{signature}/g, EMAIL_SIGNATURE.trim());
      
      const coords = await geocodeLocation(res.name + " " + (location || "United States"));

      return {
        id: `h-${Date.now()}-${idx}-${source}`, 
        name: res.name, 
        location: location || (source === 'Search' && !location ? "United States" : "Custom Lookup"),
        email: res.email, 
        website: res.website, 
        type: isCurrent ? HaulerType.CURRENT : HaulerType.NEW, 
        status: HaulerStatus.DRAFT,
        contactSource: source, 
        lastActionDate: new Date().toLocaleDateString(), 
        attachments: [],
        draftSubject: subject, 
        draftContent: rawContent.trim().replace(/\r?\n/g, '<br/>'),
        coordinates: coords
      };
    }));
    
    setHaulers(prev => {
      const existingEmails = new Set(prev.map(h => normalizeEmail(h.email)));
      const existingNames = new Set(prev.map(h => normalizeHaulerName(h.name)));
      const uniqueNewHaulers: Hauler[] = [];
      const seenInNew = new Set<string>();
      
      for (const h of newHaulers) {
        const normEmail = normalizeEmail(h.email);
        const normName = normalizeHaulerName(h.name);
        
        const emailAlreadyExists = normEmail && (existingEmails.has(normEmail) || seenInNew.has(normEmail));
        const nameAlreadyExists = existingNames.has(normName) || seenInNew.has(normName);

        if (!emailAlreadyExists && !nameAlreadyExists) {
          uniqueNewHaulers.push(h);
          if (normEmail) seenInNew.add(normEmail);
          seenInNew.add(normName);
        }
      }
      return [...uniqueNewHaulers, ...prev].slice(0, 100);
    });
  }, [location, facilityAddress, currentHaulerName, clientRef, accountInfo, setHaulers]);

  const handleLocalSearch = useCallback(() => {
    if (!location) return;
    setIsSearching(true);
    setSearchStatus("Querying Internal Broker Registry...");
    setSearchPhase(1);
    const searchState = extractState(location);
    const locLower = (location || "").toLowerCase();
    const searchTerms = locLower.split(/[\s,]+/).filter(t => t.length > 1);
    
    setTimeout(() => {
      const filtered = brokerList.filter(broker => {
        const nameLower = (broker.haulerName || "").toLowerCase();
        const notesLower = broker.notes?.toLowerCase() || '';
        const termMatch = searchTerms.some(term => nameLower.includes(term) || notesLower.includes(term));
        const stateMatch = broker.states?.some(s => searchTerms.some(term => s?.toLowerCase().includes(term)));
        
        if (searchState) {
          const servesState = broker.states?.some(s => s.toUpperCase() === searchState);
          const isNational = broker.notes?.toLowerCase().includes('all') || broker.notes?.toLowerCase().includes('national');
          if (broker.states && broker.states.length > 0 && !servesState && !isNational) {
            if (!nameLower.includes(locLower) && !notesLower.includes(locLower)) return false;
          }
          if (servesState) return true;
        }
        return termMatch || stateMatch;
      });
      
      const uniqueFiltered: BrokerContact[] = [];
      const seenNames = new Set<string>();
      const seenEmails = new Set<string>();
      
      for (const b of filtered) {
        const normName = normalizeHaulerName(b.haulerName);
        const normEmail = b.brokerEmail ? normalizeEmail(b.brokerEmail) : '';
        if (!seenNames.has(normName) && (!normEmail || !seenEmails.has(normEmail))) {
          uniqueFiltered.push(b);
          seenNames.add(normName);
          if (normEmail) seenEmails.add(normEmail);
        }
      }

      const results: SearchResult[] = uniqueFiltered.slice(0, 15).map(b => ({ 
        name: b.haulerName, 
        email: b.brokerEmail || '', 
        website: '', 
        snippet: b.notes || 'Local database match.' 
      }));
      processResults(results, 'Broker List');
      setIsSearching(false);
      setSearchStatus('');
      setSearchPhase(0);
    }, 1200);
  }, [location, brokerList, setIsSearching, setSearchStatus, setSearchPhase, processResults]);

  const handleDeepSearch = useCallback(() => {
    if (!location) return;
    setIsSearching(true);
    setSearchStatus("Performing Deep Registry Scan...");
    setSearchPhase(1);
    const searchState = extractState(location);
    const locLower = (location || "").toLowerCase();
    const searchTerms = locLower.split(/[\s,]+/).filter(t => t.length > 1);
    
    setTimeout(() => {
      const filtered = brokerList.filter(broker => {
        const nameLower = (broker.haulerName || "").toLowerCase();
        const notesLower = broker.notes?.toLowerCase() || '';
        const termMatch = searchTerms.some(term => nameLower.includes(term) || notesLower.includes(term));
        const stateMatch = broker.states?.some(s => searchTerms.some(term => s?.toLowerCase().includes(term)));
        const isStateSearch = locLower.length === 2 || searchState === locLower.toUpperCase();
        const stateKeywordMatch = isStateSearch && notesLower.includes(locLower);
        
        if (searchState) {
          const servesState = broker.states?.some(s => s.toUpperCase() === searchState);
          const isNational = broker.notes?.toLowerCase().includes('all') || broker.notes?.toLowerCase().includes('national');
          if (broker.states && broker.states.length > 0 && !servesState && !isNational) {
            if (!nameLower.includes(locLower) && !notesLower.includes(locLower)) return false;
          }
          if (servesState) return true;
        }
        return termMatch || stateMatch || stateKeywordMatch;
      });
      
      const uniqueFiltered: BrokerContact[] = [];
      const seenNames = new Set<string>();
      const seenEmails = new Set<string>();
      
      for (const b of filtered) {
        const normName = normalizeHaulerName(b.haulerName);
        const normEmail = b.brokerEmail ? normalizeEmail(b.brokerEmail) : '';
        if (!seenNames.has(normName) && (!normEmail || !seenEmails.has(normEmail))) {
          uniqueFiltered.push(b);
          seenNames.add(normName);
          if (normEmail) seenEmails.add(normEmail);
        }
      }

      const results: SearchResult[] = uniqueFiltered.slice(0, 25).map(b => ({ 
        name: b.haulerName, 
        email: b.brokerEmail || '', 
        website: '', 
        snippet: b.notes || 'Deep registry match.' 
      }));
      
      processResults(results, 'Search');
      setIsSearching(false);
      setSearchStatus('');
      setSearchPhase(0);
      showToast(`Deep search found ${results.length} matches.`);
    }, 1500);
  }, [location, brokerList, setIsSearching, setSearchStatus, setSearchPhase, processResults, showToast]);

  const handleUSWideSearch = useCallback(() => {
    setIsSearching(true);
    setSearchStatus("Scanning Nationwide Network...");
    setSearchPhase(1);
    const searchState = extractState(location);
    
    setTimeout(() => {
      const filtered = brokerList.filter(broker => {
        const isNational = broker.notes?.toLowerCase().includes('all') || 
                          broker.notes?.toLowerCase().includes('national') ||
                          (broker.haulerName || "").toLowerCase().includes('national');
        const isWide = isNational || (broker.states && broker.states.length >= 2) || (broker.haulerName || "").toLowerCase().includes('region');
        
        if (searchState && broker.states && broker.states.length > 0) {
          const servesState = broker.states?.some(s => s.toUpperCase() === searchState);
          if (!servesState && !isNational) return false;
        }
        return isWide;
      });
      
      const uniqueFiltered: BrokerContact[] = [];
      const seenNames = new Set<string>();
      const seenEmails = new Set<string>();
      
      for (const b of filtered) {
        const normName = normalizeHaulerName(b.haulerName);
        const normEmail = b.brokerEmail ? normalizeEmail(b.brokerEmail) : '';
        if (!seenNames.has(normName) && (!normEmail || !seenEmails.has(normEmail))) {
          uniqueFiltered.push(b);
          seenNames.add(normName);
          if (normEmail) seenEmails.add(normEmail);
        }
      }

      const results: SearchResult[] = uniqueFiltered.slice(0, 20).map(b => ({ 
        name: b.haulerName, 
        email: b.brokerEmail || '', 
        website: '', 
        snippet: b.notes || 'National partner match.' 
      }));
      
      processResults(results, 'Search');
      setIsSearching(false);
      setSearchStatus('');
      setSearchPhase(0);
      showToast(`Nationwide search identified ${results.length} partners.`);
    }, 1800);
  }, [location, brokerList, setIsSearching, setSearchStatus, setSearchPhase, processResults, showToast]);

  return {
    handleLocalSearch,
    handleDeepSearch,
    handleUSWideSearch
  };
};
