import { expect } from 'chai';
import { BkperMcpServer } from '../../../src/mcp/server.js';

describe('MCP Server - get_groups Tool Integration', function() {
  let server: BkperMcpServer;
  const testBookId = process.env.TEST_BOOK_ID;

  before(function() {
    if (!testBookId) {
      this.skip();
    }
    
    if (!process.env.BKPER_API_KEY) {
      this.skip();
    }
  });

  beforeEach(function() {
    server = new BkperMcpServer();
  });

  // 30 second timeout for integration tests
  this.timeout(30000);

  it('should get groups in hierarchical format from test book', async function() {
    const response = await server.testCallTool('get_groups', { 
      bookId: testBookId!
    });
    
    // Verify MCP response structure
    expect(response).to.have.property('content');
    expect(response.content).to.be.an('array');
    expect(response.content).to.have.length(1);
    expect(response.content[0]).to.have.property('type', 'text');
    expect(response.content[0]).to.have.property('text');
    
    // Parse the JSON response
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse).to.have.property('groups');
    expect(jsonResponse).to.have.property('total');
    
    // Verify we have groups
    expect(jsonResponse.groups).to.be.an('array');
    expect(jsonResponse.total).to.be.a('number');
    expect(jsonResponse.total).to.be.at.least(0);
    
    // If there are groups, verify structure
    if (jsonResponse.groups.length > 0) {
      const firstGroup = jsonResponse.groups[0];
      expect(firstGroup).to.have.property('id');
      expect(firstGroup).to.have.property('name');
      expect(firstGroup).to.have.property('type');
      expect(firstGroup).to.have.property('hidden');
      expect(firstGroup).to.have.property('permanent');
      expect(firstGroup).to.have.property('properties');
      expect(firstGroup).to.have.property('children');
      expect(firstGroup.children).to.be.an('array');
      
      // Log the structure for debugging
      console.log(`Found ${jsonResponse.total} groups in hierarchical structure`);
      console.log(`Root groups: ${jsonResponse.groups.map((g: any) => g.name).join(', ')}`);
    }
  });

  it('should handle real nested group hierarchies', async function() {
    const response = await server.testCallTool('get_groups', { 
      bookId: testBookId!
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    
    // Look for any group with children
    let foundNestedGroup = false;
    
    function checkForNesting(groups: any[], level = 0): void {
      for (const group of groups) {
        if (group.children && group.children.length > 0) {
          foundNestedGroup = true;
          console.log(`${'  '.repeat(level)}${group.name} has ${group.children.length} children`);
          checkForNesting(group.children, level + 1);
        }
      }
    }
    
    checkForNesting(jsonResponse.groups);
    
    // Log whether we found nested groups
    if (foundNestedGroup) {
      console.log('Found nested group hierarchies in test book');
    } else {
      console.log('No nested groups found in test book - all groups are flat');
    }
  });

  it('should complete the request within reasonable time', async function() {
    const startTime = Date.now();
    
    await server.testCallTool('get_groups', { 
      bookId: testBookId!
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within 10 seconds even with network latency
    expect(duration).to.be.below(10000);
    console.log(`get_groups completed in ${duration}ms`);
  });
});