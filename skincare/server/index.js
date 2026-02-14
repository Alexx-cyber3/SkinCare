const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const skincareRoutes = require('./routes/skincare');
const progressRoutes = require('./routes/progress');

app.use('/api/auth', authRoutes);
app.use('/api/skincare', skincareRoutes);
app.use('/api/progress', progressRoutes);

// Database sync and server start
sequelize.sync({ alter: true }).then(() => {
  console.log('Database connected and synced');
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});
