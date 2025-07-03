import { expect, setupTestEnvironment, getTestPaths } from '../helpers/test-setup.js';
import { BkperMcpServerType, GroupData, BookData } from '../helpers/mock-interfaces.js';
import { setupMocks, createMockBkperForBook, setMockBkper } from '../helpers/mock-factory.js';
import { loadBooks } from '../helpers/fixture-loader.js';

const { __dirname } = getTestPaths(import.meta.url);

// Load test data
const mockBooks: BookData[] = loadBooks(__dirname);

// Define mock groups with hierarchical structure
const mockGroups: GroupData[] = [
  {
    id: 'assets-group',
    name: 'Assets',
    type: 'INCOMING',
    hidden: false,
    permanent: true,
    properties: {}
  },
  {
    id: 'current-assets-group',
    name: 'Current Assets',
    type: 'INCOMING',
    hidden: false,
    permanent: false,
    parent: { id: 'assets-group', name: 'Assets' },
    properties: {}
  },
  {
    id: 'cash-group',
    name: 'Cash',
    type: 'INCOMING',
    hidden: false,
    permanent: false,
    parent: { id: 'current-assets-group', name: 'Current Assets' },
    properties: { category: 'liquid' }
  },
  {
    id: 'fixed-assets-group',
    name: 'Fixed Assets',
    type: 'INCOMING',
    hidden: false,
    permanent: false,
    parent: { id: 'assets-group', name: 'Assets' },
    properties: {}
  },
  {
    id: 'liabilities-group',
    name: 'Liabilities',
    type: 'OUTGOING',
    hidden: false,
    permanent: true,
    properties: {}
  },
  {
    id: 'current-liabilities-group',
    name: 'Current Liabilities',
    type: 'OUTGOING',
    hidden: false,
    permanent: false,
    parent: { id: 'liabilities-group', name: 'Liabilities' },
    properties: {}
  }
];

// Setup mocks and import server
setupMocks();

const { BkperMcpServer } = await import('../../../src/mcp/server.js');

describe('MCP Server - get_groups Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    // Create mock with books + groups support
    const mockBkper = createMockBkperForBook(mockBooks, undefined, undefined, undefined, mockGroups);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should register get_groups tool in MCP tools list', async function() {
    const response = await server.testListTools();
    
    const getGroupsTool = response.tools.find((tool: any) => tool.name === 'get_groups');
    
    expect(getGroupsTool).to.exist;
    expect(getGroupsTool!.name).to.equal('get_groups');
    expect(getGroupsTool!.description).to.include('hierarchical');
    expect(getGroupsTool!.inputSchema).to.have.property('properties');
    expect(getGroupsTool!.inputSchema.properties).to.have.property('bookId');
    expect(getGroupsTool!.inputSchema.required).to.include('bookId');
  });

  it('should have proper MCP tool schema for get_groups', async function() {
    const response = await server.testListTools();
    const getGroupsTool = response.tools.find((tool: any) => tool.name === 'get_groups');
    
    expect(getGroupsTool).to.exist;
    expect(getGroupsTool!.inputSchema).to.deep.equal({
      type: 'object',
      properties: {
        bookId: {
          type: 'string',
          description: 'The unique identifier of the book'
        }
      },
      required: ['bookId']
    });
  });
});

describe('MCP Server - get_groups Tool Calls', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    // Create mock with books + groups support
    const mockBkper = createMockBkperForBook(mockBooks, undefined, undefined, undefined, mockGroups);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
  });

  it('should handle MCP get_groups tool call and return hierarchical structure', async function() {
    const response = await server.testCallTool('get_groups', { bookId: 'book-1' });
    
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
    
    // Verify hierarchical structure
    expect(jsonResponse.groups).to.be.an('array');
    expect(jsonResponse.total).to.equal(6); // Total number of groups
    
    // Find root groups (no parent)
    const rootGroups = jsonResponse.groups;
    expect(rootGroups).to.have.length(2); // Assets and Liabilities
    
    // Check Assets hierarchy
    const assetsGroup = rootGroups.find((g: any) => g.name === 'Assets');
    expect(assetsGroup).to.exist;
    expect(assetsGroup.id).to.equal('assets-group');
    expect(assetsGroup.type).to.equal('INCOMING');
    expect(assetsGroup.children).to.be.an('array');
    expect(assetsGroup.children).to.have.length(2); // Current Assets and Fixed Assets
    
    // Check nested structure
    const currentAssets = assetsGroup.children.find((g: any) => g.name === 'Current Assets');
    expect(currentAssets).to.exist;
    expect(currentAssets.children).to.have.length(1); // Cash
    expect(currentAssets.children[0].name).to.equal('Cash');
    expect(currentAssets.children[0].properties).to.deep.equal({ category: 'liquid' });
  });

  it('should handle empty groups response', async function() {
    // Create mock with no groups
    const mockBkper = createMockBkperForBook(mockBooks, undefined, undefined, undefined, []);
    setMockBkper(mockBkper);
    server = new BkperMcpServer();
    
    const response = await server.testCallTool('get_groups', { bookId: 'book-1' });
    const jsonResponse = JSON.parse(response.content[0].text as string);
    
    expect(jsonResponse.groups).to.be.an('array');
    expect(jsonResponse.groups).to.have.length(0);
    expect(jsonResponse.total).to.equal(0);
  });

  it('should handle MCP error for missing bookId parameter', async function() {
    try {
      await server.testCallTool('get_groups', {});
      expect.fail('Should have thrown an error for missing bookId');
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });

  it('should correctly build deeply nested hierarchies', async function() {
    const response = await server.testCallTool('get_groups', { bookId: 'book-1' });
    const jsonResponse = JSON.parse(response.content[0].text as string);
    
    // Navigate to the deepest level (Cash under Current Assets under Assets)
    const assetsGroup = jsonResponse.groups.find((g: any) => g.name === 'Assets');
    const currentAssets = assetsGroup.children.find((g: any) => g.name === 'Current Assets');
    const cashGroup = currentAssets.children.find((g: any) => g.name === 'Cash');
    
    expect(cashGroup).to.exist;
    expect(cashGroup.name).to.equal('Cash');
    expect(cashGroup.type).to.equal('INCOMING');
    expect(cashGroup.children).to.be.an('array');
    expect(cashGroup.children).to.have.length(0); // Leaf node
  });

  it('should include all group properties in response', async function() {
    const response = await server.testCallTool('get_groups', { bookId: 'book-1' });
    const jsonResponse = JSON.parse(response.content[0].text as string);
    
    // Check that all properties are included
    const assetsGroup = jsonResponse.groups.find((g: any) => g.name === 'Assets');
    expect(assetsGroup).to.have.all.keys('id', 'name', 'type', 'hidden', 'permanent', 'properties', 'children');
    expect(assetsGroup.hidden).to.equal(false);
    expect(assetsGroup.permanent).to.equal(true);
    expect(assetsGroup.properties).to.deep.equal({});
  });
});