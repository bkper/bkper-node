import fs from 'fs';
import path from 'path';
import {
  BookData,
  AccountData,
  TransactionData,
  BalanceData
} from './mock-interfaces.js';

// Centralized fixture loading
export function loadFixture<T>(testDir: string, fixtureName: string): T[] {
  // testDir is the directory containing the test file
  // For files in test/tools/, go up to test/ directory, then to fixtures/
  // For files in test/ directly, go to fixtures/
  let fixturePath: string;
  if (testDir.includes('/tools')) {
    fixturePath = path.join(testDir, '..', 'fixtures', fixtureName);
  } else {
    fixturePath = path.join(testDir, 'fixtures', fixtureName);
  }
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

// Load specific fixture types
export function loadBooks(testDir: string): BookData[] {
  return loadFixture<BookData>(testDir, 'sample-books.json');
}

export function loadLargeBooks(testDir: string): BookData[] {
  return loadFixture<BookData>(testDir, 'large-books-dataset.json');
}

export function loadAccounts(testDir: string): AccountData[] {
  return loadFixture<AccountData>(testDir, 'sample-accounts.json');
}

export function loadTransactions(testDir: string): TransactionData[] {
  return loadFixture<TransactionData>(testDir, 'sample-transactions.json');
}

export function loadBalances(testDir: string): BalanceData[] {
  return loadFixture<BalanceData>(testDir, 'sample-balances.json');
}

// Large dataset generators for pagination testing
export function generateLargeAccounts(count: number = 150): AccountData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `account-${i + 1}`,
    name: `Account ${i + 1}`,
    type: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "OUTGOING"][i % 5] as any,
    balance: Math.floor(Math.random() * 10000),
    normalizedBalance: Math.floor(Math.random() * 10000),
    group: {
      id: `group-${Math.floor(i / 10)}`,
      name: `Group ${Math.floor(i / 10)}`
    },
    properties: {},
    archived: false,
    permanent: false
  }));
}

export function generateLargeTransactions(count: number = 500): TransactionData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `txn-${i + 1}`,
    date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
    dateValue: Date.now() + (i * 24 * 60 * 60 * 1000),
    amount: Math.floor(Math.random() * 5000) + 100,
    description: `Transaction ${i + 1} - ${['Service payment', 'Equipment purchase', 'Utility bill', 'Office rent', 'Consulting fee'][i % 5]}`,
    posted: Math.random() > 0.1, // 90% posted
    creditAccount: {
      id: `account-${(i % 10) + 1}`,
      name: `Account ${(i % 10) + 1}`,
      type: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "OUTGOING"][i % 5] as any
    },
    debitAccount: {
      id: `account-${((i + 1) % 10) + 1}`,
      name: `Account ${((i + 1) % 10) + 1}`,
      type: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "OUTGOING"][(i + 1) % 5] as any
    },
    properties: { batch: String(Math.floor(i / 50)) },
    urls: []
  }));
}

export function generateLargeBalances(count: number = 150): BalanceData[] {
  return Array.from({ length: count }, (_, i) => ({
    account: {
      id: `account-${i + 1}`,
      name: `Account ${i + 1}`,
      type: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "OUTGOING"][i % 5] as any
    },
    balance: Math.floor(Math.random() * 10000) - 5000, // Can be positive or negative
    normalizedBalance: Math.abs(Math.floor(Math.random() * 10000)),
    cumulative: Math.floor(Math.random() * 50000),
    group: {
      id: `group-${Math.floor(i / 10)}`,
      name: `Group ${Math.floor(i / 10)}`
    }
  }));
}