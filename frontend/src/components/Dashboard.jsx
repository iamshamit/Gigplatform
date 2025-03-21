import React, { useState, useEffect, useRef } from "react";
import FetchEmployer from "./FetchEmployer";
import "../dashboard.css";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import Select from "react-select";
import { useQuery, useQueryClient } from "react-query";
import { FixedSizeList as List } from "react-window";

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const buttonRef = useRef(null);
  const modalRef = useRef(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tempCategory, setTempCategory] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeTab, setActiveTab] = useState("jobs");
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    budget: "",
    category: "",
  });
  const [isGridView, setIsGridView] = useState(
    localStorage.getItem("isGridView") === "true"
  );
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("isDarkMode") === "true"
  );

  const DeleteConfirmationModal = () => (
    <Modal
      isOpen={showDeleteModal}
      onRequestClose={() => setShowDeleteModal(false)}
      style={customStyles}
      contentLabel="Delete Confirmation"
    >
      <h2 className="text-xl font-bold mb-4">
        {deleteType === "job" ? "Delete Job" : "Remove Application"}
      </h2>
      <p className="mb-6">
        Are you sure you want to{" "}
        {deleteType === "job"
          ? "delete this job permanently?"
          : "remove this application?"}
      </p>
      <div className="flex justify-end">
        <button
          className="mr-4 px-4 py-2 bg-gray-300 rounded"
          onClick={() => setShowDeleteModal(false)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={() => {
            if (deleteType === "job") {
              handleDeleteJob(jobToDelete);
            } else {
              handleDelete(jobToDelete);
            }
            setShowDeleteModal(false);
          }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );

  const handleDeleteJob = async (jobId) => {
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove the deleted job from state
      const updatedJobs = jobs.filter((job) => job._id !== jobId);
      setJobs(updatedJobs);
      toast.success("Job deleted successfully!");
    } catch (error) {
      console.error("Delete job failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete job");
    }
  };

  const handleDeleteClick = (jobId, type) => {
    setJobToDelete(jobId);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const fetchApplicants = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      "http://localhost:5000/jobs/employer/applicants",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  };

  const fetchApplicantDetails = async (jobId) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `http://localhost:5000/jobs/${jobId}/applicants`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  };

  const jobCategories = [
    { value: "Web Development", label: "Web Development" },
    { value: "Mobile App Development", label: "Mobile App Development" },
    { value: "Graphic Design", label: "Graphic Design" },
    { value: "Content Writing", label: "Content Writing" },
    { value: "Digital Marketing", label: "Digital Marketing" },
    { value: "Video Editing", label: "Video Editing" },
    { value: "Business Consulting", label: "Business Consulting" },
    { value: "Software Development", label: "Software Development" },
    { value: "Photography", label: "Photography" },
    { value: "Music Production", label: "Music Production" },
    {
      value: "Engineering & Architecture",
      label: "Engineering & Architecture",
    },
    { value: "Online Tutoring", label: "Online Tutoring" },
    { value: "Health & Fitness Coaching", label: "Health & Fitness Coaching" },
    { value: "Translation Services", label: "Translation Services" },
    { value: "Virtual Assistance", label: "Virtual Assistance" },
    { value: "E-commerce Development", label: "E-commerce Development" },
    { value: "Real Estate Services", label: "Real Estate Services" },
    { value: "Game Development", label: "Game Development" },
    { value: "Social Media Management", label: "Social Media Management" },
    { value: "Data Entry", label: "Data Entry" },
    { value: "Research Paper Writing", label: "Research Paper Writing" },
    { value: "Video Production", label: "Video Production" },
    { value: "Data Science", label: "Data Science" },
    { value: "Accounting", label: "Accounting" },
    { value: "Legal Services", label: "Legal Services" },
    { value: "IT Consulting", label: "IT Consulting" },
    { value: "Product Management", label: "Product Management" },
    { value: "UX/UI Design", label: "UX/UI Design" },
    { value: "AI Development", label: "AI Development" },
    { value: "Cybersecurity", label: "Cybersecurity" },
    { value: "Blockchain Development", label: "Blockchain Development" },
    { value: "AR/VR Development", label: "AR/VR Development" },
    { value: "VR/AR Development", label: "VR/AR Development" },
    { value: "Robotics", label: "Robotics" },
    { value: "IOT Development", label: "IOT Development" },
    { value: "AI/ML Development", label: "AI/ML Development" },
    { value: "Cybersecurity", label: "Cybersecurity" },
  ];

  const handleDelete = async (jobId) => {

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://localhost:5000/jobs/${jobId}/apply`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { userId: user._id }, // Send user ID in request body
      });

      // Update jobs list properly
      const updatedJobs = jobs.map((job) => {
        if (job._id === jobId) {
          return {
            ...job,
            applicants: job.applicants.filter((id) => id !== user._id),
          };
        }
        return job;
      });

      setJobs(updatedJobs);
      toast.success("Application removed successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to remove application"
      );
    }
  };

  const JobDetailsView = () => (
    <div className="job-details-container">
      <div className="job-details-header">
        <h1 className="app-content-headerText">Job Details</h1>
        <button className="back-button" onClick={() => setSelectedJob(null)}>
          ← Back to Jobs
        </button>
      </div>

      <div className="job-details-content">
        <div className="job-detail-item">
          <h3>Job Title</h3>
          <p>{selectedJob.title}</p>
        </div>

        <div className="job-detail-item">
          <h3>Description</h3>
          <p>{selectedJob.description}</p>
        </div>

        <div className="job-detail-item">
          <h3>Budget</h3>
          <p>₹{selectedJob.budget}</p>
        </div>

        <div className="job-detail-item">
          <h3>Category</h3>
          <p>{selectedJob.category}</p>
        </div>

        <div className="job-detail-item">
          <h3>Employer</h3>
          <FetchEmployer employerId={selectedJob.employer} />
        </div>

        {user.role === "freelancer" && (
          <div className="job-actions">
            <button
              className="apply-button"
              onClick={handleApply}
              disabled={selectedJob.applicants?.includes(user._id)}
            >
              {selectedJob.applicants?.includes(user._id)
                ? "Already Applied"
                : "Apply Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const JobRow = ({ job, index, onClick }) => (
    <div
      key={job.id || index}
      className={`products-row ${onClick ? "clickable" : ""}`}
      onClick={onClick}
    >
      <div className="product-cell title">
        <span className="cell-label">Title:</span>
        {job.title}
      </div>
      <div className="product-cell description">
        <span className="cell-label">Description:</span>
        {job.description}
      </div>
      <div className="product-cell budget">
        <span className="cell-label">Budget:</span>₹{job.budget}
      </div>
      <div className="product-cell category">
        <span className="cell-label">Category:</span>
        {job.category}
      </div>
      {user.role === "freelancer" && activeTab !== "applied-jobs" && (
        <div className="product-cell employer">
          <span className="cell-label">Employer:</span>
          {job.employer && <FetchEmployer employerId={job.employer} />}
        </div>
      )}
      {(user.role === "employer" || activeTab === "applied-jobs") && (
        <div className="product-cell actions">
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(
                job._id,
                user.role === "employer" ? "job" : "application"
              );
            }}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      width: "400px",
      padding: "20px",
      borderRadius: "10px",
      backgroundColor: isDarkMode ? "#f1f1f1" : "#1e293b", // Dark when darkmode else light when light mode
      color: isDarkMode ? "#000000" : "#ffffff", // Dark mode text color
      border: "none",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    overlay: {
      backgroundColor: isDarkMode
        ? "rgba(0, 0, 0, 0.75)"
        : "rgba(0, 0, 0, 0.5)", // Dark mode overlay
      backdropFilter: "blur(5px)", // Blurred background
    },
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

  useEffect(() => {
    if (showModal && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.top + window.scrollY - 170, // Position above the button
        left: rect.left + window.scrollX + 45, // Adjust left alignment
      });
    }
  }, [showModal]);

  useEffect(() => {
    localStorage.setItem("isGridView", isGridView);
  }, [isGridView]);

  useEffect(() => {
    localStorage.setItem("isDarkMode", isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [isDarkMode]);

  const toggleFilterMenu = () => {
    setIsFilterActive(!isFilterActive);
  };

  const switchToGridView = () => {
    setIsGridView(true);
  };

  const switchToListView = () => {
    setIsGridView(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory
      ? job.category === selectedCategory
      : true;

    if (activeTab === "applied-jobs" && user.role === "freelancer") {
      return (
        matchesSearch && matchesCategory && job.applicants?.includes(user._id)
      );
    }

    return matchesSearch && matchesCategory;
  });

  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory);
    setIsFilterActive(false); // Close filter menu
  };

  const handleResetFilters = () => {
    setTempCategory("");
    setSelectedCategory("");
    setIsFilterActive(false); // Close filter menu
  };

  const handleJobClick = async (jobId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedJob(response.data);
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast.error("Failed to fetch job details");
    }
  };

  const handleApply = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/jobs/${selectedJob._id}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update both selectedJob and main jobs list
      const updatedJobs = jobs.map((job) => {
        if (job._id === selectedJob._id) {
          return {
            ...job,
            applicants: [...(job.applicants || []), user._id],
          };
        }
        return job;
      });

      setJobs(updatedJobs);
      setSelectedJob((prev) => ({
        ...prev,
        applicants: [...(prev.applicants || []), user._id],
      }));

      toast.success("Applied successfully!", {
        /*...*/
      });
    } catch (error) {
      console.error("Error applying for job:", error);

      // Show error toast
      toast.error("Failed to apply for job. Please try again.", {
        position: "top-right",
        autoClose: 3000, // Close the toast after 3 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const { data: currentUser } = useQuery(
    "currentUser",
    async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      onError: (error) => {
        if ([401, 400].includes(error.response?.status)) navigate("/login");
      },
    }
  );

  const { data: jobsData, isLoading: jobsLoading } = useQuery(
    ["jobs", activeTab, currentUser?._id],
    async () => {
      const token = localStorage.getItem("token");
      
      let endpoint = "http://localhost:5000/jobs/";
      if (currentUser?.role === "employer") {
        endpoint = `http://localhost:5000/jobs/employer/${currentUser._id}`;
      } else if (activeTab === "applied-jobs") {
        endpoint = `http://localhost:5000/jobs/applied/${currentUser._id}`;
      }
  
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      enabled: !!currentUser?._id && activeTab !== "applicants",
      staleTime: 0, // Force fresh data on tab change
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (currentUser?._id && activeTab !== "applicants") {
      queryClient.invalidateQueries(["jobs", activeTab, currentUser._id]);
    }
  }, [activeTab, currentUser?._id, queryClient]);

  useEffect(() => {
    if (currentUser) setUser(currentUser);
    if (jobsData) setJobs(jobsData);
  }, [currentUser, jobsData]);

  useEffect(() => {
    setLoading(jobsLoading || !currentUser);
  }, [jobsLoading, currentUser]);

  const handleAddJob = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/jobs/",
        {
          ...jobForm,
          employer: user._id, // Add the employer ID from the user object
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the jobs list with the new job
      setJobs([...jobs, response.data]);

      // Close the modal and reset the form
      setShowAddJobModal(false);
      setJobForm({
        title: "",
        description: "",
        budget: "",
        category: "",
      });
      queryClient.invalidateQueries("jobs");
      window.location.reload();
    } catch (error) {
      console.error("Error adding job:", error);
      toast.error("Failed to add job. Please try again.");
    }
  };

  const sortedJobs = filteredJobs.sort((a, b) => {
    if (sortOrder === "asc") {
      return a.budget - b.budget; // Sort low to high
    } else {
      return b.budget - a.budget; // Sort high to low
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobForm({
      ...jobForm,
      [name]: value,
    });
  };

  const handleCategoryChange = (selectedOption) => {
    setJobForm({
      ...jobForm,
      category: selectedOption.value,
    });
  };

  const ApplicantsView = React.memo(({ isDarkMode }) => {
    const [selectedJob, setSelectedJob] = useState(null);
    const { data: applications = [], refetch } = useQuery(
      "applicants",
      fetchApplicants,
      {
        enabled: activeTab === "applicants",
        staleTime: 0,
      }
    );
    
    useEffect(() => {
      if (activeTab === "applicants") {
        refetch();
      }
    }, [activeTab, refetch]);

    const { data: detailedApplicants = [] } = useQuery(
      ["applicantDetails", selectedJob],
      () => fetchApplicantDetails(selectedJob),
      { enabled: !!selectedJob }
    );

    return (
      <div className={`applicants-container ${isDarkMode ? "dark-mode" : ""}`}>
        <h1 className="app-content-headerText">Job Applications</h1>
        {applications.length === 0 ? (
          <div className="no-applicants">No applications received yet</div>
        ) : (
          applications.map((job) => (
            <div
              key={job._id}
              className={`job-applicants-card ${isDarkMode ? "dark-mode" : ""}`}
            >
              <div
                className="job-header"
                onClick={() =>
                  setSelectedJob((prev) => (prev === job._id ? null : job._id))
                }
              >
                <h3>{job.title}</h3>
                <div className="applicant-count">
                  <span>{job.applicants.length}</span>
                  {job.applicants.length === 1 ? " applicant" : " applicants"}
                </div>
              </div>

              {selectedJob === job._id && (
                <List
                  height={400}
                  itemCount={detailedApplicants.length}
                  itemSize={110} // Card height + spacing
                  width="100%"
                  className="applicants-list"
                >
                  {({ index, style }) => (
                    <div
                      style={{
                        ...style,
                        height: "94px", // 94px card + 16px spacing
                        padding: "0 15px 16px 15px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        className={`applicant-card ${
                          isDarkMode ? "dark-mode" : ""
                        }`}
                      >
                        <div className="applicant-info">
                          <img
                            src={`http://localhost:5000/uploads/${
                              detailedApplicants[index].profilePicture ||
                              "default.png"
                            }`}
                            alt="Applicant"
                            className="applicant-avatar"
                          />
                          <div className="applicant-details">
                            <h4>{detailedApplicants[index].name}</h4>
                            <div className="applicant-skills">
                              {detailedApplicants[index].skills
                                ?.slice(0, 3)
                                .join(" • ")}
                            </div>
                          </div>
                        </div>
                        <button
                          className="view-profile-btn"
                          onClick={() =>
                            navigate(
                              `/profile/${detailedApplicants[index]._id}`
                            )
                          }
                        >
                          View Profile →
                        </button>
                      </div>
                    </div>
                  )}
                </List>
              )}
            </div>
          ))
        )}
      </div>
    );
  });

  return (
    <>
      <div className={`app-container ${isDarkMode ? "dark-mode" : ""}`}>
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="app-icon">
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="currentColor"
                  d="M507.606 371.054a187.217 187.217 0 00-23.051-19.606c-17.316 19.999-37.648 36.808-60.572 50.041-35.508 20.505-75.893 31.452-116.875 31.711 21.762 8.776 45.224 13.38 69.396 13.38 49.524 0 96.084-19.286 131.103-54.305a15 15 0 004.394-10.606 15.028 15.028 0 00-4.395-10.615zM27.445 351.448a187.392 187.392 0 00-23.051 19.606C1.581 373.868 0 377.691 0 381.669s1.581 7.793 4.394 10.606c35.019 35.019 81.579 54.305 131.103 54.305 24.172 0 47.634-4.604 69.396-13.38-40.985-.259-81.367-11.206-116.879-31.713-22.922-13.231-43.254-30.04-60.569-50.039zM103.015 375.508c24.937 14.4 53.928 24.056 84.837 26.854-53.409-29.561-82.274-70.602-95.861-94.135-14.942-25.878-25.041-53.917-30.063-83.421-14.921.64-29.775 2.868-44.227 6.709-6.6 1.576-11.507 7.517-11.507 14.599 0 1.312.172 2.618.512 3.885 15.32 57.142 52.726 100.35 96.309 125.509zM324.148 402.362c30.908-2.799 59.9-12.454 84.837-26.854 43.583-25.159 80.989-68.367 96.31-125.508.34-1.267.512-2.573.512-3.885 0-7.082-4.907-13.023-11.507-14.599-14.452-3.841-29.306-6.07-44.227-6.709-5.022 29.504-15.121 57.543-30.063 83.421-13.588 23.533-42.419 64.554-95.862 94.134zM187.301 366.948c-15.157-24.483-38.696-71.48-38.696-135.903 0-32.646 6.043-64.401 17.945-94.529-16.394-9.351-33.972-16.623-52.273-21.525-8.004-2.142-16.225 2.604-18.37 10.605-16.372 61.078-4.825 121.063 22.064 167.631 16.325 28.275 39.769 54.111 69.33 73.721zM324.684 366.957c29.568-19.611 53.017-45.451 69.344-73.73 26.889-46.569 38.436-106.553 22.064-167.631-2.145-8.001-10.366-12.748-18.37-10.605-18.304 4.902-35.883 12.176-52.279 21.529 11.9 30.126 17.943 61.88 17.943 94.525.001 64.478-23.58 111.488-38.702 135.912zM266.606 69.813c-2.813-2.813-6.637-4.394-10.615-4.394a15 15 0 00-10.606 4.394c-39.289 39.289-66.78 96.005-66.78 161.231 0 65.256 27.522 121.974 66.78 161.231 2.813 2.813 6.637 4.394 10.615 4.394s7.793-1.581 10.606-4.394c39.248-39.247 66.78-95.96 66.78-161.231.001-65.256-27.511-121.964-66.78-161.231z"
                />
              </svg>
            </div>
          </div>
          <ul className="sidebar-list">
            <li
              className={`sidebar-list-item ${
                activeTab === "jobs" ? "active" : ""
              }`}
            >
              <a
                href="#"
                onClick={() => {
                  setActiveTab("jobs");
                  setSelectedJob(null); // Add this line
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-shopping-bag"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1={3} y1={6} x2={21} y2={6} />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>
                  {user.role === "freelancer" ? "Jobs" : "Added Jobs"}
                </span>
              </a>
            </li>
            {user.role === "freelancer" && (
              <li
                className={`sidebar-list-item ${
                  activeTab === "applied-jobs" ? "active" : ""
                }`}
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("applied-jobs");
                    setSelectedJob(null); // Add this line
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-inbox"
                  >
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                  </svg>
                  <span>Applied Jobs</span>
                </a>
              </li>
            )}
            {user.role === "employer" && (
              <li
                className={`sidebar-list-item ${
                  activeTab === "applicants" ? "active" : ""
                }`}
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("applicants");
                    setSelectedJob(null);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Applicants</span>
                </a>
              </li>
            )}
          </ul>
          <div className="account-info">
            <div className="account-info-picture">
              {user.profilePicture && (
                <img
                  src={`http://localhost:5000/uploads/${user.profilePicture}`}
                  alt="Account"
                />
              )}
            </div>
            <div className="account-info-name">{user.name}</div>
            <button
              className="account-info-more"
              onClick={() => setShowModal(!showModal)}
              ref={buttonRef}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-more-horizontal"
              >
                <circle cx={12} cy={12} r={1} />
                <circle cx={19} cy={12} r={1} />
                <circle cx={5} cy={12} r={1} />
              </svg>
            </button>
            {showModal && (
              <div
                className="dropdown-modal"
                style={{ top: modalPosition.top, left: modalPosition.left }}
                ref={modalRef}
              >
                <ul>
                  <li onClick={() => navigate("/change-password")}>
                    🔑 Change Password
                  </li>
                  <li onClick={() => navigate("/edit-profile")}>
                    🖼 Change Profile
                  </li>
                  <li onClick={() => navigate("/profile")}>👤 View Profile</li>
                  <li
                    onClick={() => {
                      localStorage.removeItem("token");
                      queryClient.clear();
                      navigate("/login");
                    }}
                  >
                    🚪 Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="app-content">
          {selectedJob ? (
            <JobDetailsView />
          ) : activeTab === "applicants" ? (
            <ApplicantsView isDarkMode={isDarkMode} />
          ) : (
            <>
              <div className="app-content-header">
                <h1 className="app-content-headerText">
                  {activeTab === "applied-jobs"
                    ? "Applied Jobs"
                    : user.role === "employer"
                    ? "Added Jobs"
                    : "Jobs"}
                </h1>
                <button
                  className={`mode-switch ${isDarkMode ? "active" : ""}`}
                  onClick={toggleDarkMode}
                >
                  <svg
                    className="moon"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                  >
                    <defs />
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                </button>
                {user.role === "employer" && activeTab !== "applied-jobs" && (
                  <button
                    className="app-content-headerButton"
                    onClick={() => setShowAddJobModal(true)}
                  >
                    Add Job
                  </button>
                )}
              </div>
              <div className="app-content-actions">
                <input
                  className="search-bar"
                  placeholder="Search..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="app-content-actions-wrapper">
                  <div className="filter-button-wrapper">
                    <button
                      className="action-button filter jsFilter"
                      onClick={toggleFilterMenu}
                    >
                      <span>Filter</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-filter"
                      >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                    <div
                      className={`filter-menu ${
                        isFilterActive ? "active" : ""
                      }`}
                    >
                      <label>Category</label>
                      <select
                        value={tempCategory}
                        onChange={(e) => setTempCategory(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {jobCategories.map((category, index) => (
                          <option
                            key={`${category}-${index}`}
                            value={category.value}
                          >
                            {category.label}
                          </option>
                        ))}
                      </select>
                      <div className="filter-menu-buttons">
                        <button
                          className="filter-button reset"
                          onClick={handleResetFilters}
                        >
                          Reset
                        </button>
                        <button
                          className="filter-button apply"
                          onClick={handleApplyFilters}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    className={`action-button list ${
                      !isGridView ? "active" : ""
                    }`}
                    onClick={switchToListView}
                    title="List View"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-list"
                    >
                      <line x1={8} y1={6} x2={21} y2={6} />
                      <line x1={8} y1={12} x2={21} y2={12} />
                      <line x1={8} y1={18} x2={21} y2={18} />
                      <line x1={3} y1={6} x2="3.01" y2={6} />
                      <line x1={3} y1={12} x2="3.01" y2={12} />
                      <line x1={3} y1={18} x2="3.01" y2={18} />
                    </svg>
                  </button>
                  <button
                    className={`action-button grid ${
                      isGridView ? "active" : ""
                    }`}
                    onClick={switchToGridView}
                    title="Grid View"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-grid"
                    >
                      <rect x={3} y={3} width={7} height={7} />
                      <rect x={14} y={3} width={7} height={7} />
                      <rect x={14} y={14} width={7} height={7} />
                      <rect x={3} y={14} width={7} height={7} />
                    </svg>
                  </button>
                </div>
              </div>
              <div
                className={`products-area-wrapper ${
                  isGridView ? "gridView" : "tableView"
                }`}
              >
                <div className="products-header">
                  <div className="product-cell title">Title</div>
                  <div className="product-cell description">Description</div>
                  <div className="product-cell budget">
                    Budget
                    <button
                      className="sort-button"
                      onClick={() => {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      }}
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}{" "}
                      {/* Arrow to indicate sorting order */}
                    </button>
                  </div>
                  <div className="product-cell category">Category</div>
                  {user.role === "freelancer" &&
                    activeTab !== "applied-jobs" && (
                      <div className="product-cell">Employer</div>
                    )}
                  {(user.role === "employer" ||
                    activeTab === "applied-jobs") && (
                    <div className="product-cell actions">Actions</div>
                  )}
                </div>
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : Array.isArray(sortedJobs) && sortedJobs.length > 0 ? (
                  sortedJobs.map((job, index) => (
                    <JobRow
                      key={job.id || index}
                      job={job}
                      index={index}
                      onClick={
                        user.role === "freelancer" && activeTab !== "applied-jobs"
                          ? () => handleJobClick(job._id)
                          : undefined
                      }
                      user={user}
                    />
                  ))
                ) : (
                  <div className="no-jobs">
                    {activeTab === "applied-jobs"
                      ? "No jobs applied"
                      : searchQuery
                      ? "No matching jobs found"
                      : "No jobs available"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <DeleteConfirmationModal />
      <Modal
        isOpen={showAddJobModal}
        onRequestClose={() => setShowAddJobModal(false)}
        style={customStyles}
        contentLabel="Add Job Modal"
      >
        <h2 className="text-xl font-bold mb-4">Add Job</h2>
        <form onSubmit={handleAddJob}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={jobForm.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={jobForm.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Budget</label>
            <input
              type="number"
              name="budget"
              value={jobForm.budget}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              options={jobCategories}
              onChange={handleCategoryChange}
              placeholder="Select a category..."
              className="text-black" // Ensure text is visible in dropdown
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddJobModal(false)}
              className="mr-5 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <div className="mx-1"></div>
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add Job
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
export default Dashboard;
