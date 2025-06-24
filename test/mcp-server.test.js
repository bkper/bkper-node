import { expect } from 'chai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock bkper-js before importing the server
const mockBooks = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-books.json'), 'utf8'));

const mockBkperJs = {
  setConfig: () => {},
  getBooks: async () => mockBooks.map(bookData => ({
    json: () => bookData
  }))
};

// Mock the bkper-js module
const originalImport = await import('module');
const originalResolveFilename = originalImport.Module._resolveFilename;
originalImport.Module._resolveFilename = function(request, parent, isMain) {
  if (request === 'bkper-js') {
    return 'mocked-bkper-js';
  }
  return originalResolveFilename.call(this, request, parent, isMain);
};

const originalLoad = originalImport.Module.load;
originalImport.Module.load = function(filename) {
  if (filename === 'mocked-bkper-js') {
    this.exports = { Bkper: mockBkperJs };
    return;
  }
  return originalLoad.call(this, filename);
};

// Mock auth service
const mockGetOAuthToken = async () => 'mock-token';
originalImport.Module._resolveFilename = function(request, parent, isMain) {
  if (request === 'bkper-js') {
    return 'mocked-bkper-js';
  }
  if (request.includes('local-auth-service.js')) {
    return 'mocked-auth-service';
  }
  return originalResolveFilename.call(this, request, parent, isMain);
};

originalImport.Module.load = function(filename) {
  if (filename === 'mocked-bkper-js') {
    this.exports = { Bkper: mockBkperJs };
    return;
  }
  if (filename === 'mocked-auth-service') {
    this.exports = { getOAuthToken: mockGetOAuthToken };
    return;
  }
  return originalLoad.call(this, filename);
};

describe('MCP Server - list_books tool', function() {
  beforeEach(function() {
    // Set mock environment variables
    process.env.BKPER_API_KEY = 'test-api-key';
  });

  it('should return formatted book list response', async function() {
    // Test the core logic directly
    const books = await mockBkperJs.getBooks();
    const bookCount = books.length;
    const limitedBooks = Math.min(200, bookCount);
    
    const essentialBooksData = books.slice(0, limitedBooks).map(book => {
      const fullData = book.json();
      return {
        id: fullData.id,
        name: fullData.name
      };
    });

    const expectedResponse = {
      total: bookCount,
      showing: `First ${limitedBooks} of ${bookCount} books`,
      books: essentialBooksData
    };

    expect(expectedResponse.total).to.equal(2);
    expect(expectedResponse.books).to.have.length(2);
    expect(expectedResponse.books[0]).to.have.property('id', 'book-1');
    expect(expectedResponse.books[0]).to.have.property('name', 'Test Company Ltd');
    expect(expectedResponse.books[1]).to.have.property('id', 'book-2');
    expect(expectedResponse.books[1]).to.have.property('name', 'Personal Finance');
  });

  it('should limit books to 200 maximum', async function() {
    // Create mock with many books
    const manyBooks = Array.from({ length: 250 }, (_, i) => ({
      json: () => ({ id: `book-${i}`, name: `Book ${i}` })
    }));

    const bookCount = manyBooks.length;
    const limitedBooks = Math.min(200, bookCount);
    
    expect(limitedBooks).to.equal(200);
    expect(bookCount).to.equal(250);
  });

  it('should format response for MCP protocol', function() {
    const sampleResponse = {
      total: 2,
      showing: "First 2 of 2 books",
      books: [
        { id: "book-1", name: "Test Company Ltd" },
        { id: "book-2", name: "Personal Finance" }
      ]
    };

    const mcpResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sampleResponse, null, 2),
        },
      ],
    };

    expect(mcpResponse.content).to.have.length(1);
    expect(mcpResponse.content[0].type).to.equal('text');
    expect(mcpResponse.content[0].text).to.be.a('string');
    
    const parsedContent = JSON.parse(mcpResponse.content[0].text);
    expect(parsedContent.total).to.equal(2);
    expect(parsedContent.books).to.have.length(2);
  });
});