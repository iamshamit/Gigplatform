// backend/routes/jobs.js
const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// Get all jobs
router.get("/", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new job (only for employers)
router.post("/", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "employer") {
    return res.status(403).json({ message: "Access denied" });
  }

  const job = new Job({
    title: req.body.title,
    description: req.body.description,
    budget: req.body.budget,
    category: req.body.category,
    employer: req.user.id,
  });

  try {
    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "employer",
      "name email"
    );
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Apply for a job (only for freelancers)
router.post("/:id/apply", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "freelancer") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Check if the freelancer has already applied
    if (job.applicants.includes(req.user.id)) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });
    }

    job.applicants.push(req.user.id);
    await job.save();
    res.json({ message: "Applied successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/employer/applicants', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.aggregate([
      { 
        $match: { 
          employer: new mongoose.Types.ObjectId(req.user._id) 
        } 
      },
      {
        $lookup: {
          from: "users",
          localField: "applicants",
          foreignField: "_id",
          as: "applicants",
          pipeline: [{
            $project: { 
              name: 1,
              profilePicture: 1,
              skills: { $slice: ["$skills", 5] },
              _id: 1 
            }
          }]
        }
      },
      { 
        $project: { 
          title: 1, 
          "applicants.name": 1,
          "applicants.profilePicture": 1,
          "applicants.skills": 1,
          "applicants._id": 1
        } 
      }
    ]);

    res.json(jobs);
  } catch (error) {
    console.error('Applicants Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:jobId/applicants', async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('applicants', 'name profilePicture skills');
      
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job.applicants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/employer/:employerId", authMiddleware, async (req, res) => {
  try {
    const { employerId } = req.params;

    // Validate employerId
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      return res.status(400).json({ message: "Invalid employer ID" });
    }

    // Fetch jobs where the employer field matches the employerId
    const jobs = await Job.find({ employer: employerId }).populate(
      "employer",
      "name email"
    ); // Populate employer details

    // If no jobs are found, return a 404 response
    if (!jobs || jobs.length === 0) {
      return res
        .status(404)
        .json({ message: "No jobs found for this employer" });
    }

    // Return the jobs
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs by employer:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/applied/:userId", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ applicants: req.params.userId });

    if (!jobs || jobs.length === 0) {
      return res
        .status(404)
        .json({ message: "No jobs found where you have applied" });
    }

    res.json(jobs);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    console.error("Error fetching jobs by applicant:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete job (employer)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (!job.employer.equals(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this job" });
    }

    // Use deleteOne() instead of deprecated remove()
    await job.deleteOne();

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove application (freelancer)
router.delete("/:id/apply", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Use user ID from request body instead of auth token
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const index = job.applicants.indexOf(userId);
    if (index === -1) return res.status(400).json({ message: "Not applied" });

    job.applicants.splice(index, 1);
    await job.save();

    res.json({ message: "Application removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
