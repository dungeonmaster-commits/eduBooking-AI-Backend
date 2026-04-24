import { PrismaClient } from '@prisma/client';
import config from '../config/app.config.js';

// Singleton pattern — one DB connection for the whole app
// Spring Boot manages this automatically via @Bean; we do it manually
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: config.env === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;