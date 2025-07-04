import {
  expect,
  createTestContext,
  integrationTest,
  withRetry
} from './setup/test-helpers.js';
import type { IntegrationTestContext } from './setup/test-helpers.js';

describe('Integration: MCP Server', function() {
  let context: IntegrationTestContext;
  
  before(function() {
    context = createTestContext();
  });
  
  describe('Server Initialization', function() {
    it('should create MCP server instance successfully', integrationTest(async () => {
      expect(context.server).to.exist;
      expect(context.server).to.have.property('testListTools');
      expect(context.server).to.have.property('testCallTool');
    }));
    
    it('should list all available tools', integrationTest(async () => {
      const response = await withRetry(() => 
        context.server.testListTools()
      );
      
      expect(response).to.have.property('tools').that.is.an('array');
      expect(response.tools.length).to.be.greaterThan(0);
      
      // Verify expected tools are present
      const toolNames = response.tools.map((tool: any) => tool.name);
      expect(toolNames).to.include('list_books');
      expect(toolNames).to.include('get_book');
      expect(toolNames).to.include('get_balances');
      expect(toolNames).to.include('list_transactions');
      
      // Verify tool structure
      response.tools.forEach((tool: any) => {
        expect(tool).to.have.property('name').that.is.a('string');
        expect(tool).to.have.property('description').that.is.a('string');
        expect(tool).to.have.property('inputSchema').that.is.an('object');
      });
    }));
  });
  
  describe('Tool Error Handling', function() {
    it('should handle unknown tool gracefully', integrationTest(async () => {
      try {
        await context.server.testCallTool('non_existent_tool');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('Unknown tool');
      }
    }));
    
    it('should handle missing required parameters', integrationTest(async () => {
      // get_book requires bookId parameter
      try {
        await context.server.testCallTool('get_book', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('bookId');
      }
    }));
  });
});