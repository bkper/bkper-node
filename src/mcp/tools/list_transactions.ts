import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOAuthToken } from '../../auth/local-auth-service.js';

interface ListTransactionsParams {
  bookId: string;
  cursor?: string;
  query?: string;
  limit?: number;
}

interface TransactionsResponse {
  transactions: Array<any>;
  hasMore: boolean;
  cursor: string | null;
  limit: number;
  query?: string;
}

export async function handleListTransactions(params: ListTransactionsParams, bkperInstance: any): Promise<CallToolResult> {
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

    // Get the book first
    const book = await bkperInstance.getBook(params.bookId);
    if (!book) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Book not found: ${params.bookId}`
      );
    }

    // Set up pagination parameters
    const limit = Math.min(params.limit || 25, 100); // Default 25, max 100

    // Get transactions using native API pagination
    const transactionIterator = await book.listTransactions(params.query, limit, params.cursor);
    
    // Get transactions from iterator
    const transactionData = transactionIterator.next();
    const transactions = transactionData.map((transaction: any) => transaction.json());
    
    // Get pagination info from iterator
    const hasMore = transactionIterator.hasNext();
    const nextCursor = transactionIterator.getCursor() || null;

    // Build response
    const response: TransactionsResponse = {
      transactions,
      hasMore,
      cursor: nextCursor,
      limit
    };

    // Include query in response if provided
    if (params.query) {
      response.query = params.query;
    }

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
      `Failed to list transactions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const listTransactionsToolDefinition = {
  name: 'list_transactions',
  description: `List transactions with native API cursor-based pagination and comprehensive query support.

COMPREHENSIVE QUERY SYNTAX:

Account Filtering:
- account:'AccountName' - Transactions involving specific account
- from:'AccountName' - Transactions where account is credit (money from)
- to:'AccountName' - Transactions where account is debit (money to)
- group:'GroupName' - Transactions involving accounts in group
- type:ASSET|LIABILITY|EQUITY|INCOME|OUTGOING - Filter by account type

Date Filtering:
- on:YYYY-MM-DD - Transactions on specific date
- after:YYYY-MM-DD - Transactions after date
- before:YYYY-MM-DD - Transactions before date
- Date variables: $d (today), $m (current month), $y (current year)

Amount Filtering:
- amount:1000 - Exact amount
- amount>500 - Greater than amount
- amount<1000 - Less than amount
- amount>=100 - Greater than or equal
- amount<=5000 - Less than or equal

Text Search and Properties:
- 'search text' - Search transaction descriptions
- propertyName:"value" - Filter by custom property (dynamic)

Logical Operators:
- AND - Both conditions must be true
- OR - Either condition must be true
- NOT - Exclude matching transactions
- () - Group conditions

QUERY EXAMPLES:

Basic:
- account:'Cash' - All Cash transactions
- from:'Cash' - Cash outflows (Cash as credit)
- to:'Expenses' - Money going to Expenses
- group:'Revenue' - All revenue transactions

Date Range:
- after:2024-01-01 before:2024-02-01 - January 2024 transactions
- after:$d-30 - Last 30 days
- on:$m - This month's transactions

Amount-Based:
- amount>5000 - Large transactions over $5,000
- amount>=1000 AND amount<=5000 - Between $1,000-$5,000

Complex:
- account:'Cash' AND amount>1000 AND on:$m - Large cash transactions this month
- (account:'Cash' OR account:'Bank') AND amount>500 - Cash/bank over $500
- group:'Revenue' AND after:2024-01-01 - Revenue since start of year
- NOT account:'Cash' - Exclude cash transactions

Multi-Account:
- from:'Cash' to:'Bank' - Transfers from Cash to Bank
- account:'Cash' OR account:'Checking' - Either account

Performance Tips:
- Use specific date ranges: after:2024-01-01 before:2024-01-31
- Filter by account first: account:'Cash' AND amount>1000
- Use reasonable limits (default 25, max 100)

Syntax Rules:
- Quote multi-word values: account:'Accounts Receivable'
- Case-sensitive account names: account:'Cash' not account:'cash'  
- Date format YYYY-MM-DD: after:2024-01-15
- Queries preserved across pagination automatically`,
  inputSchema: {
    type: 'object',
    properties: {
      bookId: {
        type: 'string',
        description: 'The unique identifier of the book'
      },
      cursor: {
        type: 'string',
        description: 'Pagination cursor for next page (provided by previous response)'
      },
      query: {
        type: 'string',
        description: 'Optional query string to filter transactions using comprehensive syntax (account:, from:, to:, group:, on:, after:, before:, amount:, text search, logical operators, etc.)'
      },
      limit: {
        type: 'number',
        description: 'Number of transactions per page (default: 25, maximum: 100)',
        minimum: 1,
        maximum: 100
      }
    },
    required: ['bookId']
  }
};