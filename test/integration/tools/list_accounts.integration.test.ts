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

describe('Integration: list_accounts Tool', function() {
  let context: IntegrationTestContext;
  const TEST_BOOK_ID = process.env.TEST_BOOK_ID;
  
  before(async function() {
    this.timeout(60000); // Allow more time for initial setup
    context = createTestContext();
    
    if (!TEST_BOOK_ID) {
      throw new Error('TEST_BOOK_ID environment variable is required for list_accounts integration tests');
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
    it('should have list_accounts tool properly registered', integrationTest(async () => {
      const tool = await getToolDefinition(context.server, 'list_accounts');
      
      expect(tool).to.exist;
      expect(tool.name).to.equal('list_accounts');
      expect(tool.description).to.include('List accounts in a book with fixed 50-item pagination');
      expect(tool.inputSchema).to.have.property('type', 'object');
      expect(tool.inputSchema.properties).to.have.property('bookId');
      expect(tool.inputSchema.properties).to.have.property('cursor');
      expect(tool.inputSchema.required).to.include('bookId');
    }));
  });
  
  describe('Basic Functionality', function() {
    it('should list accounts without cursor (first page)', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const response = parseToolResponse(result);
      logApiResponse('list_accounts (first page)', response);
      
      // Validate response structure
      expect(response).to.have.property('total').that.is.a('number');
      expect(response).to.have.property('accounts').that.is.an('array');
      expect(response).to.have.property('pagination').that.is.an('object');
      
      // Validate pagination structure
      const pagination = response.pagination;
      expect(pagination).to.have.property('hasMore').that.is.a('boolean');
      expect(pagination).to.have.property('nextCursor');
      expect(pagination).to.have.property('limit', 50);
      expect(pagination).to.have.property('offset', 0);
      
      // Validate accounts structure
      expect(response.accounts).to.have.length.at.most(50);
      expect(response.accounts).to.have.length.at.most(response.total);
      
      if (response.accounts.length > 0) {
        const account = response.accounts[0];
        expect(account).to.have.property('id').that.is.a('string');
        expect(account).to.have.property('name').that.is.a('string');
        expect(account).to.have.property('type').that.is.a('string');
        expect(account).to.have.property('groups').that.is.an('array');
        expect(account).to.have.property('balance').that.is.a('number');
        expect(account).to.have.property('balanceFormatted').that.is.a('string');
        expect(account).to.have.property('normalizedBalance').that.is.a('number');
        expect(account).to.have.property('permanent').that.is.a('boolean');
        expect(account).to.have.property('archived').that.is.a('boolean');
        expect(account).to.have.property('created').that.is.a('string');
        expect(account).to.have.property('lastUpdateMs').that.is.a('string');
        
        // Validate added group property for compatibility
        if (account.groups && account.groups.length > 0) {
          expect(account).to.have.property('group').that.is.a('string');
          expect(account.group).to.equal(account.groups[0].name);
        }
        
        // Validate account type
        expect(account.type).to.be.oneOf(['ASSET', 'LIABILITY', 'INCOME', 'OUTGOING']);
        
        // Validate timestamps
        expect(account.created).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
        expect(account.lastUpdateMs).to.match(/^\d+$/);
      }
      
      // Log account details for debugging
      if (TestMode.DEBUG_API) {
        console.log(`Total accounts: ${response.total}`);
        console.log(`Returned accounts: ${response.accounts.length}`);
        console.log(`Has more: ${pagination.hasMore}`);
        if (response.accounts.length > 0) {
          console.log(`Sample account: ${response.accounts[0].name} (${response.accounts[0].type})`);
        }
      }
    }));
    
    it('should return consistent total count across pages', integrationTest(async () => {
      // Get first page
      const firstResult = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID
        })
      );
      const firstResponse = parseToolResponse(firstResult);
      
      // If there's a next page, get it
      if (firstResponse.pagination.hasMore && firstResponse.pagination.nextCursor) {
        const secondResult = await withRetry(() => 
          context.server.testCallTool('list_accounts', {
            bookId: TEST_BOOK_ID,
            cursor: firstResponse.pagination.nextCursor
          })
        );
        const secondResponse = parseToolResponse(secondResult);
        
        // Total should be consistent across pages
        expect(secondResponse.total).to.equal(firstResponse.total);
        
        // Pagination should make sense
        expect(secondResponse.pagination.offset).to.equal(firstResponse.accounts.length);
        expect(secondResponse.pagination.limit).to.equal(50);
        
        // Account IDs should not overlap between pages
        const firstPageIds = new Set(firstResponse.accounts.map((acc: any) => acc.id));
        const secondPageIds = new Set(secondResponse.accounts.map((acc: any) => acc.id));
        const intersection = new Set([...firstPageIds].filter(id => secondPageIds.has(id)));
        expect(intersection.size).to.equal(0, 'Pages should not have overlapping accounts');
        
        logApiResponse('list_accounts (second page)', secondResponse);
      } else {
        console.log('Only one page of accounts available, pagination test skipped');
      }
    }));
  });
  
  describe('Pagination Functionality', function() {
    it('should handle cursor-based pagination correctly', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const response = parseToolResponse(result);
      
      // If we have more than 50 accounts, pagination should work
      if (response.total > 50) {
        expect(response.pagination.hasMore).to.be.true;
        expect(response.pagination.nextCursor).to.be.a('string');
        expect(response.accounts).to.have.length(50);
        
        // Get next page
        const nextResult = await withRetry(() => 
          context.server.testCallTool('list_accounts', {
            bookId: TEST_BOOK_ID,
            cursor: response.pagination.nextCursor
          })
        );
        const nextResponse = parseToolResponse(nextResult);
        
        // Validate next page
        expect(nextResponse.pagination.offset).to.equal(50);
        expect(nextResponse.accounts).to.have.length.at.most(50);
        expect(nextResponse.accounts).to.have.length.at.most(response.total - 50);
        
        // If total is exactly 100, second page should not have more
        if (response.total === 100) {
          expect(nextResponse.pagination.hasMore).to.be.false;
          expect(nextResponse.pagination.nextCursor).to.be.null;
        }
      } else {
        // If 50 or fewer accounts, no pagination needed
        expect(response.pagination.hasMore).to.be.false;
        expect(response.pagination.nextCursor).to.be.null;
        expect(response.accounts).to.have.length(response.total);
      }
    }));
    
    it('should handle empty book scenario', integrationTest(async () => {
      // This test assumes the test book might be empty
      // or we test with a known empty book ID if available
      const result = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const response = parseToolResponse(result);
      
      // Even empty books should have valid response structure
      expect(response).to.have.property('total').that.is.a('number');
      expect(response).to.have.property('accounts').that.is.an('array');
      expect(response).to.have.property('pagination').that.is.an('object');
      
      // If empty
      if (response.total === 0) {
        expect(response.accounts).to.have.length(0);
        expect(response.pagination.hasMore).to.be.false;
        expect(response.pagination.nextCursor).to.be.null;
        expect(response.pagination.offset).to.equal(0);
      }
    }));
    
    it('should handle invalid cursor gracefully', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID,
          cursor: 'invalid-cursor-123'
        })
      );
      
      const response = parseToolResponse(result);
      
      // Should fallback to first page when cursor is invalid
      expect(response.pagination.offset).to.equal(0);
      expect(response.accounts).to.have.length.at.most(50);
    }));
  });
  
  describe('Error Handling', function() {
    it('should return MCP error for missing bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('list_accounts', {});
        expect.fail('Should have thrown an error for missing bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.equal(-32602); // Invalid params
        expect(error.message).to.include('Missing required parameter: bookId');
      }
    }));
    
    it('should return MCP error for invalid bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('list_accounts', {
          bookId: 'invalid-book-id-123'
        });
        expect.fail('Should have thrown an error for invalid bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.equal(-32603); // Internal error
        expect(error.message).to.include('Book not found: invalid-book-id-123');
      }
    }));
    
    it('should return MCP error for empty bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('list_accounts', {
          bookId: ''
        });
        expect.fail('Should have thrown an error for empty bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.equal(-32602); // Invalid params
        expect(error.message).to.include('Missing required parameter: bookId');
      }
    }));
  });
  
  describe('Performance', function() {
    it('should complete list_accounts request within reasonable time', integrationTest(async () => {
      const startTime = Date.now();
      
      const result = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      parseToolResponse(result); // Ensure response is valid
      
      // Should complete within 15 seconds (generous for network latency)
      expect(duration).to.be.lessThan(15000);
      
      if (TestMode.DEBUG_API) {
        console.log(`list_accounts completed in ${duration}ms`);
      }
    }));
  });
  
  describe('Data Consistency', function() {
    it('should return consistent account data structure', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const response = parseToolResponse(result);
      
      // All accounts should have consistent structure
      response.accounts.forEach((account: any) => {
        expect(account).to.have.property('id').that.is.a('string');
        expect(account).to.have.property('name').that.is.a('string');
        expect(account).to.have.property('type').that.is.a('string');
        expect(account).to.have.property('groups').that.is.an('array');
        expect(account).to.have.property('balance').that.is.a('number');
        expect(account).to.have.property('balanceFormatted').that.is.a('string');
        expect(account).to.have.property('normalizedBalance').that.is.a('number');
        expect(account).to.have.property('permanent').that.is.a('boolean');
        expect(account).to.have.property('archived').that.is.a('boolean');
        expect(account).to.have.property('created').that.is.a('string');
        expect(account).to.have.property('lastUpdateMs').that.is.a('string');
        
        // Validate data types and formats
        expect(account.id).to.have.length.greaterThan(0);
        expect(account.name).to.have.length.greaterThan(0);
        expect(account.type).to.be.oneOf(['ASSET', 'LIABILITY', 'INCOME', 'OUTGOING']);
        expect(account.created).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
        expect(account.lastUpdateMs).to.match(/^\d+$/);
        
        // Validate group structure
        if (account.groups.length > 0) {
          account.groups.forEach((group: any) => {
            expect(group).to.have.property('name').that.is.a('string');
            expect(group).to.have.property('type').that.is.a('string');
            expect(group.name).to.have.length.greaterThan(0);
          });
          
          // Validate added group property
          expect(account).to.have.property('group', account.groups[0].name);
        }
      });
    }));
    
    it('should return sorted accounts consistently', integrationTest(async () => {
      // Get first page twice
      const result1 = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID
        })
      );
      const response1 = parseToolResponse(result1);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result2 = await withRetry(() => 
        context.server.testCallTool('list_accounts', {
          bookId: TEST_BOOK_ID
        })
      );
      const response2 = parseToolResponse(result2);
      
      // Results should be identical
      expect(response1.total).to.equal(response2.total);
      expect(response1.accounts).to.have.length(response2.accounts.length);
      
      // Account order should be consistent
      response1.accounts.forEach((account1: any, index: number) => {
        const account2 = response2.accounts[index];
        expect(account1.id).to.equal(account2.id);
        expect(account1.name).to.equal(account2.name);
        expect(account1.type).to.equal(account2.type);
      });
    }));
  });
});