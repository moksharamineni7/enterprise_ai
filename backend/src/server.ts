import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 NexusFlow AI Enterprise Backend listening on port ${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🧠 Gemini Model: ${env.GEMINI_MODEL}`);
  console.log(`⚡ API Root: http://localhost:${env.PORT}/api/v1`);
  console.log(`=======================================================`);
});

// Graceful shutdown
const handleShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
