// TypeScript interfaces for test data - matches bkper API types

export interface BookData {
  id?: string;
  name?: string;
  collection?: any;
  agentId?: string;
  autoPost?: boolean;
  closingDate?: string;
  createdAt?: string;
  datePattern?: string;
  decimalSeparator?: "DOT" | "COMMA";
  fractionDigits?: number;
  groups?: any[];
  lastUpdateMs?: string;
  lockDate?: string;
  ownerName?: string;
  pageSize?: number;
  period?: "MONTH" | "QUARTER" | "YEAR";
  periodStartMonth?: any;
  permission?: any;
  properties?: {[name: string]: string};
  timeZone?: string;
  timeZoneOffset?: number;
  totalTransactions?: number;
  totalTransactionsCurrentMonth?: number;
  totalTransactionsCurrentYear?: number;
  visibility?: "PUBLIC" | "PRIVATE";
  accounts?: any[];
}

export interface AccountData {
  id: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "OUTGOING";
  balance: number;
  normalizedBalance: number;
  group?: {
    id: string;
    name: string;
  };
  properties: {[name: string]: string};
  archived: boolean;
  permanent: boolean;
}

export interface TransactionData {
  id: string;
  date: string;
  dateValue: number;
  amount: number;
  description: string;
  posted: boolean;
  creditAccount: {
    id: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "OUTGOING";
  };
  debitAccount: {
    id: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "OUTGOING";
  };
  properties: {[name: string]: string};
  urls: string[];
}

export interface BalanceData {
  account: {
    id: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "OUTGOING";
  };
  balance: number;
  normalizedBalance: number;
  cumulative: number;
  group?: {
    id: string;
    name: string;
  };
}

// Mock interfaces for bkper-js library
export interface MockBook {
  json(): BookData;
  getAccounts?(): Promise<MockAccount[]>;
  getBalancesReport?(query?: string): Promise<MockBalanceReport>;
  listTransactions?(query?: string, limit?: number, cursor?: string): Promise<MockTransactionIterator>;
}

export interface MockAccount {
  json(): AccountData;
}

export interface MockTransaction {
  json(): TransactionData;
}

export interface MockBalance {
  json(): BalanceData;
}

export interface MockBalanceReport {
  getBalances(): Promise<MockBalance[]>;
}

export interface MockTransactionIterator {
  hasNext(): boolean;
  next(): MockTransaction[];
  getCursor(): string | undefined;
}

export interface MockBkper {
  setConfig: (config: any) => void;
  getBooks?(): Promise<MockBook[]>;
  getBook?(id: string): Promise<MockBook>;
}

// BkperMcpServer type helper
export type BkperMcpServerType = InstanceType<typeof import('../../src/mcp/server.js').BkperMcpServer>;