# Bkper MCP Usage Guide

## Quick Start

The Bkper MCP server provides LLM clients with direct access to financial data through specialized tools.

### Root Group Discovery Rule
**Always discover and use root groups dynamically based on account group types:**
- **For Balance Sheet**: Find the root group containing ASSET and LIABILITY account types
- **For P&L**: Find the root group containing INCOMING and OUTGOING account types

### Date Filters Rule
- **Permanent account groups** (ASSET, LIABILITY): Use `on:` for point-in-time
- **Non-permanent account groups** (INCOMING, OUTGOING): Use `after:` and `before:` for periods

## Essential Tools

### Discovery
- `list_books()` - Find available books
- `get_book({ bookId })` - Book details, structure, and group hierarchies

### Analysis
- `get_balances({ bookId, query })` - **THE** tool for all balance analysis
- `list_transactions({ bookId, query })` - Transaction inspection only (never for balance calculations)

## Quick Decision Guide
- Need balance data? → Use `get_balances`
- Need transaction details? → Use `list_transactions` 
- Analyzing Assets/Liabilities? → Use `on:` dates
- Analyzing Revenue/Expenses? → Use `after:` and `before:` dates

## Core Rules

### 1. Root Groups Only
- **Never query subgroups** (Assets, Liabilities, Revenue, Expenses)
- **Never query individual accounts** (Cash, Sales, etc.)
- **Always discover and use root groups** that contain the account types you need

### 2. Correct Tool Selection
- **Balance analysis**: Always use `get_balances`
- **Transaction inspection**: Use `list_transactions` (never for calculations)

### 3. Date Filter Matching
- **Permanent accounts** (ASSET, LIABILITY): Use `on:` dates
- **Non-permanent accounts** (INCOMING, OUTGOING): Use `after:` and `before:` date ranges

### 4. Mandatory Filtering
- Never perform analysis without group filters
- Always include date filters

## Discovering Root Groups

### Step 1: Explore Account Structure
```javascript
// First, understand the book structure and group hierarchies
const bookData = await get_book({ bookId: "book-123" });
// bookData now includes: { book: {...}, groups: [...], totalGroups: N }
```

### Step 2: Identify Root Groups by Account Types
- **For Balance Sheet**: Look for the root group that contains groups with `type: "ASSET"` and `type: "LIABILITY"`
- **For P&L**: Look for the root group that contains groups with `type: "INCOMING"` and `type: "OUTGOING"`

### Step 3: Use the Discovered Root Group
```javascript
// Example: If you discovered "Total Equity" contains ASSET and LIABILITY
get_balances({ 
  bookId: "book-123", 
  query: "group:'Total Equity' on:$m" 
});

// Example: If you discovered "Net Result" contains INCOMING and OUTGOING  
get_balances({ 
  bookId: "book-123", 
  query: "group:'Net Result' after:$m-1 before:$m" 
});
```

## Examples

### Balance Sheet Analysis
```javascript
// After discovering root group for ASSET + LIABILITY accounts
// (example: discovered root group is "Total Equity")

// Monthly balance sheet
get_balances({ 
  bookId: "book-123", 
  query: "group:'Total Equity' on:$m" 
})

// Year-end balance sheet
get_balances({ 
  bookId: "book-123", 
  query: "group:'Total Equity' on:2024-12-31" 
})
```

### P&L Analysis
```javascript
// After discovering root group for INCOMING + OUTGOING accounts
// (example: discovered root group is "Profit & Loss")

// Monthly P&L
get_balances({ 
  bookId: "book-123", 
  query: "group:'Profit & Loss' after:$m-1 before:$m" 
})

// Annual P&L
get_balances({ 
  bookId: "book-123", 
  query: "group:'Profit & Loss' after:2024-01-01 before:2024-12-31" 
})
```

### Complete Financial Statements
```javascript
// After discovering both root groups
const balanceSheet = await get_balances({ 
  bookId: "book-123", 
  query: "group:'Total Equity' on:$m" 
});

const pnl = await get_balances({ 
  bookId: "book-123", 
  query: "group:'Profit & Loss' after:$m-1 before:$m" 
});
```

### Transaction Inspection
```javascript
// Recent transactions (inspection only)
list_transactions({ 
  bookId: "book-123", 
  query: "after:$d-30" 
})

// Large transactions
list_transactions({ 
  bookId: "book-123", 
  query: "amount>1000 after:$m-1 before:$m" 
})
```

## Account Structure Reference

### Account Types
| Type | Nature | Examples |
|------|--------|----------|
| **ASSET** | Permanent | Cash, Accounts Receivable |
| **LIABILITY** | Permanent | Accounts Payable, Loans |
| **INCOMING** | Non-permanent | Sales, Interest Income |
| **OUTGOING** | Non-permanent | Rent, Utilities |

### Example Group Hierarchies
```
Root Group Example 1            Root Group Example 2
"Total Equity"                  "Profit & Loss"
├── Assets                      ├── Revenue
│   ├── Current Assets          │   ├── Product Sales
│   └── Fixed Assets            │   └── Service Revenue
└── Liabilities                 └── Expenses
    ├── Current Liabilities         ├── Operating Expenses
    └── Long-term Liabilities       └── Administrative Expenses
```

**Note**: Root group names vary by book. Always discover the actual names using `get_book()` which includes group hierarchies.

## Quick Reference

### Date Variables
- `$d` - Today
- `$m` - Current month end
- `$y` - Current year end
- `$d-N` - N days ago
- `$m-N` - N months ago

### Query Patterns
```
group:'[ROOT_GROUP_NAME]' on:$m                      // Balance sheet (permanent accounts)
group:'[ROOT_GROUP_NAME]' after:$m-1 before:$m      // P&L (non-permanent accounts)
after:2024-01-01 before:2024-12-31                  // Date range
amount>1000                                          // Amount filter (transactions only)
```

### Analysis Workflow
1. **Discover**: `list_books()` → `get_book()` (includes groups)
2. **Identify Root Groups**: Find groups containing the group types you need
3. **Analyze**: `get_balances()` with discovered root groups
4. **Inspect**: `list_transactions()` for transaction details



## Common Mistakes to Avoid

❌ **Wrong**: `get_balances({ query: "group:'Assets'" })`  
✅ **Right**: `get_balances({ query: "group:'[ROOT_GROUP]' on:$m" })`

❌ **Wrong**: `get_balances({ query: "account:'Cash'" })`  
✅ **Right**: `get_balances({ query: "group:'[ROOT_GROUP]' on:$m" })`

❌ **Wrong**: Using `list_transactions` for balance calculations  
✅ **Right**: Use `get_balances` for all balance analysis

❌ **Wrong**: Using `on:` dates with non-permanent accounts  
✅ **Right**: Use `after:` and `before:` with INCOMING/OUTGOING accounts

❌ **Wrong**: Assuming fixed root group names  
✅ **Right**: Always discover root groups using `get_groups()`