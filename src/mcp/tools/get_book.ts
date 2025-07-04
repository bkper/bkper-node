import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getBkperInstance } from '../bkper-factory.js';
import { Group } from 'bkper-js';

interface GetBookParams {
  bookId: string;
}

interface GroupNode {
  id: string;
  name: string;
  type: string;
  hidden: boolean;
  permanent: boolean;
  properties: { [name: string]: string };
  children: GroupNode[];
}

function buildHierarchicalStructure(groups: Group[]): GroupNode[] {
  const groupMap = new Map<string, GroupNode>();
  const rootGroups: GroupNode[] = [];
  
  // First pass: create all group nodes
  groups.forEach(group => {
    const node: GroupNode = {
      id: group.getId() || '',
      name: group.getName() || '',
      type: group.getType() || '',
      hidden: group.isHidden() || false,
      permanent: group.isPermanent() || false,
      properties: group.getProperties() || {},
      children: []
    };
    
    groupMap.set(node.id, node);
  });
  
  // Second pass: build hierarchy
  groups.forEach(group => {
    const node = groupMap.get(group.getId() || '');
    if (!node) return;
    
    const parent = group.getParent();
    if (parent) {
      const parentNode = groupMap.get(parent.getId() || '');
      if (parentNode) {
        parentNode.children.push(node);
      }
    } else {
      // No parent = root group
      rootGroups.push(node);
    }
  });
  
  return rootGroups;
}

export async function handleGetBook(params: GetBookParams): Promise<CallToolResult> {
  try {
    // Validate required parameters
    if (!params.bookId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: bookId'
      );
    }

    // Get configured Bkper instance
    const bkperInstance = getBkperInstance();

    // Get the specific book
    const book = await bkperInstance.getBook(params.bookId, false, true);
    
    if (!book) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Book not found: ${params.bookId}`
      );
    }

    // Get book JSON data
    const bookJson = book.json();

    // Get groups from the book
    const groups = await book.getGroups();
    
    // Build hierarchical structure
    const hierarchicalGroups = buildHierarchicalStructure(groups || []);
    
    // Build response with book data and groups
    const response = {
      book: bookJson,
      groups: hierarchicalGroups,
      totalGroups: groups?.length || 0
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    // Handle specific book not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Book not found: ${params.bookId}`
      );
    }
    
    // Re-throw MCP errors as-is
    if (error instanceof McpError) {
      throw error;
    }
    
    // Handle other errors
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to get book: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const getBookToolDefinition = {
  name: 'get_book',
  description: 'Retrieve detailed information about a specific book including its group hierarchy',
  inputSchema: {
    type: 'object',
    properties: {
      bookId: {
        type: 'string',
        description: 'The unique identifier of the book to retrieve'
      }
    },
    required: ['bookId']
  }
};