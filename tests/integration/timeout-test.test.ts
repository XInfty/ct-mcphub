import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { SSEClientTransport } from '../../src/clients/sseClientTransport.js';
import { StreamableHTTPClientTransport } from '../../src/clients/streamableHTTPClientTransport.js';
import { createClient } from '@modelcontextprotocol/sdk/client/index.js';
import { TestServerHelper } from '../utils/testServerHelper.js';
import { createMockSettings } from '../utils/mockSettings.js';
import { McpSettings } from '../../src/types/index.js';
import path from 'path';
import fs from 'fs/promises';

describe('Timeout Tests', () => {
  let testServerHelper: TestServerHelper;
  let serverConfigPath: string;

  beforeAll(async () => {
    // Initialize test server helper
    testServerHelper = new TestServerHelper();
    
    // Create temporary config file for timeout testing
    const timeoutSettings: McpSettings = createMockSettings({
      mcpServers: {
        'timeout-test-server': {
          command: 'node',
          args: ['../../src/server.ts'],
          env: {
            NODE_ENV: 'test',
            PORT: '3001',
          },
          enabled: true,
          keepAliveInterval: 5000, // Short interval for testing
          type: 'stdio',
          timeout: 10000, // 10 second timeout for testing
        },
      },
      groups: [
        {
          name: 'timeout-test-group',
          servers: ['timeout-test-server'],
          description: 'Test group for timeout scenarios',
          owner: 'admin',
        },
      ],
    });

    serverConfigPath = path.join(testServerHelper.tempDir, 'timeout-test-config.json');
    await fs.writeFile(serverConfigPath, JSON.stringify(timeoutSettings, null, 2));
    
    // Start test server
    await testServerHelper.startServer(serverConfigPath);
  }, 60000);

  afterAll(async () => {
    // Cleanup test server
    if (testServerHelper) {
      await testServerHelper.cleanupAllServers();
    }
  });

  describe('SSE Transport Timeout Tests', () => {
    it('should handle echo request within timeout limit', async () => {
      const transport = new SSEClientTransport(
        `http://localhost:${testServerHelper.serverPort}/sse/timeout-test-server`
      );
      
      const client = createClient(
        {
          name: 'timeout-test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      try {
        await client.connect(transport);
        
        // Test echo functionality with normal response time
        const echoResponse = await client.request(
          {
            method: 'tools/call',
            params: {
              name: 'echo',
              arguments: {
                message: 'Hello Timeout Test',
              },
            },
          },
          {
            timeout: 15000, // 15 second timeout for this specific request
          }
        );

        expect(echoResponse).toBeDefined();
        expect(echoResponse.content).toBeDefined();
        expect(Array.isArray(echoResponse.content)).toBe(true);
        
        const textContent = echoResponse.content.find((item: any) => item.type === 'text');
        expect(textContent).toBeDefined();
        expect(textContent.text).toContain('Hello Timeout Test');
      } finally {
        await client.close();
      }
    }, 20000);

    it('should timeout when echo request takes too long', async () => {
      const transport = new SSEClientTransport(
        `http://localhost:${testServerHelper.serverPort}/sse/timeout-test-server`
      );
      
      const client = createClient(
        {
          name: 'timeout-test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      try {
        await client.connect(transport);
        
        // Test with very short timeout to force timeout scenario
        await expect(
          client.request(
            {
              method: 'tools/call',
              params: {
                name: 'echo',
                arguments: {
                  message: 'This should timeout',
                  delay: 20000, // 20 second delay to force timeout
                },
              },
            },
            {
              timeout: 5000, // 5 second timeout - should timeout before response
            }
          )
        ).rejects.toThrow();
      } finally {
        await client.close();
      }
    }, 10000);

    it('should handle multiple concurrent echo requests with timeout', async () => {
      const transport = new SSEClientTransport(
        `http://localhost:${testServerHelper.serverPort}/sse/timeout-test-server`
      );
      
      const client = createClient(
        {
          name: 'timeout-test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      try {
        await client.connect(transport);
        
        // Create multiple concurrent requests
        const requests = Array.from({ length: 5 }, (_, i) =>
          client.request(
            {
              method: 'tools/call',
              params: {
                name: 'echo',
                arguments: {
                  message: `Concurrent test ${i}`,
                },
              },
            },
            {
              timeout: 10000, // 10 second timeout per request
            }
          )
        );

        // All requests should complete within timeout
        const results = await Promise.all(requests);
        
        expect(results).toHaveLength(5);
        results.forEach((result, index) => {
          expect(result).toBeDefined();
          expect(result.content).toBeDefined();
          const textContent = result.content.find((item: any) => item.type === 'text');
          expect(textContent.text).toContain(`Concurrent test ${index}`);
        });
      } finally {
        await client.close();
      }
    }, 20000);
  });

  describe('HTTP Transport Timeout Tests', () => {
    it('should handle echo request within timeout limit', async () => {
      const transport = new StreamableHTTPClientTransport(
        `http://localhost:${testServerHelper.serverPort}/message/timeout-test-server`
      );
      
      const client = createClient(
        {
          name: 'timeout-test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      try {
        await client.connect(transport);
        
        // Test echo functionality with normal response time
        const echoResponse = await client.request(
          {
            method: 'tools/call',
          params: {
            name: 'echo',
            arguments: {
              message: 'HTTP Timeout Test',
            },
          },
        },
        {
          timeout: 15000, // 15 second timeout for this specific request
        }
        );

        expect(echoResponse).toBeDefined();
        expect(echoResponse.content).toBeDefined();
        expect(Array.isArray(echoResponse.content)).toBe(true);
        
        const textContent = echoResponse.content.find((item: any) => item.type === 'text');
        expect(textContent).toBeDefined();
        expect(textContent.text).toContain('HTTP Timeout Test');
      } finally {
        await client.close();
      }
    }, 20000);

    it('should timeout when echo request takes too long', async () => {
      const transport = new StreamableHTTPClientTransport(
        `http://localhost:${testServerHelper.serverPort}/message/timeout-test-server`
      );
      
      const client = createClient(
        {
          name: 'timeout-test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      try {
        await client.connect(transport);
        
        // Test with very short timeout to force timeout scenario
        await expect(
          client.request(
            {
              method: 'tools/call',
              params: {
                name: 'echo',
                arguments: {
                  message: 'This should timeout via HTTP',
                  delay: 20000, // 20 second delay to force timeout
                },
              },
            },
            {
              timeout: 5000, // 5 second timeout - should timeout before response
            }
          )
        ).rejects.toThrow();
      } finally {
        await client.close();
      }
    }, 10000);
  });

  describe('Server Configuration Timeout Tests', () => {
    it('should respect server-level timeout configuration', async () => {
      // Create settings with very short server timeout
      const shortTimeoutSettings: McpSettings = createMockSettings({
        mcpServers: {
          'short-timeout-server': {
            command: 'node',
            args: ['../../src/server.ts'],
            env: {
              NODE_ENV: 'test',
              PORT: '3002',
            },
            enabled: true,
            keepAliveInterval: 2000,
            type: 'stdio',
            timeout: 2000, // 2 second server timeout
          },
        },
        groups: [
          {
            name: 'short-timeout-group',
            servers: ['short-timeout-server'],
            description: 'Test group with short timeout',
            owner: 'admin',
          },
        ],
      });

      const shortTimeoutConfigPath = path.join(testServerHelper.tempDir, 'short-timeout-config.json');
      await fs.writeFile(shortTimeoutConfigPath, JSON.stringify(shortTimeoutSettings, null, 2));
      
      // Start server with short timeout
      await testServerHelper.startServer(shortTimeoutConfigPath);

      const transport = new SSEClientTransport(
        `http://localhost:${testServerHelper.serverPort}/sse/short-timeout-server`
      );
      
      const client = createClient(
        {
          name: 'short-timeout-test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      try {
        await client.connect(transport);
        
        // This should timeout due to server configuration
        await expect(
          client.request(
            {
              method: 'tools/call',
              params: {
                name: 'echo',
                arguments: {
                  message: 'Server timeout test',
                  delay: 5000, // 5 second delay exceeds server timeout
                },
              },
            }
          )
        ).rejects.toThrow();
      } finally {
        await client.close();
      }
    }, 15000);
  });

  describe('Timeout Error Handling', () => {
    it('should provide meaningful timeout error messages', async () => {
      const transport = new SSEClientTransport(
        `http://localhost:${testServerHelper.serverPort}/sse/timeout-test-server`
      );
      
      const client = createClient(
        {
          name: 'timeout-test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      try {
        await client.connect(transport);
        
        try {
          await client.request(
            {
              method: 'tools/call',
              params: {
                name: 'echo',
                arguments: {
                  message: 'Error test',
                  delay: 10000,
                },
              },
            },
            {
              timeout: 1000, // Very short timeout
            }
          );
          fail('Expected timeout error');
        } catch (error: any) {
          expect(error).toBeDefined();
          expect(error.message).toBeDefined();
          // Check that error message contains timeout-related information
          expect(
            error.message.toLowerCase().includes('timeout') ||
            error.message.toLowerCase().includes('time') ||
            error.code === 'TIMEOUT' ||
            error.code === 'ETIMEDOUT'
          ).toBe(true);
        }
      } finally {
        await client.close();
      }
    }, 15000);
  });
});
