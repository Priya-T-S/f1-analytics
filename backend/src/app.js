const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Data only changes after a race, so let Vercel's CDN cache API responses for an hour.
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/cron') && !req.path.startsWith('/sync')) {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
  }
  next();
});

app.use('/api', routes);

app.use(errorHandler);

// Vercel imports the app as a serverless function; locally it runs as a normal server.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`F1 Analytics API running on port ${PORT}`);
  });
}

module.exports = app;
