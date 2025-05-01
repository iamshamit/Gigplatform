const express = require('express');
const router = express.Router();
const multer = require('multer');
const fetch = require('node-fetch');
const qs = require('querystring');
require('dotenv').config();
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 32 * 1024 * 1024 }, // 32MB limit per ImgBB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!file) {
      return cb(new Error('No file provided'));
    }
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and GIF images are allowed'));
    }
  },
});

// Middleware to handle multer errors
const handleMulterError = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    } else if (err) {
      console.error('File filter error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Public upload using base64 in request body
router.post('/public-base64', handleMulterError, async (req, res) => {
  try {
    console.log('Public upload-base64 - Request file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer length: ${req.file.buffer.length}` : 'No buffer',
    } : 'No file received');

    if (!req.file || !Buffer.isBuffer(req.file.buffer)) {
      return res.status(400).json({ error: 'Invalid or missing file buffer' });
    }

    const base64Image = req.file.buffer.toString('base64');
    if (!process.env.IMGBB_API_KEY) {
      throw new Error('IMGBB_API_KEY is not defined in the environment variables');
    }

    const body = qs.stringify({
      key: process.env.IMGBB_API_KEY,
      image: base64Image,
      name: req.file.originalname || 'upload.jpg',
      expiration: '15552000',
    });

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await response.json();
    console.log('ImgBB response:', data);

    if (data.success) {
      res.status(200).json({ imageUrl: data.data.url });
    } else {
      throw new Error('ImgBB upload failed: ' + (data.error?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Public upload-base64 error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.post('/image',authMiddleware, handleMulterError, async (req, res) => {
  try {
    if (!req.file || !Buffer.isBuffer(req.file.buffer)) {
      return res.status(400).json({ error: 'Invalid or missing file buffer' });
    }

    const base64Image = req.file.buffer.toString('base64');
    if (!process.env.IMGBB_API_KEY) {
      throw new Error('IMGBB_API_KEY is not defined in the environment variables');
    }

    const body = qs.stringify({
      key: process.env.IMGBB_API_KEY,
      image: base64Image,
      name: req.file.originalname || 'upload.jpg',
      expiration: '15552000',
    });

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await response.json();

    if (data.success) {
      res.status(200).json({ imageUrl: data.data.url }); // Send back the image URL
    } else {
      throw new Error('ImgBB upload failed: ' + (data.error?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});


module.exports = router;