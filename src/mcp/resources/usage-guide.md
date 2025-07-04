# Bkper MCP Getting Started Guide

## Overview

The Bkper MCP (Model Context Protocol) server provides LLM clients with direct access to Bkper's financial data through a set of specialized tools. This comprehensive guide covers everything you need to effectively use Bkper MCP, from core concepts to advanced workflows.

## Core Concepts

### Books
**Books** are the primary containers for financial data in Bkper - think of them as individual company ledgers or accounting databases. Each book contains:
- **Accounts** - Categories for organizing financial data (Cash, Revenue, Expenses, etc.)
- **Transactions** - Financial entries that move money between accounts
- **Groups** - Hierarchical organization of accounts (Current Assets, Operating Expenses, etc.)

### Authentication
The MCP server handles authentication automatically using stored OAuth credentials. The authentication flow includes:
- Google OAuth2 integration with Bkper API
- Automatic token refresh
- Secure credential storage

## Account Fundamentals

### Account Types

Bkper supports four fundamental account types based on accounting principles:

| Type | Description | Examples | Normal Balance | Nature |
|------|-------------|----------|----------------|--------|
| **ASSET** | Resources owned by the entity | Cash, Inventory, Equipment | Debit | Permanent |
| **LIABILITY** | Obligations owed to others | Accounts Payable, Loans | Credit | Permanent |
| **INCOMING** | Revenue and gains | Sales, Interest Income | Credit | Non-permanent |
| **OUTGOING** | Expenses and losses | Rent, Utilities, Salaries | Debit | Non-permanent |


### Account Groups and Hierarchies

Groups provide hierarchical organization of accounts, enabling:
- **Logical categorization** - Group related accounts together
- **Efficient reporting** - Analyze entire categories at once
- **Flexible organization** - Create custom hierarchies

#### Common Group Hierarchies

**Equity (Root Group)**
```
Total Equity
├── Assets
│   ├── Current Assets
│   │   ├── Cash
│   │   ├── Checking Account
│   │   └── Accounts Receivable
│   └── Fixed Assets
│       ├── Equipment
│       └── Furniture
└── Liabilities
    ├── Current Liabilities
    │   ├── Accounts Payable
    │   └── Accrued Expenses
    └── Long-term Liabilities
        └── Bank Loan
```

**Net Income (Root Group)**
```
Net Income
├── Revenue
│   ├── Product Sales
│   ├── Service Revenue
│   └── Other Income
└── Expenses
    ├── Operating Expenses
    │   ├── Rent
    │   ├── Utilities
    │   └── Office Supplies
    └── Administrative Expenses
        ├── Legal Fees
        └── Accounting Fees
```

## Tool Selection Guide

### MCP Tools Overview

#### Discovery Tools
- **`list_books`** - Find and explore available books
- **`get_book`** - Get detailed information about a specific book
- **`list_accounts`** - Explore account structure within a book
- **`get_groups`** - Understand account hierarchies and groupings

#### Analysis Tools
- **`get_balances`** - Account balance analysis and financial reporting
- **`list_transactions`** - Transaction-level inspection and filtering

### Key Tool Selection Rules

#### For Balance Analysis and Calculations
**Always use `get_balances`** - This is THE tool for all balance-related queries and financial analysis:
- Balance sheet analysis
- P&L calculations
- Financial reporting
- Account balance inquiries
- Any balance-related calculations

#### For Transaction Inspection Only
**Use `list_transactions`** - Only for viewing transaction details, never for balance calculations:
- Transaction audit trails
- Finding specific transactions
- Understanding transaction details
- **Never for balance calculations**

## Choosing the Right Root Group for Analysis

### Critical Decision: Permanent vs Non-Permanent Accounts

When performing financial analysis, the **most important decision** is choosing the correct root group based on the type of analysis:

#### Balance Sheet Analysis (Point-in-Time)
For balance sheet analysis, **ALWAYS use permanent account root groups**:
- **Equity** - The root group containing both Assets and Liabilities
- **Assets** - For analyzing what the company owns (sub-group of Equity)
- **Liabilities** - For analyzing what the company owes (sub-group of Equity)

These accounts are **permanent** because their balances carry forward from period to period. Always use `on:` date filters for point-in-time analysis.

**Example Balance Sheet Analysis:**
```javascript
// Complete balance sheet (unified under Equity)
get_balances({ 
  bookId: "book-123", 
  query: "group:'Equity' on:$m" 
})

// Assets at month end (sub-group of Equity)
get_balances({ 
  bookId: "book-123", 
  query: "group:'Assets' on:$m" 
})

// Liabilities at year end (sub-group of Equity)
get_balances({ 
  bookId: "book-123", 
  query: "group:'Liabilities' on:2024-12-31" 
})
```

#### Income Statement / P&L Analysis (Period-Based)
For P&L analysis, **ALWAYS use non-permanent account root groups**:
- **Net Income** - The root group containing both Revenue and Expenses
- **Revenue** / **Incoming** - For analyzing income and gains (sub-group of Net Income)
- **Expenses** / **Outgoing** - For analyzing costs and losses (sub-group of Net Income)

These accounts are **non-permanent** because they reset each period. Always use `after:` and `before:` date ranges for period analysis.

**Example P&L Analysis:**
```javascript
// Complete P&L (unified under Net Income)
get_balances({ 
  bookId: "book-123", 
  query: "group:'Net Income' after:$m-1 before:$m" 
})

// Monthly revenue (sub-group of Net Income)
get_balances({ 
  bookId: "book-123", 
  query: "group:'Revenue' after:$m-1 before:$m" 
})

// Annual expenses (sub-group of Net Income)
get_balances({ 
  bookId: "book-123", 
  query: "group:'Expenses' after:2024-01-01 before:2024-12-31" 
})
```

### Root Group Selection Rules

1. **Never mix permanent and non-permanent accounts** in the same analysis
2. **Always start with root groups**, not individual accounts
3. **Use the correct date filters**:
   - Permanent accounts: `on:` for point-in-time
   - Non-permanent accounts: `after:` and `before:` for periods
4. **Common root groups to use**:
   - Balance Sheet: Equity (root), Assets, Liabilities, Current Assets, Fixed Assets, Current Liabilities, Long-term Liabilities
   - P&L: Net Income (root), Revenue, Expenses, Operating Expenses, Administrative Expenses, Cost of Goods Sold

## Basic Workflows

### 1. Book Discovery and Selection

Start by discovering available books:

```javascript
// List all accessible books
list_books()

// Get details about a specific book
get_book({ bookId: "book-123" })

// Explore the account structure
list_accounts({ bookId: "book-123" })
get_groups({ bookId: "book-123" })
```

### 2. Financial Analysis



#### Balance Sheet Analysis (Permanent Accounts)
Use `get_balances` with a specific date:
```javascript
// Assets at month end
get_balances({ 
  bookId: "book-123", 
  query: "group:'Assets' on:$m" 
})

// Liabilities at year end
get_balances({ 
  bookId: "book-123", 
  query: "group:'Liabilities' on:2024-12-31" 
})
```

#### P&L Analysis (Non-Permanent Accounts)
Use `get_balances` with date ranges:
```javascript
// Monthly revenue
get_balances({ 
  bookId: "book-123", 
  query: "group:'Revenue' after:$m-1 before:$m" 
})

// Annual expenses
get_balances({ 
  bookId: "book-123", 
  query: "group:'Expenses' after:2024-01-01 before:2024-12-31" 
})
```

### 3. Transaction Analysis

For detailed transaction inspection:

```javascript
// List recent transactions
list_transactions({ 
  bookId: "book-123", 
  query: "after:$d-30" 
})

// Find large cash transactions
list_transactions({ 
  bookId: "book-123", 
  query: "account:'Cash' AND amount>1000" 
})
```

## Common Use Cases

### Monthly Financial Reporting
```javascript
// Complete monthly financial statements
// 1. Balance Sheet (unified under Equity)
get_balances({ query: "group:'Equity' on:$m" })

// 2. Income Statement (unified under Net Income)
get_balances({ query: "group:'Net Income' after:$m-1 before:$m" })
```

### Cash Flow Analysis
```javascript
// Current cash position
get_balances({ query: "account:'Cash' on:$d" })

// Recent cash transactions
list_transactions({ query: "account:'Cash' AND after:$d-30" })
```

### Account Reconciliation
```javascript
// Account balance verification
get_balances({ query: "account:'Checking Account' on:$d" })

// Recent account transactions
list_transactions({ query: "account:'Checking Account' AND after:$d-7" })
```

## Best Practices

### Performance Optimization

1. **Use Groups for Efficiency**
   ```javascript
   // Preferred: Group-based analysis
   get_balances({ query: "group:'Current Assets'" })
   
   // Less efficient: Individual account queries
   get_balances({ query: "account:'Cash'" })
   get_balances({ query: "account:'Checking'" })
   ```

2. **Specify Date Ranges**
   - Use specific dates to narrow results
   - Leverage date variables: `$d` (today), `$m` (month), `$y` (year)

3. **Filter Strategically**
   - Start with broader queries, then narrow down
   - Combine filters for precision: date + account + amount

### Query Strategy

#### Start Broad, Then Narrow
1. **Explore first**: Use `list_books` and `get_book` to understand available data
2. **Understand structure**: Use `list_accounts` and `get_groups` to understand organization
3. **Analyze efficiently**: Use focused queries with `get_balances` and `list_transactions`
4. **Prefer group queries over account queries**

### Important Rules

1. **MANDATORY FILTERING**: Never perform balance analysis without account: or group: filters
2. **Never use `list_transactions` for balance calculations** - Transactions are for inspection only
3. **Always use monthly granularity** for date queries when possible
4. **Strongly prefer root groups** over individual accounts for analysis:
   - Use `group:'Assets'` instead of `account:'Cash'`
   - Use `group:'Revenue'` instead of `account:'Sales'`
   - Use `group:'Expenses'` instead of `account:'Office Supplies'`
5. **Critical root group selection**:
   - **Balance Sheet**: Use permanent root groups (Equity, Assets, Liabilities) with `on:` dates
   - **P&L Statement**: Use non-permanent root groups (Net Income, Revenue/Incoming, Expenses/Outgoing) with `after:` and `before:` date ranges
   - **Never mix permanent and non-permanent accounts in the same analysis**
6. **Root group examples**: Equity (root), Net Income (root), Assets, Liabilities, Revenue, Expenses, Current Assets, Fixed Assets, Operating Expenses
7. **Date variables**: Use `$m` for current month, `$y` for current year, `$d` for today
8. **Case sensitivity**: Account names must match exactly

## Resource References

For detailed information on specific topics:

### Query Syntax
- **Balance Queries**: See `balances-query` resource for complete balance query syntax
- **Transaction Queries**: See `transactions-query` resource for comprehensive filtering options

### Troubleshooting
- **Error Handling**: See `error-handling` resource for common errors and solutions

## Quick Reference

### Root Group Selection Guide

| Analysis Type | Root Groups | Date Filter | Example |
|--------------|-------------|-------------|---------|
| **Balance Sheet** | Equity, Assets, Liabilities | `on:` | `group:'Equity' on:$m` |
| **P&L Statement** | Net Income, Revenue, Expenses | `after:` `before:` | `group:'Net Income' after:$m-1 before:$m` |

### Essential Commands
```javascript
// Discovery
list_books()                                    // Find available books
get_book({ bookId })                           // Book details
list_accounts({ bookId })                      // List accounts
get_groups({ bookId })                         // View hierarchies

// Analysis
get_balances({ bookId, query })                // Balance analysis
list_transactions({ bookId, query, limit })    // Transaction details
```

### Date Variables
- `$d` - Today
- `$m` - Current month end
- `$y` - Current year end
- `$d-N` - N days ago
- `$m-N` - N months ago

### Query Examples
```
account:'Cash'                    // Specific account
group:'Assets'                    // Account group
on:2024-01-31                    // Point in time
after:2024-01-01 before:2024-02-01  // Date range
amount>1000                      // Amount filter (transactions only)
```

## Getting Help

- Each tool includes parameter documentation in its schema
- Use focused resources for deep dives into specific topics
- Error messages provide specific guidance for common issues
- The MCP server includes built-in validation and helpful error responses