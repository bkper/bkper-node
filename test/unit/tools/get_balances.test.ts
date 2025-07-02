import { expect, setupTestEnvironment, getTestPaths } from '../helpers/test-setup.js';
import { BkperMcpServerType, AccountBalanceData, BookData } from '../helpers/mock-interfaces.js';
import { setupMocks, createMockBkperForBook, setMockBkper } from '../helpers/mock-factory.js';
import { loadAccountBalances, generateLargeAccountBalances, loadBooks, loadBalanceMatrixTotal, loadBalanceMatrixPeriod } from '../helpers/fixture-loader.js';

const { __dirname } = getTestPaths(import.meta.url);

// Load test data
const mockBooks: BookData[] = loadBooks(__dirname);
const mockAccountBalances: AccountBalanceData[] = loadAccountBalances(__dirname);
const largeMockAccountBalances: AccountBalanceData[] = generateLargeAccountBalances(150);
const mockMatrixTotal: any[][] = loadBalanceMatrixTotal(__dirname);
const mockMatrixPeriod: any[][] = loadBalanceMatrixPeriod(__dirname);

let currentMockAccountBalances: AccountBalanceData[] = mockAccountBalances;

// Setup mocks and import server
setupMocks();

const { BkperMcpServer } = await import('../../../src/mcp/server.js');

describe('MCP Server - get_balances Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockAccountBalances = mockAccountBalances;
    // Create mock with books + account balances support
    const mockBkper = createMockBkperForBook(mockBooks, undefined, undefined, currentMockAccountBalances);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should register get_balances tool in MCP tools list', async function() {
    const response = await server.testListTools();
    
    const getBalancesTool = response.tools.find((tool: any) => tool.name === 'get_balances');
    
    // This test will FAIL until get_balances tool is implemented
    expect(getBalancesTool).to.exist;
    expect(getBalancesTool!.name).to.equal('get_balances');
    expect(getBalancesTool!.description).to.include('all account balances');
    expect(getBalancesTool!.inputSchema).to.have.property('properties');
    expect(getBalancesTool!.inputSchema.properties).to.have.property('bookId');
    expect(getBalancesTool!.inputSchema.properties).to.have.property('query');
    expect(getBalancesTool!.inputSchema.properties).to.not.have.property('cursor');
    expect(getBalancesTool!.inputSchema.properties).to.not.have.property('limit');
    expect(getBalancesTool!.inputSchema.required).to.include('bookId');
  });

  it('should have proper MCP tool schema for get_balances', async function() {
    const response = await server.testListTools();
    const getBalancesTool = response.tools.find((tool: any) => tool.name === 'get_balances');
    
    expect(getBalancesTool).to.exist;
    expect(getBalancesTool!.inputSchema).to.deep.equal({
      type: 'object',
      properties: {
        bookId: {
          type: 'string',
          description: 'The unique identifier of the book'
        },
        query: {
          type: 'string',
          description: 'Optional query to filter balances (e.g., "account:\'Cash\'", "group:\'Assets\'", "on:2024-01-31")'
        }
      },
      required: ['bookId']
    });
  });
});

describe('MCP Server - get_balances Tool Calls', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockAccountBalances = mockAccountBalances;
    // Create mock with books + account balances support
    const mockBkper = createMockBkperForBook(mockBooks, undefined, undefined, currentMockAccountBalances);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should handle MCP get_balances tool call without query', async function() {
    const response = await server.testCallTool('get_balances', { bookId: 'book-1' });
    
    // Verify MCP response structure
    expect(response).to.have.property('content');
    expect(response.content).to.be.an('array');
    expect(response.content).to.have.length(1);
    expect(response.content[0]).to.have.property('type', 'text');
    expect(response.content[0]).to.have.property('text');
    
    // Parse the JSON response
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse).to.have.property('matrix');
    expect(jsonResponse).to.have.property('query');
    expect(jsonResponse).to.not.have.property('total');
    expect(jsonResponse).to.not.have.property('balances');
    
    // Verify matrix structure
    expect(jsonResponse.matrix).to.be.an('array');
    expect(jsonResponse.matrix).to.have.length.greaterThan(0);
    
    // First row should be headers
    const headers = jsonResponse.matrix[0];
    expect(headers).to.deep.equal(['Account Name', 'Balance']);
    
    // Subsequent rows should have account name and numeric balance
    if (jsonResponse.matrix.length > 1) {
      const firstDataRow = jsonResponse.matrix[1];
      expect(firstDataRow).to.have.length(2);
      expect(firstDataRow[0]).to.be.a('string'); // Account name
      expect(firstDataRow[1]).to.be.a('number'); // Balance as number
    }
  });

  it('should handle MCP get_balances tool call with query filter', async function() {
    const response = await server.testCallTool('get_balances', { 
      bookId: 'book-1',
      query: "account:'Cash'"
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    
    // Verify matrix structure and filter results
    expect(jsonResponse.matrix).to.be.an('array');
    expect(jsonResponse.matrix[0]).to.deep.equal(['Account Name', 'Balance']);
    
    // Verify all returned data rows are for Cash account
    const dataRows = jsonResponse.matrix.slice(1);
    dataRows.forEach((row: any) => {
      expect(row[0]).to.equal('Cash');
      expect(row[1]).to.be.a('number');
    });
  });

  it('should handle MCP get_balances tool call with large dataset', async function() {
    // Switch to large dataset
    currentMockAccountBalances = largeMockAccountBalances;
    const mockBkper = createMockBkperForBook(mockBooks, undefined, undefined, currentMockAccountBalances);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
    
    // Call to get all balances
    const response = await server.testCallTool('get_balances', { bookId: 'book-1' });
    const jsonResponse = JSON.parse(response.content[0].text as string);
    
    expect(jsonResponse.matrix).to.be.an('array');
    expect(jsonResponse.matrix).to.have.length(151); // 150 data rows + 1 header row
    expect(jsonResponse.matrix[0]).to.deep.equal(['Account Name', 'Balance']);
    expect(jsonResponse).to.not.have.property('total');
    expect(jsonResponse).to.not.have.property('balances');
  });

  it('should handle MCP error for missing bookId parameter', async function() {
    try {
      await server.testCallTool('get_balances', {});
      expect.fail('Should have thrown an error for missing bookId');
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });

  it('should handle balance query examples via MCP', async function() {
    // Test different query patterns
    const accountQuery = await server.testCallTool('get_balances', { 
      bookId: 'book-1',
      query: "account:'Cash'"
    });
    
    const groupQuery = await server.testCallTool('get_balances', { 
      bookId: 'book-1',
      query: "group:'Assets'"
    });
    
    const dateQuery = await server.testCallTool('get_balances', { 
      bookId: 'book-1',
      query: "on:2024-01-31"
    });
    
    // All should return valid MCP responses with matrix format
    [accountQuery, groupQuery, dateQuery].forEach(response => {
      expect(response).to.have.property('content');
      expect(response.content[0]).to.have.property('type', 'text');
      const data = JSON.parse(response.content[0].text as string);
      expect(data).to.have.property('matrix');
      expect(data).to.have.property('query');
      expect(data.matrix).to.be.an('array');
      expect(data.matrix).to.have.length.greaterThan(0);
      expect(data).to.not.have.property('total');
      expect(data).to.not.have.property('balances');
    });
  });
});