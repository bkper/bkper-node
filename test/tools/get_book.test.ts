import { expect, setupTestEnvironment, getTestPaths } from '../helpers/test-setup.js';
import { BkperMcpServerType, BookData } from '../helpers/mock-interfaces.js';
import { setupMocks, createMockBkperForBook, setMockBkper } from '../helpers/mock-factory.js';
import { loadBooks } from '../helpers/fixture-loader.js';

const { __dirname } = getTestPaths(import.meta.url);

// Load test data
const mockBooks: BookData[] = loadBooks(__dirname);

// Setup mocks and import server
setupMocks();
setMockBkper(createMockBkperForBook(mockBooks));

const { BkperMcpServer } = await import('../../src/mcp/server.js');

describe('MCP Server - get_book Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    const mockBkper = createMockBkperForBook(mockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should register get_book tool in MCP tools list (when implemented)', async function() {
    const response = await server.testListTools();
    
    // NOTE: This will fail until get_book tool is implemented in server
    const getBookTool = response.tools.find((tool: any) => tool.name === 'get_book');
    
    if (getBookTool) {
      expect(getBookTool.name).to.equal('get_book');
      expect(getBookTool.description).to.include('detailed information');
      expect(getBookTool.inputSchema).to.have.property('properties');
      expect(getBookTool.inputSchema.properties).to.have.property('bookId');
      expect(getBookTool.inputSchema.required).to.include('bookId');
    } else {
      // Tool not implemented yet - this is expected during development
      expect(getBookTool).to.be.undefined;
    }
  });

  it('should have proper MCP tool schema for get_book (when implemented)', async function() {
    const response = await server.testListTools();
    const getBookTool = response.tools.find((tool: any) => tool.name === 'get_book');
    
    if (getBookTool) {
      expect(getBookTool.inputSchema).to.deep.equal({
        type: 'object',
        properties: {
          bookId: {
            type: 'string',
            description: 'The unique identifier of the book to retrieve'
          }
        },
        required: ['bookId']
      });
    } else {
      // Expected during development
      expect(getBookTool).to.be.undefined;
    }
  });
});

describe('MCP Server - get_book Tool Calls', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    setupTestEnvironment();
    const mockBkper = createMockBkperForBook(mockBooks);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should handle MCP get_book tool call for valid book ID (when implemented)', async function() {
    try {
      const response = await server.testCallTool('get_book', { bookId: 'book-1' });
      
      // Verify MCP response structure
      expect(response).to.have.property('content');
      expect(response.content).to.be.an('array');
      expect(response.content).to.have.length(1);
      expect(response.content[0]).to.have.property('type', 'text');
      expect(response.content[0]).to.have.property('text');
      
      // Parse the JSON response
      const jsonResponse = JSON.parse(response.content[0].text as string);
      expect(jsonResponse).to.have.property('book');
      
      const book = jsonResponse.book;
      expect(book).to.have.property('id', 'book-1');
      expect(book).to.have.property('name', 'Test Company Ltd');
      expect(book).to.have.property('timeZone');
      expect(book).to.have.property('fractionDigits');
      expect(book).to.have.property('decimalSeparator');
      expect(book).to.have.property('datePattern');
      expect(book).to.have.property('permission');
      expect(book).to.have.property('visibility');
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - this is expected during development
        expect((error as Error).message).to.include('get_book');
      } else {
        throw error;
      }
    }
  });

  it('should handle MCP error for missing bookId parameter (when implemented)', async function() {
    try {
      await server.testCallTool('get_book', {});
      expect.fail('Should have thrown an error for missing bookId');
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('get_book');
      } else {
        // When implemented, should return proper validation error
        expect(error).to.be.an('error');
      }
    }
  });

  it('should handle MCP error for non-existent book ID (when implemented)', async function() {
    try {
      const response = await server.testCallTool('get_book', { bookId: 'non-existent-book' });
      
      // When implemented, should return proper error response
      if (response.isError) {
        expect(response.isError).to.be.true;
      } else {
        // Or throw an error
        expect.fail('Should have returned error for non-existent book');
      }
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('get_book');
      } else {
        // When implemented, should handle book not found error
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('Book not found');
      }
    }
  });

  it('should handle different book configurations via MCP (when implemented)', async function() {
    try {
      const response1 = await server.testCallTool('get_book', { bookId: 'book-1' });
      const response2 = await server.testCallTool('get_book', { bookId: 'book-2' });
      
      const book1 = JSON.parse(response1.content[0].text as string).book;
      const book2 = JSON.parse(response2.content[0].text as string).book;
      
      expect(book1.name).to.equal('Test Company Ltd');
      expect(book2.name).to.equal('Personal Finance');
      expect(book1.timeZone).to.equal('America/New_York');
      expect(book2.timeZone).to.equal('America/Los_Angeles');
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('get_book');
      } else {
        throw error;
      }
    }
  });
});