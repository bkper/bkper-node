import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOAuthToken } from '../../auth/local-auth-service.js';

interface GetBookParams {
  bookId: string;
}

export async function handleGetBook(params: GetBookParams, bkperInstance: any): Promise<CallToolResult> {
  try {
    // Validate required parameters
    if (!params.bookId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: bookId'
      );
    }

    // Configure Bkper with authentication (only if not mocked)
    if (bkperInstance.setConfig) {
      bkperInstance.setConfig({
        apiKeyProvider: async () => process.env.BKPER_API_KEY || '',
        oauthTokenProvider: () => getOAuthToken()
      });
    }

    // Get the specific book
    const book = await bkperInstance.getBook(params.bookId);
    
    if (!book) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Book not found: ${params.bookId}`
      );
    }

    // Return book JSON data
    const bookJson = book.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ book: bookJson }, null, 2),
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
  description: 'Retrieve detailed information about a specific book',
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