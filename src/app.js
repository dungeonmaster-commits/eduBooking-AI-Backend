import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';



// Routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes  from './modules/users/user.routes.js'; 

// Middlewares
import errorMiddleware from './middlewares/error.middleware.js';

/**
 * Express app factory.
 * 
 * Spring Boot analogy: This is what @SpringBootApplication sets up automatically.
 * In Express, we configure everything explicitly — middleware order matters!
 * 
 * Middleware order: request → CORS → logging → body parsing → routes → errors
 */
const createApp = () => {
  const app = express();

  // ─── Global Middleware ────────────────────────────────────────────────────

  // CORS — allow requests from your frontend
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));

  // Parse JSON request bodies (like Spring's @RequestBody)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logger (dev: colored, prod: minimal)
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // ─── API Routes ───────────────────────────────────────────────────────────
  // All routes prefixed with /api/v1
  app.use('/api/v1/auth', authRoutes);
//   app.use('/api/v1/auth',  authRoutes);
  app.use('/api/v1/users', userRoutes);
  // (more routes added here as we build more modules)

  // ─── 404 Handler ─────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // ─── Global Error Handler (MUST be last) ──────────────────────────────────
  // Spring Boot: @ControllerAdvice catches all exceptions
  // Express: 4-argument middleware catches all errors passed to next(err)
  app.use(errorMiddleware);

  app.use('/api/v1/auth',  authRoutes);
  app.use('/api/v1/users', userRoutes);

  return app;
};

export default createApp;