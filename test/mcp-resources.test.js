import { expect } from 'chai';
import { BkperMcpServer } from '../lib/mcp/server.js';

describe('MCP Resources', function() {
  let server;

  before(function() {
    server = new BkperMcpServer();
  });

  describe('listResources', function() {
    it('should list available resources', async function() {
      const response = await server.testListResources();
      
      expect(response).to.have.property('resources');
      expect(response.resources).to.be.an('array');
      expect(response.resources).to.have.lengthOf(1);
      
      const resource = response.resources[0];
      expect(resource).to.have.property('uri', 'bkper://usage-guide');
      expect(resource).to.have.property('name', 'Bkper MCP Usage Guide');
      expect(resource).to.have.property('description');
      expect(resource).to.have.property('mimeType', 'text/markdown');
    });
  });

  describe('readResource', function() {
    it('should read the usage guide resource', async function() {
      const response = await server.testReadResource('bkper://usage-guide');
      
      expect(response).to.have.property('contents');
      expect(response.contents).to.be.an('array');
      expect(response.contents).to.have.lengthOf(1);
      
      const content = response.contents[0];
      expect(content).to.have.property('uri', 'bkper://usage-guide');
      expect(content).to.have.property('mimeType', 'text/markdown');
      expect(content).to.have.property('text');
      expect(content.text).to.include('# Bkper MCP Usage Guide');
      expect(content.text).to.include('get_balances');
      expect(content.text).to.include('list_transactions');
    });
    
    it('should return error for unknown resource', async function() {
      try {
        await server.testReadResource('bkper://unknown');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).to.equal(-32602); // ErrorCode.InvalidParams
        expect(error.message).to.include('Resource not found');
      }
    });
  });
});