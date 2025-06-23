# MCP Server Integration Plan - Minimal First Version

## 1. Single Tool Implementation
- Create basic MCP server with one tool: `list_books`
- Tool functionality:
  - List all books in the authenticated user's Bkper account
  - Allow selection of a specific book by ID or name
  - Return book details (name, ID, basic info)

## 2. Minimal CLI Integration
- Add simple `mcp` command to `src/cli.ts`
- Single subcommand: `start` (starts MCP server)
- Use existing authentication system (`getOAuthToken()`)
- Basic error handling only

## 3. Core MCP Implementation
- Create `src/mcp/server.ts` - minimal MCP server
- Implement single tool handler for book listing
- Use bkper-js library for book operations
- Standard MCP protocol compliance

## 4. Build Integration
- Update TypeScript compilation to include MCP files
- Ensure ES module compatibility
- No additional build scripts needed

## Future Enhancements (after v1)
- Add more tools (create transactions, manage accounts, etc.)
- Enhanced CLI commands (stop, status, config)
- Advanced error handling and logging
- Comprehensive documentation