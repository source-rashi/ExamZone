require('dotenv').config();

// PHASE 8.8: Validate environment variables before starting
const { validateEnv } = require('./config/env.validator');
validateEnv();

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
