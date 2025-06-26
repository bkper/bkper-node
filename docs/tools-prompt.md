# Development Requirements

Implement in **two distinct phases**:
1. **Phase 1: Testing** - Create comprehensive tests for all tools
2. **Phase 2: Implementation** - Build the actual tool implementations

## Tool Specifications

### Core Tools Required
- `get_book` (instead of get_book_details)
- `list_accounts` 
- `get_balances`
- `list_books` (existing)
- `list_transactions`

### Pagination Strategy
Apply consistent pagination handling for tools that return large JSON responses:

**For `list_accounts` and `get_balances`:**
- Implement same pagination strategy as `list_books`
- Handle large JSON responses from single API fetch
- Expose paginated interface to users

**For `list_transactions`:**
- Utilize underlying API's cursor-based pagination
- Pass through cursor and pagination features
- **Include query parameter** following Bkper Query Guide specification
- **Expose query documentation** so clients understand how to create queries
- **Provide query examples** for common use cases

## File Organization Requirements

### Structure
- **Ultra-organized** file structure
- **One tool per file** - keep files very small and concise
- **Tests in dedicated test folder** (using existing test structure)
- **Individual handlers** for each tool

### File Naming Convention
```
tools/
├── get_book.js
├── list_accounts.js
├── get_balances.js
├── list_transactions.js
└── [other tools...]

tests/
├── get_book.test.js
├── list_accounts.test.js
├── get_balances.test.js
├── list_transactions.test.js
└── [other tests...]
```

## Code Quality Standards
- **Concise code** - avoid verbose implementations
- **Small, focused files** - each file should serve one clear purpose
- **Clean separation** between tools, handlers, and tests
- **Consistent patterns** across all implementations

## Implementation Priorities
1. Start with Phase 1 (testing) completely before moving to Phase 2
2. Maintain the same high-quality patterns established in `list_books`
3. Ensure all pagination strategies are consistent and efficient
4. **For `list_transactions`**: Include comprehensive query documentation and examples based on [Bkper Query Guide](https://help.bkper.com/en/articles/2569178-bkper-query-guide)
5. **Ultrathink** before implementing any code
6. **Do NOT commit any code**