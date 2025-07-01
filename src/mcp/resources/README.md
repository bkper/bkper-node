# MCP Resources Infrastructure

This directory contains resources that are exposed to MCP clients (like Claude Desktop) to provide usage instructions and guidance.

## How It Works

1. **Resource Files**: Markdown files in this directory are exposed as MCP resources
2. **Automatic Discovery**: MCP clients can list and read these resources
3. **Version Controlled**: Instructions evolve with your codebase

## Current Resources

- `usage-guide.md` - Main usage instructions for Bkper MCP tools

## Adding New Resources

1. Create a new markdown file in this directory
2. Add it to the `RESOURCES` array in `index.ts`:
   ```typescript
   const RESOURCES: ResourceDefinition[] = [
     {
       uri: 'bkper://usage-guide',
       name: 'Bkper MCP Usage Guide',
       description: 'Comprehensive guide...',
       mimeType: 'text/markdown'
     },
     // Add new resource here
   ];
   ```
3. Add the file mapping in `handleReadResource()` function
4. Build the project: `bun run build`

## Editing Instructions

1. Edit the markdown files directly
2. Build to copy to lib: `bun run build`
3. Test with MCP client

## How Clients Access Instructions

MCP clients will automatically discover these resources and can:
- List available resources
- Read resource content
- Use the content as context for better tool usage

The instructions help AI assistants understand:
- When to use each tool
- Query syntax and patterns
- Best practices
- Common mistakes to avoid