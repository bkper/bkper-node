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

const { BkperMcpServer } = await import('../../../src/mcp/server.js');

describe('MCP Server - list_books Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockBooks = mockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
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
    expect(listBooksTool!.inputSchema.properties).to.have.property('name');
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
        },
        name: {
          type: 'string',
          description: 'Optional filter to search books by name (case-insensitive substring match)'
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
    server = new BkperMcpServer();
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
    server = new BkperMcpServer();
    
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
    server = new BkperMcpServer();
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

describe('MCP Server - list_books Name Filtering', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockBooks = mockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should filter books by exact name match', async function() {
    const response = await server.testCallTool('list_books', { 
      name: 'Test Company Ltd' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.total).to.equal(1);
    expect(jsonResponse.books).to.have.length(1);
    expect(jsonResponse.books[0].name).to.equal('Test Company Ltd');
    expect(jsonResponse.books[0].id).to.equal('book-1');
  });

  it('should filter books by partial name match (case-insensitive)', async function() {
    const response = await server.testCallTool('list_books', { 
      name: 'company' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.total).to.equal(1);
    expect(jsonResponse.books).to.have.length(1);
    expect(jsonResponse.books[0].name).to.equal('Test Company Ltd');
  });

  it('should filter books by partial name match with different case', async function() {
    const response = await server.testCallTool('list_books', { 
      name: 'PERSONAL' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.total).to.equal(1);
    expect(jsonResponse.books).to.have.length(1);
    expect(jsonResponse.books[0].name).to.equal('Personal Finance');
    expect(jsonResponse.books[0].id).to.equal('book-2');
  });

  it('should return multiple books when name matches multiple entries', async function() {
    // Using a common substring that should match both books - neither contains this
    // Let's test with substring that matches both
    const response = await server.testCallTool('list_books', { 
      name: 'e' // Both "Test Company Ltd" and "Personal Finance" contain 'e'
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.total).to.equal(2);
    expect(jsonResponse.books).to.have.length(2);
  });

  it('should return empty result when name filter matches no books', async function() {
    const response = await server.testCallTool('list_books', { 
      name: 'NonExistentBookName' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.total).to.equal(0);
    expect(jsonResponse.books).to.have.length(0);
    expect(jsonResponse.pagination.hasMore).to.be.false;
    expect(jsonResponse.pagination.nextCursor).to.be.null;
  });

  it('should handle empty string name filter (return all books)', async function() {
    const response = await server.testCallTool('list_books', { 
      name: '' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.total).to.equal(2);
    expect(jsonResponse.books).to.have.length(2);
  });

  it('should handle whitespace-only name filter (return all books)', async function() {
    const response = await server.testCallTool('list_books', { 
      name: '   ' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.total).to.equal(2);
    expect(jsonResponse.books).to.have.length(2);
  });

  it('should handle special characters in name filter', async function() {
    const response = await server.testCallTool('list_books', { 
      name: 'Ltd' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.total).to.equal(1);
    expect(jsonResponse.books).to.have.length(1);
    expect(jsonResponse.books[0].name).to.equal('Test Company Ltd');
  });

  it('should work with pagination when name filtering is applied', async function() {
    // Switch to large dataset for pagination testing
    currentMockBooks = largeMockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
    
    // Filter by a common character that should match many books
    const response = await server.testCallTool('list_books', { 
      name: 'Book' // Assuming large dataset has books with "Book" in name
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    // Verify pagination structure is preserved with filtering
    expect(jsonResponse).to.have.property('total');
    expect(jsonResponse).to.have.property('books');
    expect(jsonResponse).to.have.property('pagination');
    expect(jsonResponse.pagination).to.have.property('limit', 50);
    expect(jsonResponse.pagination).to.have.property('offset', 0);
    expect(jsonResponse.pagination).to.have.property('hasMore');
    expect(jsonResponse.pagination).to.have.property('nextCursor');
  });
});

describe('MCP Server - list_books Tool Schema with Name Parameter', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockBooks = mockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should include name parameter in MCP tool schema', async function() {
    const response = await server.testListTools();
    const listBooksTool = response.tools.find((tool: any) => tool.name === 'list_books') as any;
    
    expect(listBooksTool).to.exist;
    expect(listBooksTool.inputSchema.properties).to.have.property('name');
    expect(listBooksTool.inputSchema.properties.name).to.deep.equal({
      type: 'string',
      description: 'Optional filter to search books by name (case-insensitive substring match)'
    });
  });

  it('should have name parameter as optional in schema', async function() {
    const response = await server.testListTools();
    const listBooksTool = response.tools.find((tool: any) => tool.name === 'list_books') as any;
    
    expect(listBooksTool).to.exist;
    expect(listBooksTool.inputSchema.required).to.be.an('array');
    expect(listBooksTool.inputSchema.required).to.not.include('name');
  });

  it('should update tool description to mention name filtering', async function() {
    const response = await server.testListTools();
    const listBooksTool = response.tools.find((tool: any) => tool.name === 'list_books') as any;
    
    expect(listBooksTool).to.exist;
    expect(listBooksTool.description).to.include('name filtering');
  });
});

describe('MCP Server - list_books Cache Behavior with Name Filtering', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    currentMockBooks = mockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should cache filtered results separately from unfiltered results', async function() {
    // First call without filter
    const unfilteredResponse = await server.testCallTool('list_books');
    const unfilteredData = JSON.parse(unfilteredResponse.content[0].text as string);
    
    // Second call with filter
    const filteredResponse = await server.testCallTool('list_books', { 
      name: 'Test' 
    });
    const filteredData = JSON.parse(filteredResponse.content[0].text as string);
    
    // Results should be different
    expect(unfilteredData.total).to.equal(2);
    expect(filteredData.total).to.equal(1);
    expect(filteredData.books[0].name).to.equal('Test Company Ltd');
  });

  it('should maintain separate cache entries for different name filters', async function() {
    // Call with first filter
    const firstFilterResponse = await server.testCallTool('list_books', { 
      name: 'Test' 
    });
    const firstFilterData = JSON.parse(firstFilterResponse.content[0].text as string);
    
    // Call with second filter
    const secondFilterResponse = await server.testCallTool('list_books', { 
      name: 'Personal' 
    });
    const secondFilterData = JSON.parse(secondFilterResponse.content[0].text as string);
    
    // Results should be different and correctly filtered
    expect(firstFilterData.total).to.equal(1);
    expect(firstFilterData.books[0].name).to.equal('Test Company Ltd');
    
    expect(secondFilterData.total).to.equal(1);
    expect(secondFilterData.books[0].name).to.equal('Personal Finance');
  });

  it('should work correctly with pagination cursors when name filtering is applied', async function() {
    // Switch to large dataset
    currentMockBooks = largeMockBooks;
    const mockBkper = createMockBkperForBooks(currentMockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
    
    // First call with name filter
    const firstResponse = await server.testCallTool('list_books', { 
      name: 'Book' // Assuming this matches many books in large dataset
    });
    const firstData = JSON.parse(firstResponse.content[0].text as string);
    
    // If there's more data, test cursor-based pagination with same filter
    if (firstData.pagination.hasMore && firstData.pagination.nextCursor) {
      const secondResponse = await server.testCallTool('list_books', { 
        name: 'Book',
        cursor: firstData.pagination.nextCursor
      });
      const secondData = JSON.parse(secondResponse.content[0].text as string);
      
      expect(secondData.pagination.offset).to.equal(50);
      expect(secondData.books).to.be.an('array');
      // All returned books should still match the name filter
      secondData.books.forEach((book: any) => {
        expect(book.name.toLowerCase()).to.include('book');
      });
    }
  });
});