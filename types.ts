
export enum HaulerStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  REPLIED = 'Replied'
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

export interface Task {
  id: string;
  haulerId?: string;
  haulerName?: string;
  title: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
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
