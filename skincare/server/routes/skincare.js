const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const { User, Routine, AnalysisRecord, sequelize } = require('../models');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const skincareData = {
  'Dry': {
    problems: 'Dryness, flakiness, dull skin, tight feeling',
    morning: [
      { name: 'Cleanser', brand: 'Cetaphil Gentle Skin Cleanser', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Serum (Beginner)', brand: 'Minimalist Hyaluronic Acid 2%', qty: '2 drops', timeGap: '3 minutes' },
      { name: 'Moisturizer', brand: 'Cetaphil Moisturizing Cream', qty: '2 pea size', timeGap: '2 minutes' },
      { name: 'Sunscreen', brand: 'Neutrogena Ultra Sheer SPF 50', qty: '2 finger length', timeGap: '0 min' }
    ],
    night: [
      { name: 'Cleanser', brand: 'Cetaphil Gentle Skin Cleanser', qty: '1 coin', timeGap: '1 min' },
      { name: 'Toner', brand: 'Simple Soothing Toner', qty: '3–4 drops', timeGap: '2 min' },
      { name: 'Serum (Days 1–21)', brand: 'Minimalist Hyaluronic Acid 2%', qty: '2 drops', timeGap: '5 min' },
      { name: 'Serum (After 21 days)', brand: 'Minimalist Hyaluronic Acid + Ceramides', qty: '2 drops', timeGap: '5 min' },
      { name: 'Moisturizer', brand: 'Nivea Soft Cream', qty: '2 pea', timeGap: '2–3 min' },
      { name: 'Lip Balm', brand: 'Vaseline / Nivea Lip Balm', qty: 'rice size', timeGap: '0 min' }
    ],
    weekly: [
      { name: 'Gentle Scrub', brand: 'Plum', day: 'Wednesday', qty: 'Small amount' },
      { name: 'Aloe Vera Gel Mask', brand: 'WOW', day: 'Sunday', qty: 'Thin layer' }
    ],
    diet: {
      breakfast: 'Oats, milk, almonds',
      lunch: 'Rice, dal, vegetables',
      dinner: 'Chapati, paneer',
      add: 'Hydration, lukewarm water',
      avoid: 'Hot water, alcohol products'
    }
  },
  'Normal': {
    problems: 'Mild dullness, uneven skin tone, occasional dryness or oiliness',
    morning: [
      { name: 'Cleanser', brand: 'Simple Refreshing Face Wash', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Serum (Beginner)', brand: 'Minimalist Vitamin C 10%', qty: '2 drops', timeGap: '5 minutes' },
      { name: 'Moisturizer', brand: 'Simple Light Moisturizer', qty: '2 pea size', timeGap: '2 minutes' },
      { name: 'Sunscreen', brand: 'Neutrogena Ultra Sheer SPF 50', qty: '2 finger length', timeGap: '0 min' }
    ],
    night: [
      { name: 'Cleanser', brand: 'Simple Face Wash', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Toner', brand: 'Plum Green Tea Toner', qty: '3–4 drops', timeGap: '2 minutes' },
      { name: 'Serum (Days 1–28)', brand: 'Minimalist Vitamin C 10%', qty: '2 drops', timeGap: '5 minutes' },
      { name: 'Moisturizer', brand: 'Pond’s Light Gel', qty: '2 pea size', timeGap: '2–3 minutes' },
      { name: 'Lip Balm', brand: 'Nivea / Vaseline Lip Balm', qty: 'Rice grain size', timeGap: '0 min' }
    ],
    weekly: [
      { name: 'Mild Scrub', brand: 'St. Ives', day: 'Wednesday', qty: 'Small amount' },
      { name: 'Fruit Gel Mask', brand: 'Good Vibes', day: 'Sunday', qty: 'Thin layer' }
    ],
    diet: {
      breakfast: 'Fruits, boiled egg',
      lunch: 'Rice, vegetables, curd',
      dinner: 'Chapati, mixed vegetables',
      add: 'Balanced skincare routine, regular water intake',
      avoid: 'Overusing products, skipping moisturizer'
    }
  },
  'Oily': {
    problems: 'Excess oil, shiny appearance, open pores, occasional breakouts',
    morning: [
      { name: 'Cleanser', brand: 'Simple Refreshing Face Wash', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Serum (Beginner)', brand: 'Minimalist Niacinamide 5%', qty: '2 drops', timeGap: '5 minutes' },
      { name: 'Moisturizer', brand: 'Pond’s Super Light Gel', qty: '1 pea size', timeGap: '2 minutes' },
      { name: 'Sunscreen', brand: 'Lotus Herbals SPF 50 Gel', qty: '2 finger length', timeGap: '0 min' }
    ],
    night: [
      { name: 'Cleanser', brand: 'Simple Face Wash', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Toner', brand: 'Plum Green Tea Toner', qty: '3–4 drops', timeGap: '2 minutes' },
      { name: 'Serum (Days 1–21)', brand: 'Minimalist Niacinamide 5%', qty: '2 drops', timeGap: '5 minutes' },
      { name: 'Moisturizer', brand: 'Pond’s Super Light Gel', qty: '1 pea size', timeGap: '2–3 minutes' },
      { name: 'Lip Balm', brand: 'Nivea / Vaseline Lip Balm', qty: 'Rice grain size', timeGap: '0 min' }
    ],
    weekly: [
      { name: 'Green Tea Clay Mask', brand: 'Plum', day: 'Tuesday', qty: 'Thin layer' },
      { name: 'Multani Mitti Mask', brand: 'Khadi Natural', day: 'Friday', qty: 'Thin layer' },
      { name: 'Rest day', brand: 'No serum', day: 'Sunday', qty: 'N/A' }
    ],
    diet: {
      breakfast: 'Sprouts, fruits',
      lunch: 'Rice, vegetables',
      dinner: 'Soup, chapati',
      add: 'Gel-based products, good water intake',
      avoid: 'Oily/fried foods, heavy creams, touching face frequently'
    }
  },
  'Combination': {
    problems: 'Oily T-zone (forehead, nose, chin), dry or normal cheeks, uneven texture',
    morning: [
      { name: 'Cleanser', brand: 'Simple Refreshing Face Wash', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Serum (Beginner)', brand: 'Minimalist Niacinamide 5%', qty: '2 drops', timeGap: '5 minutes' },
      { name: 'Moisturizer', brand: 'Pond’s Light Gel', qty: '1 pea size', timeGap: '2 minutes' },
      { name: 'Sunscreen', brand: 'Neutrogena Ultra Sheer SPF 50', qty: '2 finger length', timeGap: '0 min' }
    ],
    night: [
      { name: 'Cleanser', brand: 'Simple Face Wash', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Toner', brand: 'Simple Soothing Toner', qty: '3–4 drops', timeGap: '2 minutes' },
      { name: 'Serum (Days 1–21)', brand: 'Minimalist Niacinamide 5%', qty: '2 drops', timeGap: '5 minutes' },
      { name: 'Moisturizer', brand: 'Pond’s Light Gel', qty: '1–2 pea size', timeGap: '2–3 minutes' },
      { name: 'Lip Balm', brand: 'Vaseline / Nivea Lip Balm', qty: 'Rice grain size', timeGap: '0 min' }
    ],
    weekly: [
      { name: 'Gentle Scrub', brand: 'Plum', day: 'Wednesday', qty: 'Small amount' },
      { name: 'Aloe Vera Gel', brand: 'WOW', day: 'Sunday', qty: 'On dry areas' }
    ],
    diet: {
      breakfast: 'Idli / oats / fruits',
      lunch: 'Rice, dal, vegetables',
      dinner: 'Chapati, salad',
      add: 'Zone-based skincare, proper hydration',
      avoid: 'Using the same product heavily on the whole face, skipping moisturizer'
    }
  },
  'Acne-prone': {
    problems: 'Pimples, acne breakouts, acne marks, inflammation, occasional redness',
    morning: [
      { name: 'Cleanser', brand: 'Simple Refreshing Face Wash', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Serum (Beginner)', brand: 'Minimalist Niacinamide 5%', qty: '2 drops', timeGap: '5 minutes' },
      { name: 'Moisturizer', brand: 'Pond’s Light Gel', qty: '1 pea size', timeGap: '2 minutes' },
      { name: 'Sunscreen', brand: 'Neutrogena Ultra Sheer SPF 50', qty: '2 finger length', timeGap: '0 min' }
    ],
    night: [
      { name: 'Cleanser', brand: 'Simple Face Wash', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Toner', brand: 'Simple Soothing Toner', qty: '3 drops', timeGap: '2 minutes' },
      { name: 'Serum (Days 1–28)', brand: 'Minimalist Salicylic Acid 0.5–1%', qty: '2 drops', timeGap: '5–7 minutes' },
      { name: 'Moisturizer', brand: 'Pond’s Light Gel', qty: '1 pea size', timeGap: '2–3 minutes' },
      { name: 'Lip Balm', brand: 'Vaseline / Nivea Lip Balm', qty: 'Rice grain size', timeGap: '0 min' }
    ],
    weekly: [
      { name: 'Neem Face Pack', brand: 'Himalaya', day: 'Friday', qty: 'Thin layer' },
      { name: 'Rest day', brand: 'No serum', day: 'Sunday', qty: 'N/A' }
    ],
    diet: {
      breakfast: 'Fruits, oats',
      lunch: 'Rice, vegetables',
      dinner: 'Soup, salad',
      add: 'Plenty of water, gentle skincare, clean pillow covers',
      avoid: 'Scrubs on active acne, junk food, excess sugar, popping pimples'
    }
  },
  'Sensitive': {
    problems: 'Redness, irritation, itching, burning sensation, easily reactive skin',
    morning: [
      { name: 'Cleanser', brand: 'Cetaphil Gentle Skin Cleanser', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Serum (Beginner)', brand: 'Minimalist Centella / Aloe Serum', qty: '2 drops', timeGap: '3 minutes' },
      { name: 'Moisturizer', brand: 'Cetaphil Moisturizing Lotion', qty: '2 pea size', timeGap: '2 minutes' },
      { name: 'Sunscreen', brand: 'Neutrogena Mineral Sunscreen', qty: '2 finger length', timeGap: '0 min' }
    ],
    night: [
      { name: 'Cleanser', brand: 'Cetaphil Gentle Skin Cleanser', qty: '1 coin size', timeGap: '1 minute' },
      { name: 'Toner', brand: 'Simple Soothing Toner', qty: '2–3 drops', timeGap: '2 minutes' },
      { name: 'Serum (Days 1–30)', brand: 'Minimalist Centella / Aloe Serum', qty: '2 drops', timeGap: '3–5 minutes' },
      { name: 'Moisturizer', brand: 'Cetaphil Moisturizing Lotion', qty: '2 pea size', timeGap: '2–3 minutes' },
      { name: 'Lip Balm', brand: 'Vaseline / Nivea Lip Balm', qty: 'Rice grain size', timeGap: '0 min' }
    ],
    weekly: [
      { name: 'Aloe Vera Gel Mask', brand: 'WOW', day: 'Saturday', qty: 'Thin layer' },
      { name: 'Rest day', brand: 'Cleanser + Moisturizer only', day: 'Sunday', qty: 'N/A' }
    ],
    diet: {
      breakfast: 'Banana, milk',
      lunch: 'Rice, dal',
      dinner: 'Soft foods (khichdi, vegetable soup)',
      add: 'Minimal skincare routine, patch testing, good hydration',
      avoid: 'Fragrance products, strong actives, scrubs, spicy food'
    }
  }
};

router.post('/analyze', upload.single('image'), async (req, res) => {
  const { userId } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    // Read the uploaded file to create a deterministic hash
    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    
    // Convert hash to a number to use for selection
    const hashInt = parseInt(hash.substring(0, 8), 16);
    
    const skinTypes = Object.keys(skincareData);
    const detectedType = skinTypes[hashInt % skinTypes.length];
    const data = skincareData[detectedType];
    
    // Deterministic score between 85 and 97 based on hash
    const score = 85 + (hashInt % 13);

    // Generate deterministic markers to simulate real AI analysis
    const markers = {
      hydration: 70 + (hashInt % 25),
      oiliness: 30 + ((hashInt >> 1) % 50),
      texture: 65 + ((hashInt >> 2) % 30),
      pores: 75 + ((hashInt >> 3) % 20),
      redness: 10 + ((hashInt >> 4) % 30),
      wrinkles: 5 + ((hashInt >> 5) % 20),
      pigmentation: 15 + ((hashInt >> 6) % 25),
      acne: 5 + ((hashInt >> 7) % 40),
      darkCircles: 20 + ((hashInt >> 8) % 35),
      elasticity: 80 + ((hashInt >> 9) % 15),
      sensitivity: 10 + ((hashInt >> 10) % 40),
      radiance: 60 + ((hashInt >> 11) % 35),
      uniformity: 70 + ((hashInt >> 12) % 25),
      barrierHealth: 75 + ((hashInt >> 13) % 20)
    };

    await Routine.destroy({ where: { userId } });
    await Routine.create({
      userId,
      type: 'morning',
      products: data.morning,
      dietPlan: data.diet
    });
    
    await User.update({ skinType: detectedType }, { where: { id: userId } });

    // Save Analysis Record
    await AnalysisRecord.create({
      userId,
      score,
      skinType: detectedType,
      markers, // Save the markers
      date: new Date().toISOString().split('T')[0]
    });

    res.json({ 
      skinType: detectedType, 
      problems: data.problems,
      score: score,
      markers: markers, 
      routines: {
        morning: data.morning,
        night: data.night,
        weekly: data.weekly
      },
      diet: data.diet
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const history = await AnalysisRecord.findAll({
      where: { userId: req.params.userId },
      order: [['date', 'ASC']],
      limit: 10
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/current/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user || !user.skinType) return res.status(404).json({ message: 'No analysis found' });
    
    // Get the latest analysis record to get markers
    const latestAnalysis = await AnalysisRecord.findOne({
      where: { userId: req.params.userId },
      order: [['createdAt', 'DESC']]
    });

    const data = skincareData[user.skinType];
    res.json({
      skinType: user.skinType,
      problems: data.problems,
      markers: latestAnalysis ? latestAnalysis.markers : null, // Include markers
      routines: {
        morning: data.morning,
        night: data.night,
        weekly: data.weekly
      },
      diet: data.diet
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;