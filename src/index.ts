import cors from 'cors';
import express from 'express';

import { initDb, } from './database';
import { router } from './router';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Enable CORS for frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

async function startServer() {
  try {
    await initDb();
    console.log('📦 Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Meridiano API server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   GET /api/briefings - List briefings`);
      console.log(`   GET /api/briefings/:id - Get briefing details`);
      console.log(`   GET /api/articles - List articles`);
      console.log(`   GET /api/articles/:id - Get article details`);
      console.log(`   GET /api/profiles - Get available feed profiles`);
      console.log(`   GET /api/health - Health check`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
