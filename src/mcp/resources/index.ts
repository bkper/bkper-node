import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
  ListResourcesResult,
  ReadResourceResult,
  ErrorCode,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  [key: string]: unknown;  // Allow additional properties
}

// Define available resources
const RESOURCES: ResourceDefinition[] = [
  {
    uri: 'bkper://getting-started',
    name: 'Bkper MCP Getting Started Guide',
    description: 'Comprehensive guide covering core concepts, account fundamentals, tool selection, workflows, and best practices',
    mimeType: 'text/markdown'
  },
  {
    uri: 'bkper://balances-query',
    name: 'Balance Query Syntax Guide',
    description: 'Complete reference for balance query filters and operators used with get_balances tool',
    mimeType: 'text/markdown'
  },
  {
    uri: 'bkper://transactions-query',
    name: 'Transaction Query Syntax Guide',
    description: 'Comprehensive reference for transaction query filters, operators, and logical combinations',
    mimeType: 'text/markdown'
  },
  {
    uri: 'bkper://error-handling',
    name: 'Error Handling Guide',
    description: 'Common errors, troubleshooting strategies, and best practices for error prevention',
    mimeType: 'text/markdown'
  }
];

export async function handleListResources(): Promise<ListResourcesResult> {
  return {
    resources: RESOURCES
  };
}

export async function handleReadResource(uri: string): Promise<ReadResourceResult> {
  // Find the resource definition
  const resource = RESOURCES.find(r => r.uri === uri);
  
  if (!resource) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Resource not found: ${uri}`
    );
  }

  try {
    // Map URI to file path
    let filePath: string;
    switch (uri) {
      case 'bkper://getting-started':
        filePath = join(__dirname, 'getting-started.md');
        break;
      case 'bkper://balances-query':
        filePath = join(__dirname, 'balances-query.md');
        break;
      case 'bkper://transactions-query':
        filePath = join(__dirname, 'transactions-query.md');
        break;
      case 'bkper://error-handling':
        filePath = join(__dirname, 'error-handling.md');
        break;
      default:
        throw new McpError(
          ErrorCode.InvalidParams,
          `Unknown resource URI: ${uri}`
        );
    }

    // Read the file content
    const content = readFileSync(filePath, 'utf-8');

    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: content
        }
      ]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to read resource: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}