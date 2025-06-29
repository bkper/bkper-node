#!/bin/bash

# Start the MCP inspector in the background and capture output
npx @modelcontextprotocol/inspector node lib/cli.js mcp start 2>&1 | while IFS= read -r line; do
    echo "$line"
    
    # Check if line contains the URL with token
    if [[ $line =~ http://localhost:6274/\?MCP_PROXY_AUTH_TOKEN=([a-f0-9]+) ]]; then
        URL="${BASH_REMATCH[0]}"
        echo "Waiting for server to fully start..."
        sleep 2
        echo "Opening browser with URL: $URL"
        open "$URL"
    fi
done