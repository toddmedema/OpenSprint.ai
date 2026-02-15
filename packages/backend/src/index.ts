import { createServer } from 'http';
import { createApp } from './app.js';
import { setupWebSocket } from './websocket/index.js';
import { DEFAULT_API_PORT } from '@opensprint/shared';

const port = parseInt(process.env.PORT || String(DEFAULT_API_PORT), 10);

const app = createApp();
const server = createServer(app);

// Attach WebSocket server
setupWebSocket(server);

server.listen(port, () => {
  console.log(`OpenSprint backend listening on http://localhost:${port}`);
  console.log(`WebSocket server ready on ws://localhost:${port}/ws`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
