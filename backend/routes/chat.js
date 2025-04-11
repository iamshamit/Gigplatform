const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/authMiddleware');

// Get chat for a specific job
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is either the employer or selected freelancer
    if (job.employer.toString() !== req.user._id.toString() && 
        job.selectedApplicant?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let chat = await Chat.findOne({ job: req.params.jobId })
      .populate('employer', 'name profilePicture')
      .populate('freelancer', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture');

    if (!chat) {
      // Create new chat if it doesn't exist
      chat = new Chat({
        job: req.params.jobId,
        employer: job.employer,
        freelancer: job.selectedApplicant
      });
      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post('/job/:jobId/message', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is either the employer or selected freelancer
    if (job.employer.toString() !== req.user._id.toString() && 
        job.selectedApplicant?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let chat = await Chat.findOne({ job: req.params.jobId });
    if (!chat) {
      chat = new Chat({
        job: req.params.jobId,
        employer: job.employer,
        freelancer: job.selectedApplicant
      });
    }

    chat.messages.push({
      sender: req.user._id,
      content: content
    });
    chat.lastUpdated = Date.now();
    await chat.save();

    // Populate sender info before sending response
    await chat.populate('messages.sender', 'name profilePicture');

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all chats for a user
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [
        { employer: req.user._id },
        { freelancer: req.user._id }
      ]
    })
    .populate('job', 'title')
    .populate('employer', 'name profilePicture')
    .populate('freelancer', 'name profilePicture')
    .sort({ lastUpdated: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 