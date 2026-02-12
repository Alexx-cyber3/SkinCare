const express = require('express');
const router = express.Router();
const { Progress } = require('../models');

router.get('/:userId', async (req, res) => {
  try {
    const progress = await Progress.findAll({ 
      where: { userId: req.params.userId },
      order: [['date', 'DESC']],
      limit: 30
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const { userId, date, type } = req.body;
    // type should be 'morningDone', 'nightDone', or 'weeklyDone'
    
    let entry = await Progress.findOne({ where: { userId, date } });
    if (!entry) {
      entry = await Progress.create({ userId, date });
    }
    
    entry[type] = true;
    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;