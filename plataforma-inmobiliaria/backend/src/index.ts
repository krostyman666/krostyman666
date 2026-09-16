import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 routes
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Plataforma Inmobiliaria API v1',
    version: '0.0.1',
    status: 'running',
  });
});

// TODO: Add routes
// import authRoutes from './routes/auth';
// import propertyRoutes from './routes/properties';
// import transactionRoutes from './routes/transactions';
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/properties', propertyRoutes);
// app.use('/api/v1/transactions', transactionRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📚 API Docs available at http://localhost:${PORT}/api/v1`);
});

export default app;
