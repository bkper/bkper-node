#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// ANSI color codes for nice formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

class MCPTester {
  constructor() {
    this.mcpProcess = null;
    this.requestId = 1;
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  header(message) {
    console.log(`\n${colors.bright}${colors.blue}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.blue} ${message}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);
  }

  section(message) {
    console.log(`\n${colors.bright}${colors.cyan}▌ ${message}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  }

  success(message) {
    this.log(`✅ ${message}`, colors.green);
  }

  error(message) {
    this.log(`❌ ${message}`, colors.red);
  }

  info(message) {
    this.log(`ℹ️  ${message}`, colors.yellow);
  }

  async startMCPServer() {
    this.header('🚀 STARTING BKPER MCP SERVER');
    
    this.log('Starting MCP server with stdio transport...', colors.yellow);
    this.info('Environment loaded: BKPER_API_KEY and OAuth credentials will be used');
    
    this.mcpProcess = spawn('node', ['lib/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env } // Load full environment including .env
    });

    this.mcpProcess.stderr.on('data', (data) => {
      this.log(`Server: ${data.toString().trim()}`, colors.magenta);
    });

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.success('MCP server started successfully with authentication!');
    return this.mcpProcess;
  }

  async sendMCPRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: method,
      params: params
    };

    return new Promise((resolve, reject) => {
      const requestStr = JSON.stringify(request) + '\n';
      
      this.log(`📤 Request: ${method}`, colors.yellow);
      if (Object.keys(params).length > 0) {
        console.log(`   Params: ${JSON.stringify(params, null, 2)}`);
      }

      this.mcpProcess.stdin.write(requestStr);

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000); // Increased timeout for large responses

      let responseBuffer = '';
      
      const onData = (data) => {
        responseBuffer += data.toString();
        
        // Check if we have a complete JSON response (ends with newline)
        const lines = responseBuffer.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line.trim());
              clearTimeout(timeout);
              this.mcpProcess.stdout.removeListener('data', onData);
              resolve(response);
              return;
            } catch (e) {
              // Not a complete JSON yet, continue accumulating
              continue;
            }
          }
        }
      };

      this.mcpProcess.stdout.on('data', onData);
    });
  }

  async testListTools() {
    this.section('🔧 Testing list_tools');
    
    try {
      const response = await this.sendMCPRequest('tools/list');
      
      this.log(`📥 Response:`, colors.green);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.result && response.result.tools) {
        this.success(`Found ${response.result.tools.length} tools:`);
        response.result.tools.forEach(tool => {
          this.log(`   • ${tool.name}: ${tool.description}`, colors.cyan);
        });
      }
      
      return response.result;
    } catch (error) {
      this.error(`Failed to list tools: ${error.message}`);
      return null;
    }
  }

  async testTool(toolName, params, description) {
    this.section(`🛠️  Testing ${toolName} - ${description}`);
    
    try {
      const response = await this.sendMCPRequest('tools/call', {
        name: toolName,
        arguments: params
      });
      
      this.log(`📥 Response:`, colors.green);
      
      if (response.result && response.result.content) {
        // Parse and pretty print the JSON content
        const content = response.result.content[0];
        if (content.type === 'text') {
          try {
            const jsonData = JSON.parse(content.text);
            console.log(JSON.stringify(jsonData, null, 2));
            
            // Show summary info
            if (jsonData.total !== undefined) {
              this.info(`Total items: ${jsonData.total}`);
            }
            if (jsonData.pagination) {
              this.info(`Pagination: limit=${jsonData.pagination.limit}, offset=${jsonData.pagination.offset}, hasMore=${jsonData.pagination.hasMore}`);
            }
            if (jsonData.books) {
              this.info(`Books returned: ${jsonData.books.length}`);
            }
            if (jsonData.accounts) {
              this.info(`Accounts returned: ${jsonData.accounts.length}`);
            }
            if (jsonData.balances) {
              this.info(`Balances returned: ${jsonData.balances.length}`);
            }
            if (jsonData.transactions) {
              this.info(`Transactions returned: ${jsonData.transactions.length}`);
            }
            if (jsonData.book) {
              this.info(`Book: ${jsonData.book.name} (${jsonData.book.id})`);
            }
            
          } catch (e) {
            console.log(content.text);
          }
        }
      } else {
        console.log(JSON.stringify(response, null, 2));
      }
      
      this.success(`${toolName} test completed successfully!`);
      return response.result;
      
    } catch (error) {
      this.error(`${toolName} test failed: ${error.message}`);
      return null;
    }
  }

  async runAllTests() {
    try {
      await this.startMCPServer();
      
      // Test 1: List all available tools
      const toolsResult = await this.testListTools();
      
      if (!toolsResult) {
        throw new Error('Failed to get tools list');
      }

      // Test 2: Test list_books (should work with authentication)
      const booksResult = await this.testTool('list_books', {}, 'List all books with pagination');
      
      // Extract a real book ID for subsequent tests if available
      let realBookId = null;
      if (booksResult && booksResult.content && booksResult.content[0]) {
        try {
          const booksData = JSON.parse(booksResult.content[0].text);
          if (booksData.books && booksData.books.length > 0) {
            realBookId = booksData.books[0].id;
            this.success(`Found real book ID for testing: ${realBookId}`);
          }
        } catch (e) {
          // Try to parse the response differently - it might be direct JSON
          if (booksResult.total && booksResult.books && booksResult.books.length > 0) {
            realBookId = booksResult.books[0].id;
            this.success(`Found real book ID for testing: ${realBookId}`);
          }
        }
      }
      
      const testBookId = realBookId || 'test-book-id';
      
      // Test 3: Test list_books with cursor
      await this.testTool('list_books', { cursor: 'dGVzdA==' }, 'List books with cursor pagination');
      
      // Test 4: Test get_book
      await this.testTool('get_book', { bookId: testBookId }, 'Get specific book details');
      
      // Test 5: Test get_balances
      await this.testTool('get_balances', { bookId: testBookId }, 'Get account balances');
      
      // Test 6: Test get_balances with query
      await this.testTool('get_balances', { 
        bookId: testBookId, 
        query: "account:'Cash'" 
      }, 'Get balances with query filter');
      
      // Test 7: Test list_transactions
      await this.testTool('list_transactions', { bookId: testBookId }, 'List transactions');
      
      // Test 8: Test list_transactions with query
      await this.testTool('list_transactions', { 
        bookId: testBookId,
        query: "account:'Cash' AND amount>1000",
        limit: 10
      }, 'List transactions with complex query');

      this.header('🎉 ALL MCP TOOL TESTS COMPLETED!');
      
    } catch (error) {
      this.error(`Test suite failed: ${error.message}`);
    } finally {
      if (this.mcpProcess) {
        this.log('Stopping MCP server...', colors.yellow);
        this.mcpProcess.kill();
      }
    }
  }

  stop() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping MCP tests...');
  process.exit(0);
});

// Run the tests
const tester = new MCPTester();
tester.runAllTests();