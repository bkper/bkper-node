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
      expect(response.resources).to.have.lengthOf(4);
      
      // Check that all expected resources are present
      const resourceUris = response.resources.map(r => r.uri);
      expect(resourceUris).to.include('bkper://getting-started');
      expect(resourceUris).to.include('bkper://balances-query');
      expect(resourceUris).to.include('bkper://transactions-query');
      expect(resourceUris).to.include('bkper://error-handling');
      
      // Check each resource has required properties
      response.resources.forEach(resource => {
        expect(resource).to.have.property('uri');
        expect(resource).to.have.property('name');
        expect(resource).to.have.property('description');
        expect(resource).to.have.property('mimeType', 'text/markdown');
      });
    });
  });

  describe('readResource', function() {
    it('should read the getting-started resource', async function() {
      const response = await server.testReadResource('bkper://getting-started');
      
      expect(response).to.have.property('contents');
      expect(response.contents).to.be.an('array');
      expect(response.contents).to.have.lengthOf(1);
      
      const content = response.contents[0];
      expect(content).to.have.property('uri', 'bkper://getting-started');
      expect(content).to.have.property('mimeType', 'text/markdown');
      expect(content).to.have.property('text');
      expect(content.text).to.include('# Bkper MCP Getting Started Guide');
      expect(content.text).to.include('Books');
      expect(content.text).to.include('Authentication');
      expect(content.text).to.include('Account Fundamentals');
      expect(content.text).to.include('Tool Selection Guide');
    });

    it('should read the balances-query resource', async function() {
      const response = await server.testReadResource('bkper://balances-query');
      
      expect(response).to.have.property('contents');
      expect(response.contents).to.be.an('array');
      expect(response.contents).to.have.lengthOf(1);
      
      const content = response.contents[0];
      expect(content).to.have.property('uri', 'bkper://balances-query');
      expect(content).to.have.property('mimeType', 'text/markdown');
      expect(content).to.have.property('text');
      expect(content.text).to.include('# Balances Query Guide');
      expect(content.text).to.include('account:');
      expect(content.text).to.include('group:');
    });

    it('should read the transactions-query resource', async function() {
      const response = await server.testReadResource('bkper://transactions-query');
      
      expect(response).to.have.property('contents');
      expect(response.contents).to.be.an('array');
      expect(response.contents).to.have.lengthOf(1);
      
      const content = response.contents[0];
      expect(content).to.have.property('uri', 'bkper://transactions-query');
      expect(content).to.have.property('mimeType', 'text/markdown');
      expect(content).to.have.property('text');
      expect(content.text).to.include('# Transactions Query Guide');
      expect(content.text).to.include('amount>');
      expect(content.text).to.include('AND');
      expect(content.text).to.include('OR');
    });

    it('should read the error-handling resource', async function() {
      const response = await server.testReadResource('bkper://error-handling');
      
      expect(response).to.have.property('contents');
      expect(response.contents).to.be.an('array');
      expect(response.contents).to.have.lengthOf(1);
      
      const content = response.contents[0];
      expect(content).to.have.property('uri', 'bkper://error-handling');
      expect(content).to.have.property('mimeType', 'text/markdown');
      expect(content).to.have.property('text');
      expect(content.text).to.include('# Error Handling Guide');
      expect(content.text).to.include('Authentication Errors');
      expect(content.text).to.include('INVALID_PARAMS');
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