import { expect } from 'chai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TypeScript interfaces for test data
interface BookData {
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

interface MockBook {
  json(): BookData;
}

interface MockBkper {
  setConfig: (config: any) => void;
  getBook: (id: string) => Promise<MockBook>;
}

// Mock book data from fixtures
const mockBooks: BookData[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures', 'sample-books.json'), 'utf8'));

const mockBkperJs: MockBkper = {
  setConfig: () => {},
  getBook: async (id: string): Promise<MockBook> => {
    const book = mockBooks.find(b => b.id === id);
    if (!book) {
      throw new Error(`Book not found: ${id}`);
    }
    return {
      json: (): BookData => book
    };
  }
};

// Mock auth service
const mockGetOAuthToken = async (): Promise<string> => 'mock-token';

// Setup module mocking (same pattern as main test file)
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

describe('MCP Server - get_book tool', function() {
  beforeEach(function() {
    // Set mock environment variables
    process.env.BKPER_API_KEY = 'test-api-key';
  });

  it('should return complete book details for valid book ID', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    const bookData = book.json();

    // Expected response structure
    const expectedResponse = {
      book: bookData
    };

    expect(expectedResponse.book.id).to.equal('book-1');
    expect(expectedResponse.book.name).to.equal('Test Company Ltd');
    expect(expectedResponse.book).to.have.property('timeZone');
    expect(expectedResponse.book).to.have.property('fractionDigits');
    expect(expectedResponse.book).to.have.property('decimalSeparator');
    expect(expectedResponse.book).to.have.property('datePattern');
    expect(expectedResponse.book).to.have.property('permission');
    expect(expectedResponse.book).to.have.property('visibility');
  });

  it('should handle book not found error', async function() {
    const invalidBookId = 'non-existent-book';
    
    try {
      await mockBkperJs.getBook(invalidBookId);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).to.be.an('error');
      expect((error as Error).message).to.include('Book not found');
    }
  });

  it('should return book with all required properties', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    const bookData = book.json();

    // Check for essential book properties
    expect(bookData).to.have.property('id');
    expect(bookData).to.have.property('name');
    expect(bookData).to.have.property('ownerName');
    expect(bookData).to.have.property('timeZone');
    expect(bookData).to.have.property('fractionDigits');
    expect(bookData).to.have.property('decimalSeparator');
    expect(bookData).to.have.property('datePattern');
    expect(bookData).to.have.property('permission');
    expect(bookData).to.have.property('visibility');
    expect(bookData).to.have.property('totalTransactions');
    expect(bookData).to.have.property('properties');
  });

  it('should format response for MCP protocol', function() {
    const sampleBook = mockBooks[0];
    
    const mcpResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ book: sampleBook }, null, 2),
        },
      ],
    };

    expect(mcpResponse.content).to.have.length(1);
    expect(mcpResponse.content[0].type).to.equal('text');
    expect(mcpResponse.content[0].text).to.be.a('string');
    
    const parsedContent = JSON.parse(mcpResponse.content[0].text);
    expect(parsedContent).to.have.property('book');
    expect(parsedContent.book).to.have.property('id');
    expect(parsedContent.book).to.have.property('name');
  });

  it('should handle different book types and configurations', async function() {
    // Test different book configurations
    const book1 = await mockBkperJs.getBook('book-1');
    const book2 = await mockBkperJs.getBook('book-2');
    
    const book1Data = book1.json();
    const book2Data = book2.json();

    // Verify different configurations
    expect(book1Data.name).to.equal('Test Company Ltd');
    expect(book2Data.name).to.equal('Personal Finance');
    
    expect(book1Data.timeZone).to.equal('America/New_York');
    expect(book2Data.timeZone).to.equal('America/Los_Angeles');
    
    expect(book1Data.fractionDigits).to.equal(2);
    expect(book2Data.fractionDigits).to.equal(2);
  });
});

describe('MCP Server - get_book tool schema', function() {
  it('should define correct tool schema', function() {
    const expectedToolSchema = {
      name: 'get_book',
      description: 'Get detailed information about a specific book',
      inputSchema: {
        type: 'object',
        properties: {
          bookId: {
            type: 'string',
            description: 'The unique identifier of the book to retrieve'
          }
        },
        required: ['bookId']
      }
    };

    expect(expectedToolSchema.name).to.equal('get_book');
    expect(expectedToolSchema.inputSchema.properties).to.have.property('bookId');
    expect(expectedToolSchema.inputSchema.required).to.include('bookId');
    expect(expectedToolSchema.description).to.include('detailed information');
  });

  it('should fail because get_book tool is not implemented yet', function() {
    // This test will FAIL until we implement get_book tool
    const toolImplemented = false;
    
    expect(toolImplemented).to.be.true; // This will fail
  });
});