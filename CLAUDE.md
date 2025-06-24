# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is the Bkper Node.js command line client - a CLI tool for creating and updating Bkper Apps and Bots. It's built in TypeScript and compiled to ES modules.

## Key Commands

### Build and Development
- `bun run build` - Full build (clean + compile TypeScript)
- `bun run dev` - Development mode with TypeScript watch
- `bun run build:clean` - Clean build artifacts using gts
- `bun run build:compile` - Compile TypeScript only

### Package Management
- `bun install` - Install dependencies (used automatically in prebuild)
- `bun run upgrade:api` - Update Bkper API types and bkper-js to latest versions

### Versioning and Publishing
- `bun run patch/minor/major` - Version bump and publish workflow

## Architecture

### Project Structure
- `src/` - TypeScript source code
  - `cli.ts` - Main CLI entry point with Commander.js commands
  - `index.ts` - Library export (only exports getOAuthToken function)
  - `auth/local-auth-service.ts` - OAuth authentication handling
- `lib/` - Compiled JavaScript output (ES modules with source maps)

### Core Components

#### CLI Commands (`src/cli.ts`)
- `login` - Authenticate with Bkper and store credentials
- `logout` - Remove stored credentials
- `app -c/-u` - Create or update Bkper apps based on bkperapp.yaml/json config
- `mcp` - Start Bkper MCP server for Model Context Protocol integration

#### Authentication (`src/auth/local-auth-service.ts`)
- Uses Google OAuth2 with local auth flow
- Stores credentials in `~/.bkper-credentials.json`
- Requires `keys.json` file for OAuth client configuration
- Main export: `getOAuthToken()` function for bkper-js integration

#### Configuration
- Apps are configured via `bkperapp.yaml` or `bkperapp.json` files
- Environment variables required:
  - `BKPER_API_KEY` - API access
  - `BKPER_CLIENT_SECRET` - App operations
  - `BKPER_DEVELOPER_EMAIL` - Developer identification
  - `BKPER_USER_EMAILS` - User permissions

### Dependencies
- `bkper-js` - Core Bkper API client library
- `commander` - CLI framework
- `@google-cloud/local-auth` - Google OAuth authentication
- `yaml` - YAML configuration parsing

### Bkper-JS Library Usage

#### Authentication & Initialization
```typescript
import { App, Bkper } from 'bkper-js';
import { getOAuthToken } from './auth/local-auth-service.js';

// Configure Bkper with API key and OAuth token providers
Bkper.setConfig({
  apiKeyProvider: async () => process.env.BKPER_API_KEY || '',
  oauthTokenProvider: () => getOAuthToken()
});
```

#### Key Concepts
- **Apps**: Bkper applications/bots that extend functionality
- **Books**: Top-level containers for accounting data (like individual company ledgers)
- **Accounts**: Categories within books (assets, liabilities, income, expenses)
- **Transactions**: Financial entries that move money between accounts
- **Collections**: Groups of related books for multi-currency/multi-entity operations

#### Common Usage Patterns
```typescript
// Create/Update Apps (from CLI implementation)
const appConfig = JSON.parse(fs.readFileSync('./bkperapp.json', 'utf8'));
const app = new App(appConfig)
  .setReadme(fs.readFileSync('./README.md', 'utf8'))
  .setClientSecret(process.env.BKPER_CLIENT_SECRET)
  .setDeveloperEmail(process.env.BKPER_DEVELOPER_EMAIL)
  .setUserEmails(process.env.BKPER_USER_EMAILS);

// Create or update the app
const createdApp = await app.create();
const updatedApp = await app.update();
```

#### Authentication Flow
The `getOAuthToken()` function from `local-auth-service.ts` handles:
1. Google OAuth2 flow with local authentication
2. Credential storage in `~/.bkper-credentials.json`
3. Token refresh and management
4. Returns valid access tokens for Bkper API calls

#### TypeScript Types Reference
**IMPORTANT**: When writing code that uses bkper-js, you MUST refer to and respect the official TypeScript type definitions. These provide the authoritative interface contracts for all classes and methods.

- **bkper-js Types**: https://raw.githubusercontent.com/bkper/bkper-js/refs/heads/main/lib/index.d.ts
- **bkper-api-types**: https://raw.githubusercontent.com/bkper/bkper-api-types/master/index.d.ts

Key principles:
- Always use the exact method signatures defined in the TypeScript types
- Respect the enum values (AccountType, Permission, Visibility)
- Follow the proper class hierarchy (Bkper → Book → Account/Transaction)
- Use the correct property names and types as defined in the interfaces
- **For MCP responses**: Use the raw API types from bkper-api-types (especially Book interface)
- **For implementation**: Use the high-level bkper-js library wrapper for auth and endpoints

#### MCP Implementation Details

##### MCP Tool Response Format

list_books tool should return all bkper.Book properties from bkper-api-types:



// Get books using high-level wrapper
```typescript
const books = await Bkper.getBooks();
// Return raw API format (bkper.Book[]) for MCP response
return books.map(book => book.json()); // Should match bkper-api-types bkper.Book interface
```

##### Local Testing Strategy
```bash
# Start MCP server locally
bun run build && node lib/cli.js mcp start

# Test with MCP client or manual protocol testing
# (Implementation details to be determined during development)
```

#### External Resources
- [bkper-js GitHub Repository](https://github.com/bkper/bkper-js)
- [Bkper API Documentation](https://help.bkper.com/en/articles/4208937-bkper-api-reference)
- [Bkper Developer Hub](https://developers.bkper.com/)
- Example bot implementations:
  - [Tax Bot](https://github.com/bkper/bkper-tax-bot)
  - [Exchange Bot](https://github.com/bkper/bkper-exchange-bot)
  - [Portfolio Bot](https://github.com/bkper/bkper-portfolio-bot)

### TypeScript Configuration
- Extends Google TypeScript style (gts)
- Compiles to ES2015 with ES modules
- Generates declaration files and source maps
- Custom type roots include `@bkper` types

## Development Notes
- Uses Bun as package manager and runtime
- ES modules throughout (type: "module" in package.json)
- Google TypeScript Style (gts) for linting and formatting
- No test framework currently configured
- **NEVER modify any files inside `node_modules/` directory** - these are managed dependencies