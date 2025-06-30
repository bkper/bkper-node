---
name: install-mcp-on-claude-desktop
description: Install Bkper MCP server on Claude Desktop for testing.
---

I'll install the Bkper MCP server configuration to Claude Desktop by:
1. Reading the BKPER_API_KEY from your .env file
2. Creating the Claude Desktop config with the correct paths
3. Installing it to the appropriate Claude Desktop directory

Let me set this up for you:

```bash
# First, check if .env file exists and read the API key
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create one with BKPER_API_KEY=your_key"
    exit 1
fi

# Extract the API key from .env file
BKPER_API_KEY=$(grep "^BKPER_API_KEY=" .env | cut -d '=' -f2- | tr -d '"'"'"'')

if [ -z "$BKPER_API_KEY" ]; then
    echo "Error: BKPER_API_KEY not found in .env file"
    exit 1
fi

# Get the absolute path to the project
PROJECT_PATH=$(pwd)

# Create the Claude Desktop config
cat > claude_desktop_config.json << EOF
{
  "mcpServers": {
    "bkper": {
      "command": "node",
      "args": ["${PROJECT_PATH}/lib/cli.js", "mcp", "start"],
      "env": {
        "BKPER_API_KEY": "${BKPER_API_KEY}"
      }
    }
  }
}
EOF

# Ensure the project is built
echo "Building the project..."
bun run build

# Create Claude Desktop config directory if it doesn't exist
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
mkdir -p "$CLAUDE_CONFIG_DIR"

# Install the config
cp claude_desktop_config.json "$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo "✅ Bkper MCP server configuration installed successfully!"
echo "📍 Config file: $CLAUDE_CONFIG_DIR/claude_desktop_config.json"
echo "🔄 Please restart Claude Desktop to load the MCP server"
echo ""
```