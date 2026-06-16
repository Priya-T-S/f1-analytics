const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`F1 Analytics API running on port ${PORT}`);
});
