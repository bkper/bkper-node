# Balances Query Guide for get_balances Tool

This guide provides documentation for the query syntax used in the `get_balances` MCP tool. The balances query syntax is a simplified subset of the transactions query language.

## Supported Query Operations

Balances queries support a limited set of filtering operations focused on account selection and date ranges.

### Account Filtering

| Operator | Description | Example |
|----------|-------------|---------|
| `account:` | Match balances for a specific account | `account:'Cash'` |
| `group:` | Match balances for accounts in a specific group | `group:'Current Assets'` |

### Date Filtering

| Operator | Description | Example |
|----------|-------------|---------|
| `on:` | Balances on a specific date | `on:2024-01-15` |
| `after:` | Balances after a date | `after:2024-01-01` |
| `before:` | Balances before a date | `before:2024-12-31` |

#### Date Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$d` | Today | `after:$d-30` (last 30 days) |
| `$m` | Current month | `on:$m` (this month) |
| `$y` | Current year | `on:$y` (this year) |

## Common Query Examples

### Basic Account Queries

```
# Cash account balance
account:'Cash'

# All asset account balances
group:'Current Assets'

# All revenue account balances
group:'Revenue'
```

### Date-Based Queries

```
# Balances as of January 31, 2024
on:2024-01-31

# Balances after the start of the year
after:2024-01-01

# Balances as of end of last month
on:$m-1
```

### Combined Queries

```
# Cash balance at year end
account:'Cash' on:2023-12-31

# Asset balances at month end
group:'Current Assets' on:$m

# Revenue balances for the year
group:'Revenue' after:2024-01-01 before:2024-12-31
```

## Query Limitations

**Note:** Balances queries do NOT support the following operations that are available in transaction queries:

- Amount filtering (`amount>`, `amount<`, etc.)
- Text search (`'text'`)
- Property filtering (`propertyName:`)
- Complex logical operators (`AND`, `OR`, `NOT`)
- Multi-account operations (`from:`, `to:`)

For more complex filtering, use the `list_transactions` tool instead.

## Query Best Practices

### Mandatory Filtering Requirements

1. **NEVER query without filters** - Always use account: or group: filters for balance analysis
   ```
   # WRONG - No filtering
   on:2024-01-31
   
   # CORRECT - With group filtering
   group:'Assets' on:2024-01-31
   ```

2. **Strongly prefer root groups** - Use root groups over individual accounts
   ```
   # PREFERRED - Root group filtering
   group:'Assets'
   group:'Revenue'
   group:'Expenses'
   
   # LESS PREFERRED - Individual account filtering
   account:'Cash'
   account:'Sales'
   ```

3. **Root group examples** - Assets, Liabilities, Equity, Revenue, Expenses, Current Assets, Fixed Assets, Operating Expenses

### Performance Tips

1. **Use group filters** - Group filters are efficient for multiple accounts
   ```
   group:'Current Assets'
   ```

2. **Use specific accounts** - Account filters are fastest when you need specific account data
   ```
   account:'Cash'
   ```

3. **Specify dates** - Date filters help narrow results
   ```
   on:2024-01-31
   ```

### Syntax Guidelines

1. **Quote multi-word values** - Use single quotes for names with spaces
   ```
   account:'Accounts Receivable'
   group:'Operating Expenses'
   ```

2. **Date format** - Use YYYY-MM-DD format for dates
   ```
   on:2024-01-15      # Correct
   on:01/15/2024      # Incorrect
   ```

### Common Patterns

#### Month-End Balances
```
# All balances at month end
on:$m

# Asset balances at month end
group:'Assets' on:$m

# Cash position at specific date
account:'Cash' on:2024-01-31
```

#### Year-End Reports
```
# All balances at year end
on:2023-12-31

# Equity balances
group:'Equity' on:2023-12-31
```

#### Comparative Analysis
```
# Beginning of year balances
on:2024-01-01

# End of year balances  
on:2024-12-31
```

## API Usage with Pagination

When using queries with the `get_balances` tool:

- **Fixed 50-item pagination** - Each page returns up to 50 balance records
- **Queries are preserved across pagination** - The same filter applies to all pages
- **Use cursor for next page** - Maintain query context through pagination

### Example API Usage

```javascript
// First page with query
{
  "bookId": "book-123",
  "query": "group:'Assets' on:2024-01-31"
}

// Next page using cursor (query is preserved)
{
  "bookId": "book-123", 
  "query": "group:'Assets' on:2024-01-31",
  "cursor": "eyJvZmZzZXQiOjUwfQ=="
}
```

## Error Handling

Common query errors and solutions:

### Invalid Syntax
```
# Error: Unmatched quotes
account:'Cash Balance

# Fix: Close quotes
account:'Cash Balance'
```

### Invalid Dates
```
# Error: Invalid date format
on:01/15/2024

# Fix: Use YYYY-MM-DD format
on:2024-01-15
```

### Non-existent Accounts/Groups
```
# Error: Account not found
account:'NonExistentAccount'

# Fix: Use exact account name
account:'Cash'
```

### Unsupported Operations
```
# Error: Amount filtering not supported
account:'Cash' amount>1000

# Fix: Use account/group/date filters only
account:'Cash' on:2024-01-31
```

For more advanced filtering capabilities, use the `list_transactions` tool which supports the full query syntax documented in the [Transactions Query Guide](./transactions-query-guide.md).