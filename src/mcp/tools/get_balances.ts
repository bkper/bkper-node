import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getBkperInstance } from '../bkper-factory.js';

interface GetBalancesParams {
  bookId: string;
  query?: string;
}

interface BalancesResponse {
  total: number;
  balances: Array<any>;
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

    // Get configured Bkper instance
    const bkper = getBkperInstance();

    // Get the book first
    const book = await bkper.getBook(params.bookId);
    if (!book) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Book not found: ${params.bookId}`
      );
    }

    // Get balances from the book with query (required by bkper-js)
    // Use 'on:$m' as default query to get balances for current month
    const actualQuery = params.query || 'on:$m';
    const balancesReport = await book.getBalancesReport(actualQuery);
    const bkperBalances = balancesReport.getBalancesContainers();
    
    // Map BalancesContainer objects to response format
    const balances = bkperBalances.map((balanceContainer: any) => {
      const account = balanceContainer.getAccount();
      const group = balanceContainer.getGroup();
      
      return {
        account: {
          id: account?.getId?.() || group?.getId?.() || balanceContainer.getName(),
          name: balanceContainer.getName(),
          type: account?.getType?.() || undefined
        },
        balance: balanceContainer.getPeriodBalance()?.toString() || '0',
        cumulative: balanceContainer.getCumulativeBalance()?.toString() || '0'
      };
    });
    const total = balances.length;

    // Build response with all balances
    const response: BalancesResponse = {
      total,
      balances,
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
  description: `Get all account balances with optional query filtering.

QUERY SYNTAX:
Balances queries support account, group, and date filtering:

Account Filtering:
- account:'AccountName' - Match specific account balance
- group:'GroupName' - Match balances for accounts in group

Date Filtering:
- on:YYYY-MM-DD - Balances on specific date
- after:YYYY-MM-DD - Balances after date  
- before:YYYY-MM-DD - Balances before date
- Date variables: $d (today), $m (current month), $y (current year)

QUERY EXAMPLES:
- account:'Cash' - Cash account balance
- group:'Current Assets' - All current asset balances
- on:2024-01-31 - All balances as of January 31, 2024
- account:'Cash' on:$m - Cash balance at end of current month
- group:'Revenue' after:2024-01-01 - Revenue balances since start of year

LIMITATIONS:
Balances queries do NOT support amount filtering, text search, or property filtering.
Use list_transactions tool for more advanced filtering.`,
  inputSchema: {
    type: 'object',
    properties: {
      bookId: {
        type: 'string',
        description: 'The unique identifier of the book'
      },
      query: {
        type: 'string',
        description: 'Optional query to filter balances (e.g., "account:\'Cash\'", "group:\'Assets\'", "on:2024-01-31")'
      }
    },
    required: ['bookId']
  }
};