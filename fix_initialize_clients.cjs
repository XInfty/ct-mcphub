// Fix for initializeClientsFromSettings function
const fs = require('fs');

let content = fs.readFileSync('src/services/mcpService.ts', 'utf8');

// Find and replace the problematic section
const oldSection = `    // Check if server is already connected
    const existingServer = existingServerInfos.find(
      (s) => s.name === name && s.status === 'connected',
    );
    if (existingServer && (!serverName || serverName !== name)) {
      serverInfos.push({
        ...existingServer,
        enabled: conf.enabled === undefined ? true : conf.enabled,
      });
      console.log(\`Server '\${name}' is already connected.\`);
      continue;
    }`;

const newSection = `    // Check if server is already connected
    const existingServer = existingServerInfos.find(
      (s) => s.name === name && s.status === 'connected',
    );
    if (existingServer && (!serverName || serverName !== name)) {
      // For existing connected servers, we still need to refresh their tools
      // when this is not an initialization call (i.e., when tools have changed)
      if (!isInit) {
        console.log(\`Refreshing tools for already connected server: \${name}\`);
        // Keep the existing server but tools will be refreshed by registerAllTools
        serverInfos.push({
          ...existingServer,
          enabled: conf.enabled === undefined ? true : conf.enabled,
        });
      } else {
        serverInfos.push({
          ...existingServer,
          enabled: conf.enabled === undefined ? true : conf.enabled,
        });
        console.log(\`Server '\${name}' is already connected.\`);
      }
      continue;
    }`;

content = content.replace(oldSection, newSection);

fs.writeFileSync('src/services/mcpService.ts', content);
console.log('Fixed initializeClientsFromSettings function');
