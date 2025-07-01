# Bkper MCP Usage Guide

## Tool Selection Quick Reference

### For Balance Analysis and Calculations
**Always use `get_balances`** - This is THE tool for all balance-related queries and financial analysis.

### For Transaction Inspection Only  
**Use `list_transactions`** - Only for viewing transaction details, never for balance calculations.

## Key Usage Patterns

### 1. Balance Sheet Analysis (Permanent Accounts)
Use `get_balances` with a specific date:
- `query: "group:'Assets' on:$m"` - Current month-end balances
- `query: "group:'Liabilities' on:2024-12-31"` - Year-end balances

### 2. P&L Analysis (Non-Permanent Accounts)
Use `get_balances` with date ranges:
- `query: "group:'Revenue' after:01/2024 before:01/2025"` - Full year revenue
- `query: "group:'Expenses' after:$m-1 before:$m"` - Current month expenses

### 3. Group-Based Filtering
Always prefer filtering by groups for financial analysis:
- `group:'Current Assets'` - All accounts in the group
- `group:'Operating Expenses'` - Expense category analysis

## Important Rules

1. **Never use `list_transactions` for balance calculations** - Transactions are for inspection only
2. **Always use monthly granularity** for date queries when possible
3. **Group filtering is preferred** over individual account filtering for analysis
4. **Date variables**: Use `$m` for current month, `$y` for current year, `$d` for today