const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../multerConfig');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

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
router.put('/me', authMiddleware, upload.single('profilePicture'), parseFormData, async (req, res) => {
  try {
    const { name, email, skills, bio } = req.body;
    const updateData = { name, email, skills, bio };

    if (req.file) {
      updateData.profilePicture = req.file.filename;
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

router.get("/getUser/:id", authMiddleware, async (req, res) => {
  try {
    console.log("Fetching user with ID:", req.params.id);
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
