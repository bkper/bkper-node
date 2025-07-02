import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getBkperInstance } from '../bkper-factory.js';
import { AccountType, BalanceType } from 'bkper-js';

interface GetBalancesParams {
  bookId: string;
  query?: string;
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
    // Use 'on:$m' as default query to get balances for current month
    const actualQuery = params.query || 'on:$m';
    const balancesReport = await book.getBalancesReport(actualQuery);
    const bkperBalances = balancesReport.getBalancesContainers();
    
    let type = BalanceType.TOTAL;


    
    // Use BalancesDataTableBuilder to generate matrix
    let matrix: any[][];
    if (bkperBalances.length > 0) {
      const balanceContainer = bkperBalances[0];


      const isTimeBased = (actualQuery.includes('after:') || actualQuery.includes('before:')) || actualQuery.includes('by:');

      if (isTimeBased) {
        const accountType = (await balanceContainer.getGroup())?.getType() || (await balanceContainer.getAccount())?.getType();
        if (accountType === AccountType.ASSET || accountType === AccountType.LIABILITY) {
          type = BalanceType.CUMULATIVE;
        } else {
          type = BalanceType.PERIOD;
        }
      }

      // Get the first container to access createDataTable
      const dataTableBuilder = balanceContainer.createDataTable()
        .formatValues(false)    // Raw numbers for LLMs
        .formatDates(true)     // YYYY-MM-DD dates
        .raw(true)              // Raw balances
        .transposed(type !== BalanceType.TOTAL)
        .type(type); // Smart transposition for time-based queries
      
      matrix = dataTableBuilder.build();
    } else {
      // Empty result - just headers
      matrix = [['Account Name', 'Balance']];
    }

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