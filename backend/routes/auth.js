const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to Parse FormData Manually
const parseFormData = (req, res, next) => {
  console.log("Raw Request Body:", req.body);
  
  // Convert skills to an array if it's a string
  if (req.body.skills) {
    console.log("Skills input type:", typeof req.body.skills, req.body.skills);
    if (typeof req.body.skills === 'string') {
      req.body.skills = req.body.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    } else if (Array.isArray(req.body.skillas)) {
      req.body.skills = req.body.skills.map(skill => skill.trim()).filter(skill => skill);
    } else {
      console.warn("Unexpected skills type:", typeof req.body.skills);
      req.body.skills = [];
    }
  } else {
    req.body.skills = [];
  }
  
  next();
};

// Signup Route
router.post('/signup', parseFormData, async (req, res) => {
  try {
    console.log("Received Signup Request");

    const { email, password, role, name, bio, skills, profileImage } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      email,
      password,
      role,
      name,
      skills,
      bio,
      profileImage: profileImage || '', // Use provided ImgBB URL or empty string
    });

    await user.save();
    res.status(201).json({ message: "User created successfully", profileImage: user.profileImage });

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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: "Login successful"});

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Authenticated User Data
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update Profile
router.put('/me', authMiddleware, parseFormData, async (req, res) => {
  try {
    const { name, email, skills, bio, profileImage } = req.body;
    const updateData = { name, email, skills, bio };

    if (profileImage) {
      updateData.profileImage = profileImage; // Use provided ImgBB URL
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Change Password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get User by ID (adjusted to use profileImage)
router.get("/getUser/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -__v -createdAt -updatedAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If requester is employer, hide sensitive fields
    if (req.user.role === "employer") {
      const safeUser = user.toObject();
      return res.json(safeUser);
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;