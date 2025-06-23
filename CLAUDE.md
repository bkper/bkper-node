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