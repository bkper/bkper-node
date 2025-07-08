# Bkper MCP Usage Guide

## Essential Tools

### Discovery
- `list_books()` - Find available books
- `get_book({ bookId })` - Book details, structure, and group hierarchies

### Analysis
- `get_balances({ bookId, query })` - **THE** tool for all balance analysis
- `list_transactions({ bookId, query })` - Transaction inspection only (never for balance calculations)

## Core Rules

### 1. Root Group Discovery
**Always discover and use root groups dynamically based on account group types:**
1. Call `get_book({ bookId })` to see the hierarchy
2. Look for the top-level group that contains:
   - **For Balance Sheet**: Both ASSET and LIABILITY account types
   - **For P&L**: Both INCOMING and OUTGOING account types
3. Use that group name (not its children) in your queries

**Example**: If you see this structure:
```
"Total Equity" (root)
├── "Assets" (type: ASSET)
├── "Liabilities" (type: LIABILITY)
```
Then use `group:'Total Equity'` - NOT `group:'Assets'` or `group:'Liabilities'`

### 2. Date Filter Matching

- **Permanent accounts** (ASSET, LIABILITY): Use `before:` dates for point-in-time
- **Non-permanent accounts** (INCOMING, OUTGOING): Use `after:` and `before:` for periods

- **IMPORTANT:** `after:` is inclusive and `before:` is exclusive, so, for example, to filter the whole 2024 year, the range might be `after:2024-01-01 before:2025-01-01` 

### 3. Correct Tool Selection
- **Balance analysis**: Always use `get_balances`
- **Transaction inspection**: Use `list_transactions` (never for calculations)

### 4. Query Requirements (MANDATORY)
- **MUST include either `group:` or `account:` operator in EVERY query**
- Never query subgroups directly (Assets, Liabilities, Revenue, Expenses) - use root groups
- When using `account:`, be specific about individual accounts
- Always include appropriate date filters
- Queries without group/account operators will be rejected with an error

## Examples

### Balance Sheet Analysis
```javascript
// After discovering root group for ASSET + LIABILITY accounts
get_balances({ 
  bookId: "book-123", 
  query: "group:'Total Equity' before:$m" 
})
```

### P&L Analysis
```javascript
// After discovering root group for INCOMING + OUTGOING accounts
get_balances({ 
  bookId: "book-123", 
  query: "group:'Profit & Loss' after:$m-12 before:$m" 
})
```

### Complete Financial Statements
```javascript
// After discovering both root groups
const balanceSheet = await get_balances({ 
  bookId: "book-123", 
  query: "group:'Total Equity' before:$m+1" 
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

**Example 1: Permanent Accounts (Balance Sheet Analysis)**
```
"Total Equity"
├── Assets
│   ├── Current Assets
│   └── Fixed Assets
└── Liabilities
    ├── Current Liabilities
    └── Long-term Liabilities
```

**Example 2: Non-Permanent Accounts (Profit & Loss Analysis)**
```
"Profit & Loss"
├── Revenue
│   ├── Product Sales
│   └── Service Revenue
└── Expenses
    ├── Operating Expenses
    └── Administrative Expenses
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
group:'[ROOT_GROUP_NAME]' before:$m                      // Balance sheet (permanent accounts)
group:'[ROOT_GROUP_NAME]' after:$m-1 before:$m      // P&L (non-permanent accounts)
after:2024-01-01 before:2025-01-01                  // Date range
amount>1000                                          // Amount filter (transactions only)
```

### Analysis Workflow
1. **Discover**: `list_books()` → `get_book()` (includes groups)
2. **Identify Root Groups**: Find groups containing the group types you need
3. **Analyze**: `get_balances()` with discovered root groups
4. **Inspect**: `list_transactions()` for transaction details

## Reports and Insights Formatting

### Markdown Output Preference
When generating financial insights, reports, or analysis, **strongly prefer well-structured Markdown** for better readability across platforms (cloud, desktop, mobile). Use tables for financial data, clear headers for sections, bold formatting for totals and key metrics, and icons to enhance visual appeal.


## Common Mistakes to Avoid

❌ **Wrong**: `get_balances({ query: "before:$m" })` - Missing group/account operator!  
✅ **Right**: `get_balances({ query: "group:'[ROOT_GROUP]' before:$m" })`

❌ **Wrong**: `get_balances({ query: "after:2024-01-01" })` - Missing group/account operator!  
✅ **Right**: `get_balances({ query: "group:'[ROOT_GROUP]' after:2024-01-01 before:2025-01-01" })`

❌ **Wrong**: `get_balances({ query: "group:'Assets'" })` - Using subgroup instead of root group  
✅ **Right**: `get_balances({ query: "group:'[ROOT_GROUP_WITH_ASSETS]' before:$m" })`

❌ **Wrong**: Query without any filtering  
✅ **Right**: Always include `group:` or `account:` operator for focused analysis

❌ **Wrong**: Using `list_transactions` for balance calculations  
✅ **Right**: Use `get_balances` for all balance analysis

❌ **Wrong**: Using `before:` without `after:` dates with non-permanent accounts  
✅ **Right**: Use `after:` and `before:` with INCOMING/OUTGOING accounts

❌ **Wrong**: Using different date variables on same query. E.g.`after:$y-1` and `before:$d`
✅ **Right**: Use same date variables on same query. E.g. `after:$y-1` and `before:$y`

❌ **Wrong**: Assuming fixed root group names  
✅ **Right**: Always discover root groups using `get_book()` then navigate its `groups` property

## CRITICAL REQUIREMENT

**⚠️ ALL get_balances queries MUST include either `group:` or `account:` operator.**
