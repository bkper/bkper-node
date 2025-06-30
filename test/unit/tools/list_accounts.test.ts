import { expect, setupTestEnvironment, getTestPaths } from '../helpers/test-setup.js';
import { BkperMcpServerType, AccountData, BookData } from '../helpers/mock-interfaces.js';
import { setupMocks, createMockBkperForBook, setMockBkper } from '../helpers/mock-factory.js';
import { loadAccounts, generateLargeAccounts, loadBooks } from '../helpers/fixture-loader.js';

const { __dirname } = getTestPaths(import.meta.url);

// Load test data
const mockBooks: BookData[] = loadBooks(__dirname);
const mockAccounts: AccountData[] = loadAccounts(__dirname);
const largeMockAccounts: AccountData[] = generateLargeAccounts(150);

let currentMockAccounts: AccountData[] = mockAccounts;

// Setup mocks and import server
setupMocks();

const { BkperMcpServer } = await import('../../../src/mcp/server.js');

describe('MCP Server - list_accounts Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockAccounts = mockAccounts;
    // Create mock with books + accounts support
    const mockBkper = createMockBkperForBook(mockBooks, currentMockAccounts);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should register list_accounts tool in MCP tools list', async function() {
    const response = await server.testListTools();
    
    const listAccountsTool = response.tools.find((tool: any) => tool.name === 'list_accounts');
    
    // This test will FAIL until list_accounts tool is implemented
    expect(listAccountsTool).to.exist;
    expect(listAccountsTool!.name).to.equal('list_accounts');
    expect(listAccountsTool!.description).to.include('fixed 50-item pagination');
    expect(listAccountsTool!.inputSchema).to.have.property('properties');
    expect(listAccountsTool!.inputSchema.properties).to.have.property('bookId');
    expect(listAccountsTool!.inputSchema.properties).to.have.property('cursor');
    expect(listAccountsTool!.inputSchema.properties).to.not.have.property('limit');
    expect(listAccountsTool!.inputSchema.required).to.include('bookId');
  });

  it('should have proper MCP tool schema for list_accounts', async function() {
    const response = await server.testListTools();
    const listAccountsTool = response.tools.find((tool: any) => tool.name === 'list_accounts');
    
    if (listAccountsTool) {
      expect(listAccountsTool.inputSchema).to.deep.equal({
        type: 'object',
        properties: {
          bookId: {
            type: 'string',
            description: 'The unique identifier of the book'
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for next page'
          }
        },
        required: ['bookId']
      });
    } else {
      // Expected during development
      expect(listAccountsTool).to.be.undefined;
    }
  });
});

describe('MCP Server - list_accounts Tool Calls', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockAccounts = mockAccounts;
    // Create mock with books + accounts support
    const mockBkper = createMockBkperForBook(mockBooks, currentMockAccounts);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should handle MCP list_accounts tool call without cursor', async function() {
    const response = await server.testCallTool('list_accounts', { bookId: 'book-1' });
    
    // Verify MCP response structure
    expect(response).to.have.property('content');
    expect(response.content).to.be.an('array');
    expect(response.content).to.have.length(1);
    expect(response.content[0]).to.have.property('type', 'text');
    expect(response.content[0]).to.have.property('text');
    
    // Parse the JSON response
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse).to.have.property('total');
    expect(jsonResponse).to.have.property('accounts');
    expect(jsonResponse).to.have.property('pagination');
    
    expect(jsonResponse.total).to.equal(10);
    expect(jsonResponse.accounts).to.have.length(10);
    expect(jsonResponse.pagination.limit).to.equal(50);
    expect(jsonResponse.pagination.offset).to.equal(0);
    expect(jsonResponse.pagination.hasMore).to.be.false;
    
    // Verify account structure
    const account = jsonResponse.accounts[0];
    expect(account).to.have.property('id');
    expect(account).to.have.property('name');
    expect(account).to.have.property('type');
    expect(account).to.have.property('balance');
    expect(account).to.have.property('group');
  });

  it('should handle MCP list_accounts tool call with cursor', async function() {
    // Switch to large dataset
    currentMockAccounts = largeMockAccounts;
    const mockBkper = createMockBkperForBook(mockBooks, currentMockAccounts);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
    
    // First call to get cursor
    const firstResponse = await server.testCallTool('list_accounts', { bookId: 'book-1' });
    const firstData = JSON.parse(firstResponse.content[0].text as string);
    
    expect(firstData.pagination.hasMore).to.be.true;
    expect(firstData.pagination.nextCursor).to.be.a('string');
    
    // Second call with cursor
    const response = await server.testCallTool('list_accounts', { 
      bookId: 'book-1',
      cursor: firstData.pagination.nextCursor 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.pagination.offset).to.equal(50);
    expect(jsonResponse.accounts).to.have.length(50);
  });

  it('should handle MCP error for missing bookId parameter', async function() {
    try {
      await server.testCallTool('list_accounts', {});
      expect.fail('Should have thrown an error for missing bookId');
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });

  it('should handle account type organization via MCP', async function() {
    // Switch to large dataset with different account types
    currentMockAccounts = largeMockAccounts;
    const mockBkper = createMockBkperForBook(mockBooks, currentMockAccounts);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
    
    const response = await server.testCallTool('list_accounts', { bookId: 'book-1' });
    const jsonResponse = JSON.parse(response.content[0].text as string);
    
    // Verify we have different account types (using correct Bkper API types)
    const accounts = jsonResponse.accounts;
    const assetAccounts = accounts.filter((acc: any) => acc.type === 'ASSET');
    const liabilityAccounts = accounts.filter((acc: any) => acc.type === 'LIABILITY');
    const incomingAccounts = accounts.filter((acc: any) => acc.type === 'INCOMING');
    const outgoingAccounts = accounts.filter((acc: any) => acc.type === 'OUTGOING');

    expect(assetAccounts.length).to.be.greaterThan(0);
    expect(liabilityAccounts.length).to.be.greaterThan(0);
    expect(incomingAccounts.length).to.be.greaterThan(0);
    expect(outgoingAccounts.length).to.be.greaterThan(0);
  });
});