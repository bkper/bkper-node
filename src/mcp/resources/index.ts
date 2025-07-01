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
    uri: 'bkper://usage-guide',
    name: 'Bkper MCP Usage Guide',
    description: 'Comprehensive guide on how to use Bkper MCP tools for financial analysis',
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
      case 'bkper://usage-guide':
        filePath = join(__dirname, 'usage-guide.md');
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