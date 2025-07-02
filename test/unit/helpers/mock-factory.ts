import {
  MockBkper,
  MockBook,
  MockAccount,
  MockTransaction,
  MockBalance,
  MockAccountBalance,
  MockGroup,
  MockDataTableBuilder,
  BookData,
  AccountData,
  TransactionData,
  BalanceData,
  AccountBalanceData
} from './mock-interfaces.js';

// Mock auth service
export const mockGetOAuthToken = async (): Promise<string> => 'mock-token';

// Mock DataTableBuilder implementation
function createMockDataTableBuilder(balances: AccountBalanceData[], query?: string): MockDataTableBuilder {
  let formatValues = false;
  let formatDates = false;
  let transposed = false;
  let raw = false;

  return {
    formatValues(format: boolean): MockDataTableBuilder {
      formatValues = format;
      return this;
    },
    formatDates(format: boolean): MockDataTableBuilder {
      formatDates = format;
      return this;
    },
    transposed(transpose: boolean): MockDataTableBuilder {
      transposed = transpose;
      return this;
    },
    raw(rawMode: boolean): MockDataTableBuilder {
      raw = rawMode;
      return this;
    },
    build(): any[][] {
      // Determine if this is a time-based query
      const isTimeBased = query?.includes('on:') || query?.includes('after:') || query?.includes('before:');
      
      if (isTimeBased && transposed) {
        // Period/Cumulative format - transposed (dates as columns)
        return [
          ["Account", "2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
          ["Cash", 5000.00, 6200.00, 5900.00, 8400.00, 8250.00],
          ["Accounts Receivable", 0.00, 0.00, 0.00, 0.00, 0.00],
          ["Service Revenue", -5000.00, -1200.00, 0.00, -2500.00, 0.00],
          ["Office Rent", 0.00, 0.00, 300.00, 0.00, 150.00]
        ];
      } else {
        // Total format - standard (accounts as rows)
        const matrix: any[][] = [["Account Name", "Balance"]];
        
        balances.forEach(balance => {
          const balanceValue = parseFloat(balance.balance);
          matrix.push([balance.account.name || '', balanceValue]);
        });
        
        return matrix;
      }
    }
  };
}

// Setup module mocking - centralized function used by all tests
export async function setupMocks() {
  const originalImport = await import('module');
  const ModuleClass = originalImport.Module as any;
  const originalResolveFilename = ModuleClass._resolveFilename;
  const originalLoad = ModuleClass.load;

  ModuleClass._resolveFilename = function(request: string, parent: any, isMain?: boolean) {
    if (request === 'bkper-js') {
      return 'mocked-bkper-js';
    }
    if (request.includes('local-auth-service.js')) {
      return 'mocked-auth-service';
    }
    return originalResolveFilename.call(this, request, parent, isMain);
  };

  ModuleClass.load = function(filename: string) {
    if (filename === 'mocked-bkper-js') {
      const mockBkper = (globalThis as any).__mockBkper;
      if (mockBkper) {
        (this as any).exports = { Bkper: mockBkper };
      }
      return;
    }
    if (filename === 'mocked-auth-service') {
      (this as any).exports = { getOAuthToken: mockGetOAuthToken };
      return;
    }
    return originalLoad.call(this, filename);
  };
}

// Factory for creating MockBkper instances for books listing
export function createMockBkperForBooks(books: BookData[]): MockBkper {
  return {
    setConfig: () => {},
    getBooks: async (query?: string): Promise<MockBook[]> => {
      let filteredBooks = books;
      
      // Apply name filtering if query is provided
      if (query && query.trim()) {
        filteredBooks = books.filter((book: BookData) => 
          book.name?.toLowerCase().includes(query.toLowerCase()) || false
        );
      }
      
      return filteredBooks.map((bookData: BookData) => ({
        json: (): BookData => bookData
      }));
    }
  };
}

// Factory for creating MockBkper instances for single book operations
export function createMockBkperForBook(
  books: BookData[], 
  accounts?: AccountData[], 
  transactions?: TransactionData[], 
  accountBalances?: AccountBalanceData[]
): MockBkper {
  return {
    setConfig: () => {},
    getBook: async (id: string): Promise<MockBook> => {
      const book = books.find(b => b.id === id);
      if (!book) {
        throw new Error(`Book not found: ${id}`);
      }
      
      return {
        json: (): BookData => book,
        
        // Accounts support
        getAccounts: accounts ? async (): Promise<MockAccount[]> => 
          accounts.map((accountData: AccountData) => ({
            json: (): AccountData => accountData,
            getId: (): string => accountData.id || '',
            getName: (): string => accountData.name || '',
            getType: (): string => accountData.type || ''
          })) : undefined,
        
        // Account Balances support
        getBalancesReport: accountBalances ? async (query?: string): Promise<any> => {
          let filteredBalances = accountBalances;
          
          // Handle query filtering - empty/undefined queries use 'on:$m' default
          const effectiveQuery = query || 'on:$m';
          if (effectiveQuery && effectiveQuery.trim() && effectiveQuery !== 'on:$m') {
            // Simple query simulation for testing
            if (effectiveQuery.includes("account:'Cash'")) {
              filteredBalances = accountBalances.filter(b => b.account.name === 'Cash');
            } else if (effectiveQuery.includes("group:'Assets'")) {
              filteredBalances = accountBalances.filter(b => b.account.type === 'ASSET');
            } else if (effectiveQuery.includes("group:'Liabilities'")) {
              filteredBalances = accountBalances.filter(b => b.account.type === 'LIABILITY');
            }
          }
          // For 'on:$m' default or other date queries, return all balances (no filtering in mock)
          
          return {
            getBalancesContainers: (): MockAccountBalance[] => {
              const containers = filteredBalances.map((balanceData: AccountBalanceData) => ({
                json: (): AccountBalanceData => balanceData,
                getAccount: (): MockAccount => ({
                  json: (): AccountData => balanceData.account,
                  getId: (): string => balanceData.account.id || '',
                  getName: (): string => balanceData.account.name || '',
                  getType: (): string => balanceData.account.type || ''
                }),
                getGroup: (): MockGroup | null => null,
                getName: (): string => balanceData.account.name || '',
                getPeriodBalance: (): string => balanceData.balance,
                getCumulativeBalance: (): string => balanceData.cumulative,
                createDataTable: (): MockDataTableBuilder => createMockDataTableBuilder(filteredBalances, effectiveQuery)
              }));
              
              // For matrix functionality, we need to add createDataTable to the first container
              // This simulates the real API where you call it on the first container or the report
              if (containers.length > 0) {
                containers[0].createDataTable = () => createMockDataTableBuilder(filteredBalances, effectiveQuery);
              }
              
              return containers;
            }
          };
        } : undefined,
        
        // Transactions support
        listTransactions: transactions ? async (query?: string, limit?: number, cursor?: string): Promise<any> => {
          let filteredTransactions = transactions;
          
          if (query) {
            // Simple query simulation for testing
            if (query.includes("posted:true")) {
              filteredTransactions = transactions.filter(t => t.posted === true);
            } else if (query.includes("posted:false")) {
              filteredTransactions = transactions.filter(t => t.posted === false);
            } else if (query.includes("account:'Cash'")) {
              filteredTransactions = transactions.filter(t => 
                t.creditAccount?.name === 'Cash' || t.debitAccount?.name === 'Cash'
              );
            }
          }
          
          // Simple cursor-based pagination simulation
          let startIndex = 0;
          if (cursor) {
            try {
              const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString());
              startIndex = cursorData.offset || 0;
            } catch {
              startIndex = 0; // Invalid cursor, start from beginning
            }
          }
          
          const pageSize = limit || 50;
          const endIndex = startIndex + pageSize;
          const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
          const hasMore = endIndex < filteredTransactions.length;
          const nextCursor = hasMore ? 
            Buffer.from(JSON.stringify({ offset: endIndex, timestamp: Date.now() })).toString('base64') : 
            undefined;
          
          return {
            getItems: (): MockTransaction[] => pageTransactions.map((transactionData: TransactionData) => ({
              json: (): TransactionData => transactionData
            })),
            getCursor: () => nextCursor
          };
        } : undefined
      };
    }
  };
}

// Set the mock in the module system
export function setMockBkper(mockBkper: MockBkper) {
  // This function updates the global mock that will be used by setupMocks
  // We'll use a global variable to store the current mock
  (globalThis as any).__mockBkper = mockBkper;
}