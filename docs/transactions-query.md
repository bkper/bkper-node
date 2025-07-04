# Transactions Query Guide for list_transactions Tool

This guide provides comprehensive documentation for the query syntax used in the `list_transactions` MCP tool.

## Basic Query Syntax

Bkper queries use a simple text-based syntax with operators and keywords to filter transactions.

### Account Filtering

| Operator | Description | Example |
|----------|-------------|---------|
| `account:` | Match transactions involving a specific account | `account:'Cash'` |
| `from:` | Match transactions where the specified account is the credit account | `from:'Cash'` |
| `to:` | Match transactions where the specified account is the debit account | `to:'Expenses'` |
| `group:` | Match transactions involving accounts in a specific group | `group:'Current Assets'` |

### Date Filtering

| Operator | Description | Example |
|----------|-------------|---------|
| `on:` | Transactions on a specific date | `on:2024-01-15` |
| `after:` | Transactions after a date | `after:2024-01-01` |
| `before:` | Transactions before a date | `before:2024-12-31` |

#### Date Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$d` | Today | `after:$d-30` (last 30 days) |
| `$m` | Current month | `on:$m` (this month) |
| `$y` | Current year | `on:$y` (this year) |

### Amount Filtering

| Operator | Description | Example |
|----------|-------------|---------|
| `amount:` | Exact amount | `amount:1000` |
| `amount>` | Greater than | `amount>500` |
| `amount<` | Less than | `amount<1000` |
| `amount>=` | Greater than or equal | `amount>=100` |
| `amount<=` | Less than or equal | `amount<=5000` |

### Text Search and Properties

| Operator | Description | Example |
|----------|-------------|---------|
| `'text'` | Search transaction descriptions | `'office rent'` |
| `propertyName:` | Filter by custom property (dynamic) | `invoice_number:"INV-2024-001"` |


## Common Query Examples

### Basic Account Queries

```
# All Cash transactions
account:'Cash'

# All transactions from Cash account (Cash as credit)
from:'Cash'

# All transactions to Expenses account (Expenses as debit) 
to:'Expenses'

# All transactions involving Revenue accounts
group:'Revenue'
```

### Date Range Queries

```
# Transactions from January 2024
after:2024-01-01 before:2024-02-01

# Transactions from the last 30 days
after:$d-30

# Transactions on a specific date
on:2024-01-15

# This month's transactions
on:$m

# This year's transactions
on:$y
```

### Amount-Based Queries

```
# Large transactions over $5,000
amount>5000

# Small transactions under $100
amount<100

# Transactions between $1,000 and $5,000
amount>=1000 AND amount<=5000

# Exact amount
amount:2500.50
```

### Text and Properties Queries

```
# Transactions containing specific text
'office rent'

# Transactions with custom property
invoice_number:"INV-2024-001"
```



## Query Best Practices

### Performance Tips

1. **Use specific date ranges** - Narrow down dates for better performance
   ```
   after:2024-01-01 before:2024-01-31
   ```



3. **Use date ranges** - Date filters help narrow results effectively
   ```
   after:2024-01-01 AND before:2024-12-31
   ```

### Syntax Guidelines

1. **Quote multi-word values** - Use single quotes for names with spaces
   ```
   account:'Accounts Receivable'
   'office supplies'
   ```


3. **Date format** - Use YYYY-MM-DD format for dates
   ```
   after:2024-01-15    # Correct
   after:01/15/2024    # Incorrect
   ```

### Common Patterns

#### Monthly Reports
```
# All transactions for January 2024
after:2024-01-01 before:2024-02-01

# Revenue for the month
group:'Revenue' on:$m

# Expenses for the month  
group:'Expenses' AND on:$m
```


#### Reconciliation
```
# Recent large transactions for audit
after:$d-30  amount>5000

```

## API Pagination with Queries

When using queries with the `list_transactions` tool:

- **Queries are preserved across pagination** - The same filter applies to all pages
- **Use reasonable page sizes** - Default is 25, maximum is 100 transactions per page
- **Cursors maintain query context** - Each cursor respects the original query

### Example API Usage

```javascript
// First page with query
{
  "bookId": "book-123",
  "query": "account:'Cash' after:2024-01-01",
  "limit": 50
}

// Next page using cursor (query is preserved)
{
  "bookId": "book-123", 
  "query": "account:'Cash' after:2024-01-01",
  "limit": 50,
  "cursor": "eyJvZmZzZXQiOjUwfQ=="
}
```

## Error Handling

Common query errors and solutions:

### Invalid Syntax
```
# Error: Unmatched quotes
description:'office rent

# Fix: Close quotes
description:'office rent'
```

### Invalid Dates
```
# Error: Invalid date format
after:01/15/2024

# Fix: Use YYYY-MM-DD format
after:2024-01-15
```

### Non-existent Accounts
```
# Error: Account not found
account:'NonExistentAccount'

# Fix: Use exact account name
account:'Cash'
```

For more advanced query patterns and examples, refer to the [Official Bkper Query Guide](https://help.bkper.com/en/articles/2569178-bkper-query-guide).