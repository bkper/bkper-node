import { expect, setupTestEnvironment, getTestPaths } from '../helpers/test-setup.js';
import { BkperMcpServerType, BookData } from '../helpers/mock-interfaces.js';
import { setupMocks, createMockBkperForBooks, setMockBkper } from '../helpers/mock-factory.js';
import { loadBooks, loadLargeBooks } from '../helpers/fixture-loader.js';

const { __dirname } = getTestPaths(import.meta.url);

// Load test data
const mockBooks: BookData[] = loadBooks(__dirname);
const largeMockBooks: BookData[] = loadLargeBooks(__dirname);
let currentMockBooks: BookData[] = mockBooks;

// Setup mocks and import server
setupMocks();
setMockBkper(createMockBkperForBooks(currentMockBooks));

const { BkperMcpServer } = await import('../../src/mcp/server.js');

describe('MCP Server - list_books Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockBooks = mockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer(mockBkper);
  });

  it('should register list_books tool in MCP tools list', async function() {
    const response = await server.testListTools();
    
    expect(response).to.have.property('tools');
    expect(response.tools).to.be.an('array');
    
    const listBooksTool = response.tools.find((tool: any) => tool.name === 'list_books');
    expect(listBooksTool).to.exist;
    expect(listBooksTool!.name).to.equal('list_books');
    expect(listBooksTool!.description).to.include('fixed 50-item pagination');
    expect(listBooksTool!.inputSchema).to.have.property('properties');
    expect(listBooksTool!.inputSchema.properties).to.have.property('cursor');
    expect(listBooksTool!.inputSchema.properties).to.not.have.property('limit');
  });

  it('should have proper MCP tool schema for list_books', async function() {
    const response = await server.testListTools();
    const listBooksTool = response.tools.find((tool: any) => tool.name === 'list_books');
    
    expect(listBooksTool!.inputSchema).to.deep.equal({
      type: 'object',
      properties: {
        cursor: {
          type: 'string',
          description: 'Pagination cursor for next page'
        }
      },
      required: []
    });
  });
});

describe('MCP Server - list_books Tool Calls', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockBooks = mockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer(mockBkper);
  });

  it('should handle MCP list_books tool call without cursor', async function() {
    const response = await server.testCallTool('list_books');
    
    // Verify MCP response structure
    expect(response).to.have.property('content');
    expect(response.content).to.be.an('array');
    expect(response.content).to.have.length(1);
    expect(response.content[0]).to.have.property('type', 'text');
    expect(response.content[0]).to.have.property('text');
    
    // Parse the JSON response
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse).to.have.property('total');
    expect(jsonResponse).to.have.property('books');
    expect(jsonResponse).to.have.property('pagination');
    
    expect(jsonResponse.total).to.equal(2);
    expect(jsonResponse.books).to.have.length(2);
    expect(jsonResponse.pagination.limit).to.equal(50);
    expect(jsonResponse.pagination.offset).to.equal(0);
    expect(jsonResponse.pagination.hasMore).to.be.false;
  });

  it('should handle MCP list_books tool call with cursor', async function() {
    // Switch to large dataset
    currentMockBooks = largeMockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer(mockBkper);
    
    // First call to get cursor
    const firstResponse = await server.testCallTool('list_books');
    const firstData = JSON.parse(firstResponse.content[0].text as string);
    
    expect(firstData.pagination.hasMore).to.be.true;
    expect(firstData.pagination.nextCursor).to.be.a('string');
    
    // Second call with cursor
    const response = await server.testCallTool('list_books', { 
      cursor: firstData.pagination.nextCursor 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.pagination.offset).to.equal(50);
    expect(jsonResponse.books).to.have.length(50);
  });

  it('should handle invalid cursor gracefully', async function() {
    const response = await server.testCallTool('list_books', { 
      cursor: 'invalid-cursor' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    // Should fall back to first page
    expect(jsonResponse.pagination.offset).to.equal(0);
  });
});

describe('MCP Server - list_books Pagination Edge Cases', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockBooks = largeMockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer(mockBkper);
  });

  afterEach(function() {
    currentMockBooks = mockBooks;
  });

  it('should handle cursor pointing beyond data via MCP', async function() {
    // Create cursor that points beyond available data
    const beyondDataCursor = Buffer.from(JSON.stringify({
      offset: 1000, // Beyond our 500 books
      timestamp: Date.now()
    })).toString('base64');

    const response = await server.testCallTool('list_books', { cursor: beyondDataCursor });
    const jsonResponse = JSON.parse(response.content[0].text as string);

    expect(jsonResponse.books).to.have.length(0);
    expect(jsonResponse.pagination.hasMore).to.be.false;
    expect(jsonResponse.pagination.nextCursor).to.be.null;
    expect(jsonResponse.pagination.offset).to.equal(1000);
  });

  it('should handle expired cursor via MCP', async function() {
    // Create cursor with old timestamp (6+ minutes ago)
    const expiredCursor = Buffer.from(JSON.stringify({
      offset: 50,
      timestamp: Date.now() - (6 * 60 * 1000)
    })).toString('base64');

    const response = await server.testCallTool('list_books', { cursor: expiredCursor });
    const jsonResponse = JSON.parse(response.content[0].text as string);

    // Should fall back to first page
    expect(jsonResponse.pagination.offset).to.equal(0);
    expect(jsonResponse.books).to.have.length(50);
  });
});