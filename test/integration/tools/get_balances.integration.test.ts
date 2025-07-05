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
      expect(tool.inputSchema.required).to.include('query');
    }));
  });
  
  describe('Basic Functionality', function() {
    it('should return MCP error for missing query parameter', integrationTest(async () => {
      try {
        await withRetry(() => 
          context.server.testCallTool('get_balances', {
            bookId: TEST_BOOK_ID
          })
        );
        expect.fail('Should have thrown an error for missing query');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.be.oneOf([-32602, -32603]); // Invalid params or internal error
      }
    }));
    
    it('should return MCP error for query without group or account operator', integrationTest(async () => {
      try {
        await withRetry(() => 
          context.server.testCallTool('get_balances', {
            bookId: TEST_BOOK_ID,
            query: 'on:$m'
          })
        );
        expect.fail('Should have thrown an error for missing group/account operator');
      } catch (error: any) {
        expect(error).to.have.property('code');
        expect(error.code).to.equal(-32602); // Invalid params
        expect(error.message).to.include('group:');
        expect(error.message).to.include('account:');
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
      
      // Validate matrix structure for asset group query - no headers
      if (response.matrix.length === 0) {
        console.log('Warning: Assets group has no data in test book');
      } else {
        // All rows should be valid data entries
        response.matrix.forEach((row: any) => {
          expect(row).to.be.an('array');
          expect(row).to.have.length(2);
          expect(row[0]).to.be.a('string'); // Account name
          expect(row[1]).to.be.a('number'); // Balance
        });
      }
    }));
    
    it('should get all balances for current month with explicit query', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: 'group:Assets on:$m'
        })
      );
      
      const response = parseToolResponse(result);
      logApiResponse('get_balances (explicit current month)', response);
      
      // Validate response structure
      expect(response).to.have.property('matrix').that.is.an('array');
      expect(response).to.have.property('query', 'group:Assets on:$m');
      expect(response).to.not.have.property('total');
      expect(response).to.not.have.property('balances');
      
      // Should return matrix with all accounts
      expect(response.matrix).to.be.an('array');
      expect(response.matrix).to.have.length.greaterThan(0);
      
      // Validate matrix data integrity - no headers
      response.matrix.forEach((row: any) => {
        expect(row).to.have.length(2);
        expect(row[0]).to.be.a('string'); // Account name
        expect(row[1]).to.be.a('number'); // Raw balance number
      });
    }));
  });
  
  describe('Query Functionality', function() {
    it('should handle specific account queries', integrationTest(async () => {
      // Try different group queries to find an account to query specifically
      const queries = ['group:Assets on:$m', 'on:$m', 'group:Liabilities on:$m', 'group:Equity on:$m'];
      let allResponse: any = null;
      
      for (const query of queries) {
        try {
          const result = await withRetry(() => 
            context.server.testCallTool('get_balances', {
              bookId: TEST_BOOK_ID,
              query
            })
          );
          const response = parseToolResponse(result);
          if (response.matrix && response.matrix.length > 0) {
            allResponse = response;
            break;
          }
        } catch (error) {
          // Continue to next query
        }
      }
      
      if (allResponse && allResponse.matrix.length > 0) {
        // Pick the first account to query specifically
        const targetAccount = { name: allResponse.matrix[0][0] };
        const accountQuery = `account:'${targetAccount.name}' on:$m`;
        
        console.log(`Testing specific account query: ${accountQuery}`);
        
        const specificResult = await withRetry(() => 
          context.server.testCallTool('get_balances', {
            bookId: TEST_BOOK_ID,
            query: accountQuery
          })
        );
        const specificResponse = parseToolResponse(specificResult);
        
        logApiResponse(`get_balances (specific account: ${targetAccount.name})`, specificResponse);
        
        // Should return matrix with response (may be empty for specific account)
        expect(specificResponse.query).to.equal(accountQuery);
        expect(specificResponse.matrix).to.be.an('array');
        
        // Only check for data if the query actually returns results
        if (specificResponse.matrix.length > 0) {
          // Matrix should contain data rows (no headers)
          // At least one row should match the target account
          const matchingRow = specificResponse.matrix.find((row: any) => row[0] === targetAccount.name);
          expect(matchingRow).to.exist;
          expect(matchingRow[1]).to.be.a('number');
        } else {
          console.log(`Account '${targetAccount.name}' query returned empty results - this might be expected`);
        }
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
      expect(response.matrix).to.have.length(0); // Empty matrix, no data
    }));
    
    it('should return matrix data for Assets group with 2013-2015 date range', integrationTest(async () => {
      const result = await withRetry(() => 
        context.server.testCallTool('get_balances', {
          bookId: TEST_BOOK_ID,
          query: "group:'Assets' after:2013 before:2015"
        })
      );
      
      const response = parseToolResponse(result);
      logApiResponse('get_balances (Assets group 2013-2015)', response);
      
      // Verify response structure
      expect(response).to.have.property('matrix').that.is.an('array');
      expect(response).to.have.property('query', "group:'Assets' after:2013 before:2015");
      
      // Matrix should have data (headers + at least one data row)
      expect(response.matrix).to.have.length.greaterThan(1, 
        'Matrix should have headers plus at least one data row');
      
      // For time-based queries with date range, matrix should have headers
      const headerRow = response.matrix[0];
      expect(headerRow).to.have.length.greaterThan(2, 
        'Header row should have multiple columns (empty string + date columns)');
      
      // Validate header row structure
      expect(headerRow[0]).to.equal('', 
        'Header row first element should be empty string');
      
      // Rest of header should be date strings (YYYY-MM-DD format)
      for (let i = 1; i < headerRow.length; i++) {
        expect(headerRow[i]).to.be.a('string', 
          `Header column ${i} should be a date string`);
        expect(headerRow[i]).to.match(/^\d{4}-\d{2}-\d{2}$/, 
          `Header column ${i} should be in YYYY-MM-DD format, got: ${headerRow[i]}`);
      }
      
      // Data rows start from index 1
      const dataRows = response.matrix.slice(1);
      expect(dataRows).to.have.length.greaterThan(0, 
        'Should have at least one data row after headers');
      
      // Validate data rows structure
      dataRows.forEach((row: any, index: number) => {
        expect(row).to.have.length(headerRow.length, 
          `Data row ${index + 1} should have same length as header row`);
        expect(row[0]).to.be.a('string', 
          `Data row ${index + 1} first column should be account name`);
        
        // Rest should be numbers (balances for each time period)
        for (let i = 1; i < row.length; i++) {
          expect(row[i]).to.be.a('number', 
            `Data row ${index + 1} column ${i} should be a numeric balance`);
        }
      });
      
      // Log the matrix structure for debugging
      console.log(`Matrix structure: ${response.matrix.length} rows x ${headerRow.length} columns`);
      console.log(`Header: [${headerRow.join(', ')}]`);
      if (dataRows.length > 0) {
        console.log(`Sample data row: [${dataRows[0].join(', ')}]`);
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
          bookId: 'invalid-book-id-123',
          query: 'group:Assets on:$m'
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