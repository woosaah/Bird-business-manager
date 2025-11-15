import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import portfinder from 'portfinder';
import routes from './routes';
import pool from './config/database';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'The Birds Business Manager API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      customers: '/api/customers',
      sales: '/api/sales',
      calculator: '/api/calculator',
      dashboard: '/api/dashboard'
    }
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server with port auto-detection
async function startServer() {
  try {
    // Test database connection
    const dbTest = await pool.query('SELECT NOW()');
    console.log('✓ Database connection established');

    // Find available port
    const basePort = parseInt(process.env.BACKEND_PORT || '3001');
    portfinder.basePort = basePort;

    const port = await portfinder.getPortPromise({
      port: basePort,
      stopPort: basePort + 100
    });

    app.listen(port, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  🐦 THE BIRDS BUSINESS MANAGER - Backend API');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  Server running on: http://localhost:${port}`);
      console.log(`  Database: ${process.env.DB_NAME || 'the_birds_db'}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('  API Endpoints:');
      console.log(`    - Health Check:  http://localhost:${port}/api/health`);
      console.log(`    - Products:      http://localhost:${port}/api/products`);
      console.log(`    - Customers:     http://localhost:${port}/api/customers`);
      console.log(`    - Sales:         http://localhost:${port}/api/sales`);
      console.log(`    - Calculator:    http://localhost:${port}/api/calculator`);
      console.log(`    - Dashboard:     http://localhost:${port}/api/dashboard`);
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');

      // Write port to file for frontend to read
      const fs = require('fs');
      fs.writeFileSync('.backend-port', port.toString());
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
