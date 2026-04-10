
export enum HaulerStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  REPLIED = 'Replied'
}

export enum HaulerType {
  CURRENT = 'Current',
  NEW = 'New',
  CLIENT = 'Client'
}

export interface BrokerContact {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  type?: string;
  rating?: number;
  haulerName: string;
  brokerEmail: string;
  secondaryEmail?: string;
  notes?: string;
  states?: string[];
  coordinates?: [number, number];
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
  attachments: HaulerAttachment[];
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

export enum TaskStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Task {
  id: string;
  haulerId?: string;
  haulerName?: string;
  title: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
  priority?: TaskPriority;
  createdAt: string;
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
  lastContacted?: string;
  draftSubject?: string;
  draftContent?: string;
  attachments: HaulerAttachment[];
  coordinates?: [number, number]; // [lat, lng]
}

export interface SearchResult {
  name: string;
  email: string;
  website?: string;
  snippet: string;
  sources?: { title: string; uri: string }[];
}

export interface IntelligenceResult {
  primaryHauler: {
    name: string;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string;
    proInsights: string[];
  };
  secondaryHaulers: {
    name: string;
    reasoning: string;
    proInsights: string[];
  }[];
  serviceType: 'franchise' | 'open-market' | 'hybrid';
  likelyContainerSetup: {
    commonSizes: string[];
    commonFrequencies: string[];
    description: string;
  };
  territoryLogic: {
    detailedExplanation: string;
    municipalContext: string;
    franchiseDetails?: string;
  };
  optionalEnhancements?: string;
  fullMarkdown: string;
}

export interface FollowUpStep {
  id: string;
  dayDelay?: number;
  delayDays?: number;
  templateId: string;
  type?: string;
}

export interface FollowUpSequence {
  id: string;
  name: string;
  steps: FollowUpStep[];
  isActive?: boolean;
}

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: string;
  companyName?: string;
  logoUrl?: string;
  borderRadius?: string;
  darkMode?: boolean;
}

export type SortKey = 'name' | 'status' | 'type' | 'lastActionDate';

export interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export interface Placeholder {
  label: string;
  key: string;
}
