import {
  expect,
  createTestContext,
  integrationTest,
  parseToolResponse,
  getToolDefinition,
  validateResponseStructure,
  logApiResponse,
  withRetry,
  ExpectedStructures,
  TestMode
} from '../setup/test-helpers.js';
import { testDataManager } from '../setup/test-data-manager.js';
import type { IntegrationTestContext } from '../setup/test-helpers.js';

describe('Integration: list_books Tool', function() {
  let context: IntegrationTestContext;
  
  before(async function() {
    this.timeout(60000); // Allow more time for initial setup
    context = createTestContext();
    
    // Verify we can access the API
    const stats = await testDataManager.getTestDataStats();
    console.log(`\nIntegration test environment:`);
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
    it('should have list_books tool properly registered', integrationTest(async () => {
      const tool = await getToolDefinition(context.server, 'list_books');
      
      expect(tool).to.exist;
      expect(tool.name).to.equal('list_books');
      expect(tool.description).to.include('List books');
      expect(tool.inputSchema).to.have.property('type', 'object');
      expect(tool.inputSchema.properties).to.have.property('cursor');
      expect(tool.inputSchema.properties).to.have.property('name');
    }));
  });
  
  describe('Basic Functionality', function() {
    it('should list books without any parameters', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('list_books')
      );
      
      const response = parseToolResponse(result);
      logApiResponse('list_books (no params)', response);
      
      // Validate response structure
      expect(response).to.have.property('total').that.is.a('number');
      expect(response).to.have.property('books').that.is.an('array');
      expect(response).to.have.property('pagination').that.is.an('object');
      
      // Validate pagination structure
      expect(response.pagination).to.have.property('hasMore').that.is.a('boolean');
      expect(response.pagination).to.have.property('nextCursor');
      expect(response.pagination).to.have.property('limit', 50);
      expect(response.pagination).to.have.property('offset', 0);
      
      // Validate each book structure
      if (response.books.length > 0) {
        response.books.forEach((book: any, index: number) => {
          try {
            validateResponseStructure(book, ExpectedStructures.book);
          } catch (error) {
            console.error(`Book at index ${index} failed validation:`, book);
            throw error;
          }
        });
      }
      
      // Verify total matches actual count (for first page)
      if (!response.pagination.hasMore) {
        expect(response.books).to.have.length(response.total);
      }
    }));
    
    it('should return consistent results on repeated calls', integrationTest(async () => {
      // First call
      const result1 = await withRetry(() => 
        context.server.testCallTool('list_books')
      );
      const response1 = parseToolResponse(result1);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second call
      const result2 = await withRetry(() => 
        context.server.testCallTool('list_books')
      );
      const response2 = parseToolResponse(result2);
      
      // Results should be consistent
      expect(response1.total).to.equal(response2.total);
      expect(response1.books.length).to.equal(response2.books.length);
      
      // Book IDs should match (order might vary slightly)
      const ids1 = response1.books.map((b: any) => b.id).sort();
      const ids2 = response2.books.map((b: any) => b.id).sort();
      expect(ids1).to.deep.equal(ids2);
    }));
  });
  
  describe('Pagination', function() {
    it('should handle pagination correctly when there are many books', integrationTest(async () => {
      const firstResult = await withRetry(() => 
        context.server.testCallTool('list_books')
      );
      const firstResponse = parseToolResponse(firstResult);
      
      // Only test pagination if there are more than 50 books
      if (firstResponse.pagination.hasMore) {
        expect(firstResponse.books).to.have.length(50);
        expect(firstResponse.pagination.nextCursor).to.be.a('string');
        
        // Get second page
        const secondResult = await withRetry(() => 
          context.server.testCallTool('list_books', {
            cursor: firstResponse.pagination.nextCursor
          })
        );
        const secondResponse = parseToolResponse(secondResult);
        
        logApiResponse('list_books (page 2)', secondResponse);
        
        // Validate second page
        expect(secondResponse.pagination.offset).to.equal(50);
        expect(secondResponse.books).to.be.an('array');
        
        // Books should be different
        const firstIds = firstResponse.books.map((b: any) => b.id);
        const secondIds = secondResponse.books.map((b: any) => b.id);
        const overlap = firstIds.filter((id: string) => secondIds.includes(id));
        expect(overlap).to.have.length(0, 'Pages should not have overlapping books');
      } else {
        console.log('Skipping pagination test - not enough books');
      }
    }));
    
    it('should handle invalid cursor gracefully', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('list_books', {
          cursor: 'invalid-cursor-abc123'
        })
      );
      const response = parseToolResponse(result);
      
      // Should fall back to first page
      expect(response.pagination.offset).to.equal(0);
      expect(response.books).to.be.an('array');
    }));
  });
  
  describe('Name Filtering', function() {
    it('should filter books by name when parameter is provided', integrationTest(async () => {
      // First get all books to find a name to search for
      const allResult = await withRetry(() => 
        context.server.testCallTool('list_books')
      );
      const allResponse = parseToolResponse(allResult);
      
      if (allResponse.books.length > 0) {
        // Pick a book name to search for
        const targetBook = allResponse.books[0];
        const searchTerm = targetBook.name.substring(0, 5); // Use first 5 chars
        
        const filteredResult = await withRetry(() => 
          context.server.testCallTool('list_books', {
            name: searchTerm
          })
        );
        const filteredResponse = parseToolResponse(filteredResult);
        
        logApiResponse(`list_books (name filter: ${searchTerm})`, filteredResponse);
        
        // Should have fewer or equal books
        expect(filteredResponse.total).to.be.at.most(allResponse.total);
        
        // All returned books should match the filter
        filteredResponse.books.forEach((book: any) => {
          expect(book.name.toLowerCase()).to.include(searchTerm.toLowerCase());
        });
      } else {
        console.log('Skipping name filter test - no books available');
      }
    }));
    
    it('should return empty results for non-existent book name', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('list_books', {
          name: 'NonExistentBook_' + Date.now()
        })
      );
      const response = parseToolResponse(result);
      
      expect(response.total).to.equal(0);
      expect(response.books).to.have.length(0);
      expect(response.pagination.hasMore).to.be.false;
      expect(response.pagination.nextCursor).to.be.null;
    }));
  });
  
  describe('API Response Validation', function() {
    it('should return valid book data matching Bkper API types', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('list_books')
      );
      const response = parseToolResponse(result);
      
      if (response.books.length > 0) {
        const sampleBook = response.books[0];
        
        // Required fields
        expect(sampleBook).to.have.property('id').that.is.a('string');
        expect(sampleBook).to.have.property('name').that.is.a('string');
        
        // Optional fields (when present, verify type)
        if (sampleBook.ownerName !== undefined) {
          expect(sampleBook.ownerName).to.be.a('string');
        }
        if (sampleBook.permission !== undefined) {
          expect(['OWNER', 'EDITOR', 'POSTER', 'VIEWER', 'NONE']).to.include(sampleBook.permission);
        }
        if (sampleBook.collection !== undefined) {
          expect(sampleBook.collection).to.be.an('object');
        }
        if (sampleBook.datePattern !== undefined) {
          expect(sampleBook.datePattern).to.be.a('string');
        }
        if (sampleBook.decimalSeparator !== undefined) {
          expect(['DOT', 'COMMA']).to.include(sampleBook.decimalSeparator);
        }
        if (sampleBook.timeZone !== undefined) {
          expect(sampleBook.timeZone).to.be.a('string');
        }
        if (sampleBook.timeZoneOffset !== undefined) {
          expect(sampleBook.timeZoneOffset).to.be.a('number');
        }
        if (sampleBook.lastUpdateMs !== undefined) {
          expect(sampleBook.lastUpdateMs).to.be.a('string');
        }
        if (sampleBook.fractionDigits !== undefined) {
          expect(sampleBook.fractionDigits).to.be.a('number');
        }
        if (sampleBook.groups !== undefined) {
          expect(sampleBook.groups).to.be.an('array');
        }
        if (sampleBook.properties !== undefined) {
          expect(sampleBook.properties).to.be.an('object');
        }
      }
    }));
  });
  
  describe('Error Handling', function() {
    it('should handle API errors gracefully', integrationTest(async () => {
      // This test is a placeholder for error scenarios
      // In a real scenario, you might test with invalid API keys, network issues, etc.
      // For now, we just verify the tool handles basic errors
      
      try {
        // Test with an extremely long cursor that might cause issues
        const longCursor = 'a'.repeat(10000);
        const result = await context.server.testCallTool('list_books', {
          cursor: longCursor
        });
        const response = parseToolResponse(result);
        
        // Should handle gracefully and return first page
        expect(response.pagination.offset).to.equal(0);
      } catch (error) {
        // If it throws, ensure it's a proper error
        expect(error).to.be.an('error');
      }
    }));
  });
  
  describe('Performance', function() {
    it('should complete list_books request within reasonable time', integrationTest(async () => {
      const startTime = Date.now();
      
      const result = await withRetry(() => 
        context.server.testCallTool('list_books')
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      parseToolResponse(result); // Ensure response is valid
      
      // Should complete within 10 seconds (generous for network latency)
      expect(duration).to.be.lessThan(10000);
      
      if (TestMode.DEBUG_API) {
        console.log(`list_books completed in ${duration}ms`);
      }
    }));
  });
});