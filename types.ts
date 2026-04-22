
export enum HaulerStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  REPLIED = 'Replied',
  CONTACTED = 'Contacted',
  BID_SUBMITTED = 'Bid Submitted',
  NEGOTIATING = 'Negotiating',
  WON = 'Won',
  LOST = 'Lost'
}

export enum HaulerType {
  CURRENT = 'Current',
  NEW = 'New'
}

export interface BrokerContact {
  haulerName: string;
  brokerEmail: string;
  secondaryEmail?: string;
  notes?: string;
  states?: string[];
}

export interface HaulerAttachment {
  name: string;
  size: number;
  type: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: HaulerType;
  subject: string;
  content: string;
}

export interface SavedSearch {
  id: string;
  timestamp: string;
  name: string;
  location: string;
  facilityAddress: string;
  currentHaulerName: string;
  searchRadius: number | '';
  haulerTypeFilter: 'all' | HaulerType;
  serviceAreaFilter: string;
  stateFilter: string;
  clientRef: string;
  accountInfo: string;
}

export interface Hauler {
  id: string;
  name: string;
  location: string;
  email: string;
  secondaryEmail?: string;
  website?: string;
  type: HaulerType;
  status: HaulerStatus;
  contactSource: 'Search' | 'Broker List';
  lastActionDate: string;
  draftSubject?: string;
  draftContent?: string;
  attachments: HaulerAttachment[];
  coordinates?: [number, number]; // [lat, lng]
  followUpDate?: string; // ISO date string
  followUpTemplateId?: string;
}

export interface SearchResult {
  name: string;
  email: string;
  website?: string;
  snippet: string;
  sources?: { title: string; uri: string }[];
}
