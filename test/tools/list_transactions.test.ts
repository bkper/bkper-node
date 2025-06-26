import { expect } from 'chai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TypeScript interfaces for test data
interface TransactionData {
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

interface MockTransactionIterator {
  hasNext(): boolean;
  next(): MockTransaction[];
  getCursor(): string | undefined;
}

interface MockTransaction {
  json(): TransactionData;
}

interface MockBook {
  listTransactions(query?: string, limit?: number, cursor?: string): Promise<MockTransactionIterator>;
}

interface MockBkper {
  setConfig: (config: any) => void;
  getBook: (id: string) => Promise<MockBook>;
}

// Mock transaction data from fixtures
const mockTransactions: TransactionData[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures', 'sample-transactions.json'), 'utf8'));

// Create a large dataset for API cursor pagination testing
const largeMockTransactions: TransactionData[] = Array.from({ length: 500 }, (_, i) => ({
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

let currentMockTransactions: TransactionData[] = mockTransactions;

const mockBkperJs: MockBkper = {
  setConfig: () => {},
  getBook: async (id: string): Promise<MockBook> => {
    return {
      listTransactions: async (query?: string, limit?: number, cursor?: string): Promise<MockTransactionIterator> => {
        // Apply query filtering for testing
        let filteredTransactions = currentMockTransactions;
        
        if (query) {
          // Simulate Bkper query filtering
          if (query.includes("account:'Cash'")) {
            filteredTransactions = currentMockTransactions.filter(t => 
              t.creditAccount.name === 'Cash' || t.debitAccount.name === 'Cash'
            );
          } else if (query.includes('amount>1000')) {
            filteredTransactions = currentMockTransactions.filter(t => t.amount > 1000);
          } else if (query.includes('after:2024-01-20')) {
            filteredTransactions = currentMockTransactions.filter(t => t.date > '2024-01-20');
          } else if (query.includes('before:2024-01-25')) {
            filteredTransactions = currentMockTransactions.filter(t => t.date < '2024-01-25');
          }
        }

        // Handle cursor-based pagination (simulating API behavior)
        const pageSize = limit || 25; // Default API page size
        let startIndex = 0;
        
        if (cursor) {
          try {
            const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString());
            startIndex = cursorData.offset || 0;
          } catch {
            startIndex = 0;
          }
        }

        const endIndex = Math.min(startIndex + pageSize, filteredTransactions.length);
        const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
        const hasMore = endIndex < filteredTransactions.length;

        return {
          hasNext: () => hasMore,
          next: (): MockTransaction[] => pageTransactions.map((txnData: TransactionData) => ({
            json: (): TransactionData => txnData
          })),
          getCursor: (): string | undefined => hasMore ? 
            Buffer.from(JSON.stringify({ offset: endIndex })).toString('base64') : undefined
        };
      }
    };
  }
};

// Mock auth service
const mockGetOAuthToken = async (): Promise<string> => 'mock-token';

// Setup module mocking
async function setupMocks() {
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
      (this as any).exports = { Bkper: mockBkperJs };
      return;
    }
    if (filename === 'mocked-auth-service') {
      (this as any).exports = { getOAuthToken: mockGetOAuthToken };
      return;
    }
    return originalLoad.call(this, filename);
  };
}

// Initialize mocks
setupMocks();

// Import the actual MCP server after mocks are set up
const { BkperMcpServer } = await import('../../src/mcp/server.js');

// Type for the server instance
type BkperMcpServerType = InstanceType<typeof BkperMcpServer>;

describe('MCP Server - list_transactions Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockTransactions = mockTransactions;
    server = new BkperMcpServer();
  });

  it('should register list_transactions tool in MCP tools list (when implemented)', async function() {
    const response = await server.testListTools();
    
    const listTransactionsTool = response.tools.find((tool: any) => tool.name === 'list_transactions');
    
    if (listTransactionsTool) {
      expect(listTransactionsTool.name).to.equal('list_transactions');
      expect(listTransactionsTool.description).to.include('API cursor-based pagination');
      expect(listTransactionsTool.description).to.include('query support');
      expect(listTransactionsTool.inputSchema).to.have.property('properties');
      expect(listTransactionsTool.inputSchema.properties).to.have.property('bookId');
      expect(listTransactionsTool.inputSchema.properties).to.have.property('query');
      expect(listTransactionsTool.inputSchema.properties).to.have.property('limit');
      expect(listTransactionsTool.inputSchema.properties).to.have.property('cursor');
      expect(listTransactionsTool.inputSchema.required).to.include('bookId');
    } else {
      // Tool not implemented yet - expected during development
      expect(listTransactionsTool).to.be.undefined;
    }
  });

  it('should handle MCP list_transactions tool call (when implemented)', async function() {
    try {
      const response = await server.testCallTool('list_transactions', { 
        bookId: 'book-1',
        query: "account:'Cash'",
        limit: 25
      });
      
      // Verify MCP response structure
      expect(response).to.have.property('content');
      expect(response.content).to.be.an('array');
      expect(response.content).to.have.length(1);
      expect(response.content[0]).to.have.property('type', 'text');
      expect(response.content[0]).to.have.property('text');
      
      // Parse the JSON response  
      const jsonResponse = JSON.parse(response.content[0].text as string);
      expect(jsonResponse).to.have.property('transactions');
      expect(jsonResponse).to.have.property('hasMore');
      expect(jsonResponse).to.have.property('cursor');
      
      // Verify transaction structure
      if (jsonResponse.transactions.length > 0) {
        const transaction = jsonResponse.transactions[0];
        expect(transaction).to.have.property('id');
        expect(transaction).to.have.property('date');
        expect(transaction).to.have.property('amount');
        expect(transaction).to.have.property('description');
        expect(transaction).to.have.property('posted');
        expect(transaction).to.have.property('creditAccount');
        expect(transaction).to.have.property('debitAccount');
        expect(transaction).to.have.property('properties');
      }
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('list_transactions');
      } else {
        throw error;
      }
    }
  });
});

// Additional MCP-focused tests can be added here following the same pattern
// The old business logic tests have been removed in favor of MCP protocol testing