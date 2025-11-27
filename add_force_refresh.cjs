// Add force refresh function
const fs = require('fs');

let content = fs.readFileSync('src/services/mcpService.ts', 'utf8');

// Add a force refresh function after the notifyToolChanged function
const forceRefreshFunction = `
// Force refresh all tools and send notifications
export const forceRefreshAllTools = async (): Promise<void> => {
  console.log('Force refreshing all tools...');
  
  // Re-initialize all clients to get fresh tool lists
  await initializeClientsFromSettings(false);
  
  // Send notifications to all MCP server instances
  const notificationPromises = Object.values(servers).map(async (server) => {
    try {
      await server.sendToolListChanged();
      console.log(\`Force refresh notification sent for server: \${server.name}\`);
    } catch (error: any) {
      console.warn(\`Failed to send force refresh notification:\`, error?.message || error);
    }
  });
  
  await Promise.allSettled(notificationPromises);
  console.log('All force refresh notifications completed');
};
`;

// Insert after notifyToolChanged function
const insertPoint = content.indexOf('export const syncToolEmbedding');
if (insertPoint !== -1) {
  content = content.slice(0, insertPoint) + forceRefreshFunction + content.slice(insertPoint);
}

fs.writeFileSync('src/services/mcpService.ts', content);
console.log('Added forceRefreshAllTools function');
