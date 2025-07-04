import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getBkperInstance } from '../bkper-factory.js';
import { AccountType, BalanceType } from 'bkper-js';

interface GetBalancesParams {
  bookId: string;
  query: string;
}

interface BalancesResponse {
  matrix: any[][];
  query?: string;
}



export async function handleGetBalances(params: GetBalancesParams): Promise<CallToolResult> {
  try {
    // Validate required parameters
    if (!params.bookId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: bookId'
      );
    }

    if (!params.query) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: query'
      );
    }

    // Validate query contains either group: or account: operator
    if (!params.query.includes('group:') && !params.query.includes('account:')) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Query must include either \'group:\' or \'account:\' operator for proper balance filtering. Example: "group:\'Assets\' on:$m" or "account:\'Cash\' on:$m"'
      );
    }

    // Get configured Bkper instance
    const bkper = getBkperInstance();

    // Get the book first
    const book = await bkper.getBook(params.bookId, true);
    if (!book) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Book not found: ${params.bookId}`
      );
    }

    // Get balances from the book with query (required by bkper-js)
    const actualQuery = params.query;
    const balancesReport = await book.getBalancesReport(actualQuery);
    
    let type = BalanceType.TOTAL;

    // Use BalancesDataTableBuilder to generate matrix
    let matrix: any[][];

      const isTimeBased = (actualQuery.includes('after:') || actualQuery.includes('before:')) || actualQuery.includes('by:');

      if (isTimeBased) {
        type = BalanceType.CUMULATIVE;
      }


      // Get the first container to access createDataTable
    const dataTableBuilder = balancesReport.createDataTable()
      .formatValues(false)    // Raw numbers for LLMs
      .formatDates(true)     // YYYY-MM-DD dates
      .raw(true)              // Raw balances
      .expanded(-1)
      .type(type); // Smart transposition for time-based queries

      matrix = dataTableBuilder.build();


    // Build response with matrix format
    const response: BalancesResponse = {
      matrix,
      query: actualQuery
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
    // Re-throw MCP errors as-is
    if (error instanceof McpError) {
      throw error;
    }
    
    // Handle other errors
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to get balances: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const getBalancesToolDefinition = {
  name: 'get_balances',
  description: `Get account balances with query filtering. CRITICAL: 
  For Balance Sheet analysis, use permanent root groups (groups with Assets, Liabilities sub-groups) with 'on:' dates.
  For P&L analysis, use non-permanent root groups (Revenue/Incoming, Expenses/Outgoing) with 'after:' and 'before:' date ranges. 
  See the usage-guide resource for root group selection rules.`,
  inputSchema: {
    type: 'object',
    properties: {
      bookId: {
        type: 'string',
        description: 'The unique identifier of the book'
      },
      query: {
        type: 'string',
        description: 'Required query to filter balances (e.g., "account:\'Cash\'", "group:\'Assets\'", "on:2024-01-31")'
      }
    },
    required: ['bookId', 'query']
  }
};