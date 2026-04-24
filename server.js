import 'dotenv/config';
import createApp from './src/app.js';
import prisma from './src/database/prisma.client.js';
import config from './src/config/app.config.js';

const startServer = async () => {
  try {
    // 1. Test database connection before starting
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // 2. Create Express app
    const app = createApp();

    // 3. Start listening
    const server = app.listen(config.port, () => {
      console.log(`🚀 EduBooking server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🔗 Health: http://localhost:${config.port}/health`);
    });

    // 4. Graceful shutdown — clean up DB connections before exit
    // Spring Boot: @PreDestroy or DisposableBean
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected. Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // 5. Handle unhandled promise rejections (async errors not caught)
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Promise Rejection:', reason);
      shutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();