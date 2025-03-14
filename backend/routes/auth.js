const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../multerConfig');
const router = express.Router();

// Middleware to Parse FormData Manually (Fix for `email` missing)
const parseFormData = (req, res, next) => {
  console.log("Raw Request Body:", req.body);
  
  // Convert skills to an array
  if (req.body.skills) {
    req.body.skills = req.body.skills.split(',').map(skill => skill.trim());
  }
  
  next();
};

// Signup Route
router.post('/signup', upload.single('profilePicture'), parseFormData, async (req, res) => {
  try {
    console.log("Received Signup Request");

    // Extract fields
    const { email, password, role, name, bio, skills = [] } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Check if a file was uploaded and store its filename
    let profilePicture = null;
    if (req.file) {
      console.log("Uploaded File:", req.file); // Debugging log
      profilePicture = req.file.filename.toString(); // ✅ Store the renamed file
    } else {
      console.log("No profile picture uploaded.");
    }

    const user = new User({
      email,
      password,
      role,
      name,
      skills,
      bio,
      profilePicture
    });

    await user.save();
    res.status(201).json({ message: "User created successfully", profilePicture });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    console.log("Login Request Body:", req.body);

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({ token, message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
