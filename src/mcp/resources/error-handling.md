# Error Handling Guide

## Overview

This guide covers common errors, troubleshooting strategies, and best practices for handling errors when using the Bkper MCP tools.

## Common Error Categories

### 1. Authentication Errors

#### Invalid or Missing Credentials
```
Error: Authentication failed
Cause: OAuth token expired or invalid
Solution: Re-authenticate using the CLI `bkper login` command
```

#### API Key Issues
```
Error: API key not found or invalid
Cause: Missing or incorrect BKPER_API_KEY environment variable
Solution: Verify API key configuration in environment
```

### 2. Book Access Errors

#### Book Not Found
```
Error: Book not found: book-123
Cause: Invalid book ID or insufficient permissions
Solution: Use list_books to verify available books
```

#### Insufficient Permissions
```
Error: Access denied to book
Cause: User doesn't have read/write access to the book
Solution: Contact book owner to grant appropriate permissions
```

### 3. Query Syntax Errors

#### Invalid Query Syntax
```
Error: Invalid query syntax
Common causes:
- Unmatched quotes: account:'Cash Balance
- Invalid operators: account:Cash (missing quotes)
- Malformed dates: on:01/15/2024 (use YYYY-MM-DD)
```

#### Unsupported Operations
```
Error: Unsupported operation in balances query
Cause: Using transaction-only operators in get_balances
Example: get_balances({ query: "amount>1000" })
Solution: Use list_transactions for complex filtering
```

### 4. Resource Not Found Errors

#### Account Not Found
```
Error: Account 'NonExistentAccount' not found
Cause: Account name doesn't exist or is misspelled
Solution: Use list_accounts to verify exact account names
```

#### Group Not Found
```
Error: Group 'NonExistentGroup' not found
Cause: Group name doesn't exist or is misspelled
Solution: Use get_groups to verify exact group names
```

### 5. Pagination Errors

#### Invalid Cursor
```
Error: Invalid pagination cursor
Cause: Cursor expired or malformed
Solution: Restart pagination from the beginning
```

#### Cursor Mismatch
```
Error: Cursor doesn't match current query
Cause: Query changed between paginated requests
Solution: Use consistent queries across pagination
```

## Troubleshooting Strategies

### 1. Step-by-Step Debugging

#### For Book Access Issues
1. **Verify book access**
   ```javascript
   list_books()  // Check available books
   ```

2. **Test basic access**
   ```javascript
   get_book({ bookId: "book-123" })  // Verify book details
   ```

3. **Check account structure**
   ```javascript
   list_accounts({ bookId: "book-123" })  // Verify accounts exist
   ```

#### For Query Issues
1. **Start with simple queries**
   ```javascript
   // Start simple
   get_balances({ bookId: "book-123" })
   
   // Add complexity gradually
   get_balances({ bookId: "book-123", query: "account:'Cash'" })
   ```

2. **Test query components separately**
   ```javascript
   // Test account filter
   get_balances({ query: "account:'Cash'" })
   
   // Test date filter
   get_balances({ query: "on:2024-01-31" })
   
   // Combine when both work
   get_balances({ query: "account:'Cash' on:2024-01-31" })
   ```

### 2. Validation Techniques

#### Account Name Validation
```javascript
// Get exact account names
const accounts = await list_accounts({ bookId: "book-123" })
const accountNames = accounts.accounts.map(acc => acc.name)
console.log("Available accounts:", accountNames)
```

#### Group Structure Validation
```javascript
// Get group hierarchy
const groups = await get_groups({ bookId: "book-123" })
console.log("Available groups:", groups.groups)
```

#### Date Format Validation
```javascript
// Valid date formats
"2024-01-31"    // Correct
"$m"            // Current month variable
"$d-7"          // 7 days ago

// Invalid formats
"01/31/2024"    // Wrong format
"Jan 31, 2024"  // Wrong format
```

### 3. Error Recovery Patterns

#### Authentication Recovery
```javascript
// Check authentication first
try {
  await list_books()
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    console.log("Please re-authenticate using 'bkper login'")
    return
  }
  throw error
}
```

#### Query Fallback Strategy
```javascript
// Try specific query first, fall back to broader query
try {
  return await get_balances({ 
    bookId: "book-123", 
    query: "account:'Specific Account'" 
  })
} catch (error) {
  if (error.message.includes('not found')) {
    // Fall back to group query
    return await get_balances({ 
      bookId: "book-123", 
      query: "group:'Assets'" 
    })
  }
  throw error
}
```

## Error Response Format

### MCP Error Structure
```javascript
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Missing required parameter: bookId",
    "details": {
      "parameter": "bookId",
      "expected": "string",
      "received": "undefined"
    }
  }
}
```

### Common Error Codes
- **INVALID_PARAMS** - Missing or invalid parameters
- **UNAUTHORIZED** - Authentication issues
- **NOT_FOUND** - Resource not found
- **INTERNAL_ERROR** - Server-side issues
- **METHOD_NOT_FOUND** - Invalid tool name

## Best Practices for Error Prevention

### 1. Input Validation

#### Always Validate Book IDs
```javascript
// Good practice
const books = await list_books()
const validBookIds = books.books.map(b => b.id)
if (!validBookIds.includes(bookId)) {
  throw new Error(`Invalid book ID: ${bookId}`)
}
```

#### Validate Account Names
```javascript
// Good practice
const accounts = await list_accounts({ bookId })
const validNames = accounts.accounts.map(a => a.name)
if (!validNames.includes(accountName)) {
  throw new Error(`Account not found: ${accountName}`)
}
```

### 2. Query Construction

#### Use Proper Quoting
```javascript
// Correct: Quote names with spaces
"account:'Accounts Receivable'"
"group:'Current Assets'"

// Incorrect: Missing quotes
"account:Cash Balance"  // Will fail
```

#### Validate Date Formats
```javascript
// Valid patterns
const validDatePattern = /^\d{4}-\d{2}-\d{2}$/
const validVariablePattern = /^\$[dmy](-\d+)?$/

function validateDate(dateStr) {
  return validDatePattern.test(dateStr) || 
         validVariablePattern.test(dateStr)
}
```

### 3. Pagination Handling

#### Robust Pagination Pattern
```javascript
async function getAllTransactions(bookId, query) {
  const allTransactions = []
  let cursor = null
  
  while (true) {
    try {
      const response = await list_transactions({
        bookId,
        query,
        cursor,
        limit: 100
      })
      
      allTransactions.push(...response.transactions)
      
      if (!response.hasMore) break
      cursor = response.cursor
      
    } catch (error) {
      if (error.message.includes('cursor')) {
        // Restart pagination if cursor issues
        cursor = null
        continue
      }
      throw error
    }
  }
  
  return allTransactions
}
```

### 4. Error Logging and Monitoring

#### Structured Error Logging
```javascript
function logError(error, context) {
  console.error({
    timestamp: new Date().toISOString(),
    error: error.message,
    code: error.code,
    context: context,
    stack: error.stack
  })
}
```

#### Performance Monitoring
```javascript
async function monitoredQuery(queryFn, context) {
  const start = Date.now()
  try {
    const result = await queryFn()
    const duration = Date.now() - start
    
    if (duration > 5000) {  // Log slow queries
      console.warn(`Slow query detected: ${duration}ms`, context)
    }
    
    return result
  } catch (error) {
    logError(error, context)
    throw error
  }
}
```

## Recovery Strategies

### 1. Authentication Recovery
1. **Check token expiry** - Tokens may expire after extended use
2. **Re-authenticate** - Use CLI `bkper login` command
3. **Verify environment** - Check API key configuration
4. **Test minimal access** - Try `list_books` first

### 2. Query Recovery
1. **Simplify query** - Remove complex filters
2. **Validate components** - Test each part separately
3. **Check spelling** - Verify exact account/group names
4. **Use discovery tools** - `list_accounts`, `get_groups` for validation

### 3. Network Recovery
1. **Retry with backoff** - Implement exponential backoff
2. **Check connectivity** - Verify network access
3. **Verify endpoints** - Ensure API endpoints are accessible
4. **Monitor rate limits** - Respect API rate limiting

### 4. Data Recovery
1. **Verify book structure** - Check if accounts/groups changed
2. **Update local cache** - Refresh account/group information
3. **Check permissions** - Ensure continued access rights
4. **Validate data integrity** - Compare with known good states

## Integration with Development Workflow

### 1. Testing Strategy
- **Unit tests** - Test error handling in isolation
- **Integration tests** - Test with real API errors
- **Mock error responses** - Test error scenarios safely
- **Recovery testing** - Test error recovery mechanisms

### 2. Monitoring and Alerting
- **Error rate monitoring** - Track error frequency
- **Response time monitoring** - Detect performance issues
- **Authentication monitoring** - Track auth failures
- **Query performance** - Monitor slow queries

### 3. Documentation
- **Error catalogs** - Document common error patterns
- **Recovery procedures** - Step-by-step recovery guides
- **API change tracking** - Monitor for breaking changes
- **User guidance** - Provide clear error messages to users