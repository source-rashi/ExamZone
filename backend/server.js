require('dotenv').config();

// PHASE 8.8: Validate environment variables before starting
const { validateEnv } = require('./config/env.validator');
validateEnv();

const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 ExamZone Backend Server`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Listening on: http://${HOST}:${PORT}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI ? 'Connected to MongoDB Atlas' : 'No database configured'}`);
  console.log(`✅ Server is ready to accept connections`);
});
