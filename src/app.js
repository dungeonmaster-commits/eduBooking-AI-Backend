import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

// Routes
import authRoutes     from './modules/auth/auth.routes.js';
import userRoutes     from './modules/users/user.routes.js';
import resourceRoutes from './modules/resources/resource.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import progressRoutes from './modules/progress/progress.routes.js';
import communityRoutes from './modules/community/community.routes.js';

// Middlewares
import errorMiddleware from './middlewares/error.middleware.js';

const createApp = () => {
  const app = express();

  // ─── Global Middleware ────────────────────────────────────────────────────
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
  // ✅ ALL routes must be registered BEFORE the 404 handler
  app.use('/api/v1/auth',      authRoutes);
  app.use('/api/v1/users',     userRoutes);
  app.use('/api/v1/resources', resourceRoutes);
  app.use('/api/v1/bookings',  bookingRoutes);
  app.use('/api/v1/progress', progressRoutes);
  app.use('/api/v1/community', communityRoutes); 

  // ─── 404 Handler — ALWAYS after all routes ────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // ─── Global Error Handler — ALWAYS last ───────────────────────────────────
  app.use(errorMiddleware);

  return app;
};

export default createApp;