import {
  expect,
  createTestContext,
  integrationTest,
  parseToolResponse,
  getToolDefinition,
  logApiResponse,
  withRetry,
  TestMode
} from '../setup/test-helpers.js';
import { testDataManager } from '../setup/test-data-manager.js';
import type { IntegrationTestContext } from '../setup/test-helpers.js';

describe('Integration: get_book Tool', function() {
  let context: IntegrationTestContext;
  const TEST_BOOK_ID = process.env.TEST_BOOK_ID;
  
  before(async function() {
    this.timeout(60000); // Allow more time for initial setup
    context = createTestContext();
    
    if (!TEST_BOOK_ID) {
      throw new Error('TEST_BOOK_ID environment variable is required for get_book integration tests');
    }
    
    // Verify we can access the API and the test book
    const stats = await testDataManager.getTestDataStats();
    console.log(`\nIntegration test environment:`);
    console.log(`- Using test book ID: ${TEST_BOOK_ID}`);
    console.log(`- Total books available: ${stats.totalBooks}`);
    console.log(`- Test books: ${stats.testBooks}`);
    console.log(`- Permissions:`, stats.permissions);
    
    if (stats.totalBooks === 0) {
      throw new Error('No books available for integration testing');
    }
  });
  
  after(function() {
    // Clear any cached data
    testDataManager.clearCache();
  });
  
  describe('Tool Registration', function() {
    it('should have get_book tool properly registered', integrationTest(async () => {
      const tool = await getToolDefinition(context.server, 'get_book');
      
      expect(tool).to.exist;
      expect(tool.name).to.equal('get_book');
      expect(tool.description).to.include('Retrieve detailed information about a specific book');
      expect(tool.inputSchema).to.have.property('type', 'object');
      expect(tool.inputSchema.properties).to.have.property('bookId');
      expect(tool.inputSchema.required).to.include('bookId');
    }));
  });
  
  describe('Basic Functionality', function() {
    it('should get book details for valid bookId', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_book', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const response = parseToolResponse(result);
      logApiResponse('get_book (valid bookId)', response);
      
      // Validate response structure
      expect(response).to.have.property('book').that.is.an('object');
      
      // Validate book properties
      const book = response.book;
      expect(book).to.have.property('id', TEST_BOOK_ID);
      expect(book).to.have.property('name').that.is.a('string');
      expect(book).to.have.property('description').that.is.a('string');
      expect(book).to.have.property('permission').that.is.a('string');
      expect(book).to.have.property('visibility').that.is.a('string');
      expect(book).to.have.property('fracDigits').that.is.a('number');
      expect(book).to.have.property('dateFormat').that.is.a('string');
      expect(book).to.have.property('timeZone').that.is.a('string');
      expect(book).to.have.property('currencyCode').that.is.a('string');
      expect(book).to.have.property('currencySymbol').that.is.a('string');
      expect(book).to.have.property('decimalSeparator').that.is.a('string');
      expect(book).to.have.property('groupSeparator').that.is.a('string');
      expect(book).to.have.property('lastUpdateMs').that.is.a('string');
      expect(book).to.have.property('created').that.is.a('string');
      expect(book).to.have.property('modified').that.is.a('string');
      
      // Validate permission values
      expect(book.permission).to.be.oneOf(['VIEWER', 'POSTER', 'EDITOR', 'OWNER']);
      
      // Validate visibility values
      expect(book.visibility).to.be.oneOf(['PRIVATE', 'PUBLIC']);
      
      // Validate numeric values
      expect(book.fracDigits).to.be.at.least(0);
      expect(book.fracDigits).to.be.at.most(10);
      
      // Validate date format
      expect(book.dateFormat).to.match(/^[dMy\/\-\s]+$/);
      
      // Validate currency code format (ISO 4217)
      expect(book.currencyCode).to.match(/^[A-Z]{3}$/);
      
      // Validate timestamp format
      expect(book.lastUpdateMs).to.match(/^\d+$/);
      
      // Log book details for debugging
      if (TestMode.DEBUG_API) {
        console.log(`Book details:`);
        console.log(`- Name: ${book.name}`);
        console.log(`- Description: ${book.description}`);
        console.log(`- Permission: ${book.permission}`);
        console.log(`- Visibility: ${book.visibility}`);
        console.log(`- Currency: ${book.currencyCode} (${book.currencySymbol})`);
        console.log(`- Decimal places: ${book.fracDigits}`);
        console.log(`- Time zone: ${book.timeZone}`);
        console.log(`- Date format: ${book.dateFormat}`);
      }
    }));
    
    it('should get book with consistent structure on repeated calls', integrationTest(async () => {
      // First call
      const result1 = await withRetry(() => 
        context.server.testCallTool('get_book', {
          bookId: TEST_BOOK_ID
        })
      );
      const response1 = parseToolResponse(result1);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second call
      const result2 = await withRetry(() => 
        context.server.testCallTool('get_book', {
          bookId: TEST_BOOK_ID
        })
      );
      const response2 = parseToolResponse(result2);
      
      // Results should be consistent
      expect(response1.book.id).to.equal(response2.book.id);
      expect(response1.book.name).to.equal(response2.book.name);
      expect(response1.book.description).to.equal(response2.book.description);
      expect(response1.book.permission).to.equal(response2.book.permission);
      expect(response1.book.visibility).to.equal(response2.book.visibility);
      expect(response1.book.fracDigits).to.equal(response2.book.fracDigits);
      expect(response1.book.currencyCode).to.equal(response2.book.currencyCode);
      expect(response1.book.currencySymbol).to.equal(response2.book.currencySymbol);
      expect(response1.book.timeZone).to.equal(response2.book.timeZone);
      expect(response1.book.dateFormat).to.equal(response2.book.dateFormat);
      
      // Timestamps might differ slightly but should be very close
      const lastUpdate1 = parseInt(response1.book.lastUpdateMs);
      const lastUpdate2 = parseInt(response2.book.lastUpdateMs);
      const timeDiff = Math.abs(lastUpdate1 - lastUpdate2);
      expect(timeDiff).to.be.lessThan(60000); // Within 1 minute
    }));
  });
  
  describe('Error Handling', function() {
    it('should return MCP error for missing bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('get_book', {});
        expect.fail('Should have thrown an error for missing bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.equal(-32602); // Invalid params
        expect(error.message).to.include('Missing required parameter: bookId');
      }
    }));
    
    it('should return MCP error for invalid bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('get_book', {
          bookId: 'invalid-book-id-123'
        });
        expect.fail('Should have thrown an error for invalid bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.equal(-32602); // Invalid params
        expect(error.message).to.include('Book not found: invalid-book-id-123');
      }
    }));
    
    it('should return MCP error for empty bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('get_book', {
          bookId: ''
        });
        expect.fail('Should have thrown an error for empty bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.equal(-32602); // Invalid params
        expect(error.message).to.include('Missing required parameter: bookId');
      }
    }));
    
    it('should return MCP error for null bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('get_book', {
          bookId: null as any
        });
        expect.fail('Should have thrown an error for null bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.equal(-32602); // Invalid params
        expect(error.message).to.include('Missing required parameter: bookId');
      }
    }));
  });
  
  describe('Performance', function() {
    it('should complete get_book request within reasonable time', integrationTest(async () => {
      const startTime = Date.now();
      
      const result = await withRetry(() => 
        context.server.testCallTool('get_book', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      parseToolResponse(result); // Ensure response is valid
      
      // Should complete within 10 seconds (generous for network latency)
      expect(duration).to.be.lessThan(10000);
      
      if (TestMode.DEBUG_API) {
        console.log(`get_book completed in ${duration}ms`);
      }
    }));
  });
  
  describe('Book Data Validation', function() {
    it('should have valid book configuration', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_book', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const response = parseToolResponse(result);
      const book = response.book;
      
      // Validate that the book has reasonable configuration
      expect(book.name).to.have.length.greaterThan(0);
      expect(book.name).to.have.length.lessThan(256);
      
      // Currency configuration should be valid
      expect(book.currencyCode).to.match(/^[A-Z]{3}$/);
      expect(book.currencySymbol).to.have.length.greaterThan(0);
      expect(book.currencySymbol).to.have.length.lessThan(10);
      
      // Decimal configuration should be reasonable
      expect(book.fracDigits).to.be.at.least(0);
      expect(book.fracDigits).to.be.at.most(10);
      
      // Separators should be single characters
      expect(book.decimalSeparator).to.have.length(1);
      expect(book.groupSeparator).to.have.length(1);
      expect(book.decimalSeparator).to.not.equal(book.groupSeparator);
      
      // Time zone should be valid
      expect(book.timeZone).to.have.length.greaterThan(0);
      expect(book.timeZone).to.have.length.lessThan(100);
      
      // Date format should be reasonable
      expect(book.dateFormat).to.have.length.greaterThan(0);
      expect(book.dateFormat).to.have.length.lessThan(50);
      
      // Timestamps should be valid
      const lastUpdateMs = parseInt(book.lastUpdateMs);
      expect(lastUpdateMs).to.be.greaterThan(0);
      expect(lastUpdateMs).to.be.lessThan(Date.now() + 86400000); // Not more than 1 day in future
      
      // Created and modified should be valid ISO dates
      expect(book.created).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
      expect(book.modified).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    }));
  });
});