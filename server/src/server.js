'use strict';

require('dotenv').config();

const { connect } = require('./config/db');
const app = require('./app');

const PORT = parseInt(process.env.PORT || '5000', 10);

(async () => {
  try {
    await connect();
    app.listen(PORT, () => {
      console.log(`[server] DevAssist API running on http://localhost:${PORT}`);
      console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
})();
