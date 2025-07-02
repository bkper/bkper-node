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
      expect(response).to.have.property('matrix').that.is.an('array');
      expect(response).to.have.property('query').that.is.a('string');
      expect(response).to.not.have.property('total');
      expect(response).to.not.have.property('balances');
      
      // Default query should be current month
      expect(response.query).to.equal('on:$m');
      
      // Validate matrix structure
      if (response.matrix.length > 0) {
        // First row should be headers
        const headers = response.matrix[0];
        expect(headers).to.be.an('array');
        expect(headers).to.have.length(2);
        expect(headers[0]).to.equal('Account Name');
        expect(headers[1]).to.equal('Balance');
        
        // Validate data rows
        const dataRows = response.matrix.slice(1);
        dataRows.forEach((row: any, index: number) => {
          try {
            expect(row).to.be.an('array');
            expect(row).to.have.length(2);
            expect(row[0]).to.be.a('string'); // Account name
            expect(row[1]).to.be.a('number'); // Balance as raw number
          } catch (error) {
            console.error(`Matrix row at index ${index + 1} failed validation:`, row);
            throw error;
          }
        });
      }
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
      expect(response).to.have.property('matrix').that.is.an('array');
      expect(response).to.have.property('query', 'group:Assets on:$m');
      expect(response).to.not.have.property('total');
      expect(response).to.not.have.property('balances');
      
      // Validate matrix structure for asset group query
      expect(response.matrix).to.have.length.greaterThan(0);
      const headers = response.matrix[0];
      expect(headers).to.deep.equal(['Account Name', 'Balance']);
      
      // All data rows should be valid matrix entries
      const dataRows = response.matrix.slice(1);
      dataRows.forEach((row: any) => {
        expect(row).to.be.an('array');
        expect(row).to.have.length(2);
        expect(row[0]).to.be.a('string'); // Account name
        expect(row[1]).to.be.a('number'); // Balance
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
      expect(response).to.have.property('matrix').that.is.an('array');
      expect(response).to.have.property('query', 'on:$m');
      expect(response).to.not.have.property('total');
      expect(response).to.not.have.property('balances');
      
      // Should return matrix with all accounts
      expect(response.matrix).to.be.an('array');
      expect(response.matrix).to.have.length.greaterThan(0);
      
      // Validate matrix data integrity
      const headers = response.matrix[0];
      expect(headers).to.deep.equal(['Account Name', 'Balance']);
      
      const dataRows = response.matrix.slice(1);
      dataRows.forEach((row: any) => {
        expect(row).to.have.length(2);
        expect(row[0]).to.be.a('string'); // Account name
        expect(row[1]).to.be.a('number'); // Raw balance number
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
        
        // Should return matrix with only that account (or accounts with similar names)
        expect(specificResponse.query).to.equal(accountQuery);
        expect(specificResponse.matrix).to.be.an('array');
        expect(specificResponse.matrix).to.have.length.greaterThan(0);
        
        // Headers should be standard
        expect(specificResponse.matrix[0]).to.deep.equal(['Account Name', 'Balance']);
        
        // At least one data row should match the target account
        const dataRows = specificResponse.matrix.slice(1);
        const matchingRow = dataRows.find((row: any) => row[0] === targetAccount.name);
        expect(matchingRow).to.exist;
        expect(matchingRow[1]).to.be.a('number');
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
      
      expect(response.matrix).to.be.an('array');
      expect(response.matrix).to.have.length(1); // Only header row
      expect(response.matrix[0]).to.deep.equal(['Account Name', 'Balance']);
    }));
    
    it('should handle group query with date range for time-based matrix', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: "group:'Bkper Assets' after:2022 before:10/2025"
        })
      );
      
      const response = parseToolResponse(result);
      logApiResponse('get_balances (Bkper Assets group with date range)', response);
      
      // Verify response structure
      expect(response).to.have.property('matrix').that.is.an('array');
      expect(response).to.have.property('query', "group:'Bkper Assets' after:2022 before:10/2025");
      
      // Check if the group exists and has data
      if (response.matrix.length === 0) {
        console.log('Warning: Bkper Assets group query returned empty matrix - group may not exist in test book');
        // Test passes but logs warning
      } else if (response.matrix.length === 1 && response.matrix[0][0] === 'Account Name') {
        // Only header row returned - no data
        console.log('Warning: Bkper Assets group has no data in the specified date range');
        expect(response.matrix[0]).to.include('Account Name');
      } else {
        // Matrix has data - for time-based queries with date range, it should be transposed
        const firstRow = response.matrix[0];
        
        // Check if this looks like a header row or data row
        const hasHeaders = firstRow[0] === 'Account' || firstRow[0] === 'Account Name';
        
        if (hasHeaders) {
          // Has headers - validate structure
          expect(firstRow).to.have.length.greaterThan(2); // At least Account + 2 date columns
          
          // Data rows should have account names and numeric values
          const dataRows = response.matrix.slice(1);
          dataRows.forEach((row: any) => {
            expect(row).to.have.length(firstRow.length);
            expect(row[0]).to.be.a('string'); // Account name
            // Rest should be numbers (balances)
            for (let i = 1; i < row.length; i++) {
              expect(row[i]).to.be.a('number');
            }
          });
        } else {
          // No headers - data starts from first row
          // For time-based queries, expect multiple columns
          expect(firstRow).to.have.length.greaterThan(2); // At least account + 2 time periods
          
          // All rows should have consistent structure
          response.matrix.forEach((row: any) => {
            expect(row).to.have.length(firstRow.length);
            expect(row[0]).to.be.a('string'); // Account name
            // Rest should be numbers (balances)
            for (let i = 1; i < row.length; i++) {
              expect(row[i]).to.be.a('number');
            }
          });
        }
      }
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
        
        // If it succeeds, it should have proper matrix structure
        expect(response).to.have.property('matrix');
        expect(response).to.have.property('query');
        expect(response.matrix).to.be.an('array');
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
      expect(response1.matrix.length).to.equal(response2.matrix.length);
      expect(response1.query).to.equal(response2.query);
      
      // Matrix values should match (order might vary, so sort by account name)
      const sortedMatrix1 = [response1.matrix[0], ...response1.matrix.slice(1).sort((a: any, b: any) => a[0].localeCompare(b[0]))];
      const sortedMatrix2 = [response2.matrix[0], ...response2.matrix.slice(1).sort((a: any, b: any) => a[0].localeCompare(b[0]))];
      
      expect(sortedMatrix1).to.deep.equal(sortedMatrix2);
    }));
  });
});