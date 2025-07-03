import { expect, setupTestEnvironment, getTestPaths } from '../helpers/test-setup.js';
import { BkperMcpServerType, TransactionData, BookData } from '../helpers/mock-interfaces.js';
import { setupMocks, createMockBkperForBook, setMockBkper } from '../helpers/mock-factory.js';
import { loadTransactions, loadBooks } from '../helpers/fixture-loader.js';

const { __dirname } = getTestPaths(import.meta.url);

// Load test data
const mockBooks: BookData[] = loadBooks(__dirname);
const mockTransactions: TransactionData[] = loadTransactions(__dirname);

let currentMockTransactions: TransactionData[] = mockTransactions;

// Setup mocks and import server
setupMocks();

const { BkperMcpServer } = await import('../../../src/mcp/server.js');

describe('MCP Server - list_transactions Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockTransactions = mockTransactions;
    // Create mock with books + transactions support
    const mockBkper = createMockBkperForBook(mockBooks, undefined, currentMockTransactions);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should register list_transactions tool in MCP tools list', async function() {
    const response = await server.testListTools();
    
    const listTransactionsTool = response.tools.find((tool: any) => tool.name === 'list_transactions');
    
    // This test will FAIL until list_transactions tool is implemented
    expect(listTransactionsTool).to.exist;
    expect(listTransactionsTool!.name).to.equal('list_transactions');
    expect(listTransactionsTool!.description).to.include('cursor-based pagination');
    expect(listTransactionsTool!.description).to.include('query support');
    expect(listTransactionsTool!.inputSchema).to.have.property('properties');
    expect(listTransactionsTool!.inputSchema.properties).to.have.property('bookId');
    expect(listTransactionsTool!.inputSchema.properties).to.have.property('query');
    expect(listTransactionsTool!.inputSchema.properties).to.have.property('limit');
    expect(listTransactionsTool!.inputSchema.properties).to.have.property('cursor');
    expect(listTransactionsTool!.inputSchema.required).to.include('bookId');
  });

  it('should handle MCP list_transactions tool call', async function() {
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
  });
});

// Additional MCP-focused tests can be added here following the same pattern
// The old business logic tests have been removed in favor of MCP protocol testing