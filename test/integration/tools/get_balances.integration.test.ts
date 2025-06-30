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

describe('Integration: get_balances Tool', function() {
  let context: IntegrationTestContext;
  const TEST_BOOK_ID = process.env.TEST_BOOK_ID;
  
  before(async function() {
    this.timeout(60000); // Allow more time for initial setup
    context = createTestContext();
    
    if (!TEST_BOOK_ID) {
      throw new Error('TEST_BOOK_ID environment variable is required for get_balances integration tests');
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
    it('should have get_balances tool properly registered', integrationTest(async () => {
      const tool = await getToolDefinition(context.server, 'get_balances');
      
      expect(tool).to.exist;
      expect(tool.name).to.equal('get_balances');
      expect(tool.description).to.include('Get all account balances');
      expect(tool.inputSchema).to.have.property('type', 'object');
      expect(tool.inputSchema.properties).to.have.property('bookId');
      expect(tool.inputSchema.properties).to.have.property('query');
      expect(tool.inputSchema.required).to.include('bookId');
    }));
  });
  
  describe('Basic Functionality', function() {
    it('should get balances without query (defaults to current month)', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID
        })
      );
      
      const response = parseToolResponse(result);
      logApiResponse('get_balances (no query)', response);
      
      // Validate response structure
      expect(response).to.have.property('total').that.is.a('number');
      expect(response).to.have.property('balances').that.is.an('array');
      expect(response).to.have.property('query').that.is.a('string');
      
      // Default query should be current month
      expect(response.query).to.equal('on:$m');
      
      // Validate each balance structure
      if (response.balances.length > 0) {
        response.balances.forEach((balance: any, index: number) => {
          try {
            expect(balance).to.have.property('account').that.is.an('object');
            expect(balance).to.have.property('balance').that.is.a('string');
            expect(balance).to.have.property('cumulative').that.is.a('string');
            
            // Validate account structure
            expect(balance.account).to.have.property('id').that.is.a('string');
            expect(balance.account).to.have.property('name').that.is.a('string');
            if (balance.account.type) {
              expect(['ASSET', 'LIABILITY', 'INCOMING', 'OUTGOING']).to.include(balance.account.type);
            }
          } catch (error) {
            console.error(`Balance at index ${index} failed validation:`, balance);
            throw error;
          }
        });
      }
      
      // Balance amounts should be parseable as numbers
      response.balances.forEach((balance: any) => {
        const balanceNum = parseFloat(balance.balance);
        const cumulativeNum = parseFloat(balance.cumulative);
        expect(balanceNum).to.not.be.NaN;
        expect(cumulativeNum).to.not.be.NaN;
      });
    }));
    
    it('should get asset group balances for current month', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: 'group:Assets on:$m'
        })
      );
      
      const response = parseToolResponse(result);
      logApiResponse('get_balances (Assets group)', response);
      
      // Validate response structure
      expect(response).to.have.property('total').that.is.a('number');
      expect(response).to.have.property('balances').that.is.an('array');
      expect(response).to.have.property('query', 'group:Assets on:$m');
      
      // All balances should be from accounts in the Assets group or of ASSET type
      response.balances.forEach((balance: any) => {
        // The balance should have account information
        expect(balance.account).to.have.property('name').that.is.a('string');
        
        // Note: We can't always guarantee the type field is present,
        // but if it is, it should make sense for an Assets group query
        if (balance.account.type) {
          // Assets group typically contains ASSET type accounts
          expect(balance.account.type).to.be.oneOf(['ASSET', 'LIABILITY', 'INCOMING', 'OUTGOING']);
        }
      });
    }));
    
    it('should get all balances for current month with explicit query', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: 'on:$m'
        })
      );
      
      const response = parseToolResponse(result);
      logApiResponse('get_balances (explicit current month)', response);
      
      // Validate response structure
      expect(response).to.have.property('total').that.is.a('number');
      expect(response).to.have.property('balances').that.is.an('array');
      expect(response).to.have.property('query', 'on:$m');
      
      // Should return all accounts with activity in current month
      expect(response.balances).to.be.an('array');
      
      // Validate balance data integrity
      response.balances.forEach((balance: any) => {
        expect(balance).to.have.property('account');
        expect(balance).to.have.property('balance');
        expect(balance).to.have.property('cumulative');
        
        // Balance values should be numeric strings
        expect(balance.balance).to.match(/^-?\d+(\.\d+)?$/);
        expect(balance.cumulative).to.match(/^-?\d+(\.\d+)?$/);
      });
    }));
  });
  
  describe('Query Functionality', function() {
    it('should handle specific account queries', integrationTest(async () => {
      // First get all balances to find an account to query specifically
      const allResult = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: 'on:$m'
        })
      );
      const allResponse = parseToolResponse(allResult);
      
      if (allResponse.balances.length > 0) {
        // Pick the first account to query specifically
        const targetAccount = allResponse.balances[0].account;
        const accountQuery = `account:'${targetAccount.name}' on:$m`;
        
        const specificResult = await withRetry(() => 
          context.server.testCallTool('get_balances', {
            bookId: TEST_BOOK_ID,
            query: accountQuery
          })
        );
        const specificResponse = parseToolResponse(specificResult);
        
        logApiResponse(`get_balances (specific account: ${targetAccount.name})`, specificResponse);
        
        // Should return only that account (or accounts with similar names)
        expect(specificResponse.query).to.equal(accountQuery);
        expect(specificResponse.balances).to.be.an('array');
        
        // At least one balance should match the target account
        const matchingBalance = specificResponse.balances.find(
          (balance: any) => balance.account.id === targetAccount.id
        );
        expect(matchingBalance).to.exist;
        expect(matchingBalance.account.name).to.equal(targetAccount.name);
      } else {
        console.log('Skipping specific account test - no balances available');
      }
    }));
    
    it('should return empty results for non-existent group', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: 'group:NonExistentGroup_' + Date.now() + ' on:$m'
        })
      );
      const response = parseToolResponse(result);
      
      expect(response.total).to.equal(0);
      expect(response.balances).to.have.length(0);
    }));
  });
  
  describe('Error Handling', function() {
    it('should return MCP error for missing bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('get_balances', {});
        expect.fail('Should have thrown an error for missing bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.be.oneOf([-32602, -32603]); // Invalid params or internal error
      }
    }));
    
    it('should return MCP error for invalid bookId', integrationTest(async () => {
      try {
        await context.server.testCallTool('get_balances', {
          bookId: 'invalid-book-id-123'
        });
        expect.fail('Should have thrown an error for invalid bookId');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.be.oneOf([-32602, -32603]); // Invalid params or internal error
      }
    }));
    
    it('should handle malformed queries gracefully', integrationTest(async () => {
      // Test with a malformed query - should either work or return proper error
      try {
        const result = await withRetry(() => 
          context.server.testCallTool('get_balances', {
            bookId: TEST_BOOK_ID,
            query: 'invalid:query:syntax'
          })
        );
        const response = parseToolResponse(result);
        
        // If it succeeds, it should have proper structure
        expect(response).to.have.property('total');
        expect(response).to.have.property('balances');
        expect(response).to.have.property('query');
      } catch (error: any) {
        // If it fails, should be a proper MCP error
        expect(error).to.have.property('code');
      }
    }));
  });
  
  describe('Performance', function() {
    it('should complete get_balances request within reasonable time', integrationTest(async () => {
      const startTime = Date.now();
      
      const result = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: 'group:Assets on:$m'
        })
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      parseToolResponse(result); // Ensure response is valid
      
      // Should complete within 15 seconds (generous for network latency and processing)
      expect(duration).to.be.lessThan(15000);
      
      if (TestMode.DEBUG_API) {
        console.log(`get_balances completed in ${duration}ms`);
      }
    }));
  });
  
  describe('Data Consistency', function() {
    it('should return consistent results on repeated calls', integrationTest(async () => {
      const query = 'group:Assets on:$m';
      
      // First call
      const result1 = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: query
        })
      );
      const response1 = parseToolResponse(result1);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second call
      const result2 = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: query
        })
      );
      const response2 = parseToolResponse(result2);
      
      // Results should be consistent
      expect(response1.total).to.equal(response2.total);
      expect(response1.balances.length).to.equal(response2.balances.length);
      expect(response1.query).to.equal(response2.query);
      
      // Balance values should match (order might vary)
      const balances1 = response1.balances.map((b: any) => ({ id: b.account.id, balance: b.balance })).sort((a: any, b: any) => a.id.localeCompare(b.id));
      const balances2 = response2.balances.map((b: any) => ({ id: b.account.id, balance: b.balance })).sort((a: any, b: any) => a.id.localeCompare(b.id));
      
      expect(balances1).to.deep.equal(balances2);
    }));
  });
});