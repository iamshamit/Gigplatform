// backend/routes/jobs.js
const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");
const User = require("../models/User");

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
      "name email profileImage"
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
          employer: new mongoose.Types.ObjectId(req.user._id),
          status: { $ne: "completed" }
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
              profileImage: 1, // Updated field name
              skills: { $slice: ["$skills", 5] },
              _id: 1 
            }
          }]
        }
      },
      { 
        $project: { 
          title: 1,
          status: 1, 
          "applicants.name": 1,
          "applicants.profileImage": 1, // Updated field name
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
      .populate('applicants', 'name profileImage skills'); // Updated field name
      
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
      "name email profileImage" // Updated field name
    );

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
    // Verify user access
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const jobs = await Job.find({ applicants: req.user._id })
      .select('title description budget category status selectedApplicant totalPaid payments applicants')
      .lean();

    // Add payment visibility flag
    const jobsWithPaymentInfo = jobs.map(job => ({
      ...job,
      showPayment: job.selectedApplicant?.toString() === req.user._id.toString()
    }));

    res.json(jobsWithPaymentInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

// Select an applicant for a job (only for employers)
router.post("/:jobId/select-applicant", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "employer") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if the employer owns this job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only select applicants for your own jobs" });
    }

    const { applicantId } = req.body;
    if (!applicantId) {
      return res.status(400).json({ message: "Applicant ID is required" });
    }

    // Check if the applicant has applied for this job
    if (!job.applicants.includes(applicantId)) {
      return res.status(400).json({ message: "This user has not applied for this job" });
    }

    // Update the selected applicant
    job.selectedApplicant = applicantId;
    await job.save();

    res.json({ message: "Applicant selected successfully", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:jobId/selected-applicant", authMiddleware, async (req, res) => {
  // Ensure the user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Optionally restrict access so only employers can view
  if (req.user.role !== "employer") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    // Find the job by its ID and populate the selectedApplicant field with specific user fields
    const job = await Job.findById(req.params.jobId).populate("selectedApplicant", "name email profileImage");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Ensure that the authenticated employer owns this job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view selected applicants for your own jobs" });
    }
    
    // Check if a selected applicant exists
    if (!job.selectedApplicant) {
      return res.status(404).json({ message: "No applicant has been selected for this job" });
    }
    
    // Send the selected applicant's details in the response
    res.status(200).json({ selectedApplicant: job.selectedApplicant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update job completion
router.patch('/:jobId/complete', authMiddleware, async (req, res) => {
  try {
    const { completionPercentage } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Calculate payment for this increment
    const percentageDifference = completionPercentage - job.completionPercentage;
    const paymentAmount = (job.budget * percentageDifference) / 100;

    // Record payment
    job.payments.push({
      amount: paymentAmount,
      percentage: percentageDifference
    });

    // Update totals
    job.totalPaid += paymentAmount;
    job.completionPercentage = completionPercentage;
    
    if (completionPercentage === 100) {
      job.status = 'completed';
    }

    // Update freelancer's earnings
    if (job.selectedApplicant) {
      await User.findByIdAndUpdate(job.selectedApplicant, {
        $inc: { earnings: paymentAmount }
      });
    }

    await job.save();
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rate freelancer
router.post('/:jobId/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the employer
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this job' });
    }

    // Check if job is 100% complete
    if (job.completionPercentage !== 100) {
      return res.status(400).json({ message: 'Job must be 100% complete to rate' });
    }

    // Check if user has already rated
    const existingRating = job.ratings.find(r => r.user.toString() === req.user._id.toString());
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this job' });
    }

    // Add rating
    job.ratings.push({
      user: req.user._id,
      rating,
      review
    });

    await job.save();

    // Update freelancer's average rating
    const freelancer = await User.findById(job.selectedApplicant);
    const allJobs = await Job.find({ selectedApplicant: job.selectedApplicant });
    
    let totalRatings = 0;
    let ratingCount = 0;
    
    allJobs.forEach(job => {
      job.ratings.forEach(rating => {
        totalRatings += rating.rating;
        ratingCount++;
      });
    });

    freelancer.averageRating = totalRatings / ratingCount;
    freelancer.ratingCount = ratingCount;
    await freelancer.save();

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;