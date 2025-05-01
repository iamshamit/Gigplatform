import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const JOBS_PER_PAGE = 10;

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/jobs?page=${page}&limit=${JOBS_PER_PAGE}`);
      const newJobs = response.data.jobs || response.data;
      setJobs(prevJobs => page === 1 ? newJobs : [...prevJobs, ...newJobs]);
      setHasMore(newJobs.length === JOBS_PER_PAGE);
    } catch (err) {
      setError('Failed to load jobs. Please try again.');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const applyForJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_BASE_URL}/jobs/${jobId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Applied successfully!');
    } catch (error) {
      alert('Failed to apply for the job. Please try again.');
      console.error('Error applying for job:', error);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="job-list-container">
      <h1>Job Listings</h1>
      <div className="job-list">
        {jobs
        .filter(job => job.status !== 'completed')
        .map(job => (
          <div key={job._id} className="job-card">
            <h3>{job.title}</h3>
            <p>{job.description}</p>
            <div className="job-footer">
              <span className="budget">${job.budget}</span>
              <button 
                onClick={() => applyForJob(job._id)}
                className="apply-button"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="loading-spinner">Loading...</div>}
      {!loading && hasMore && (
        <button 
          onClick={() => setPage(prev => prev + 1)}
          className="load-more-button"
        >
          Load More Jobs
        </button>
      )}
    </div>
  );
};

export default JobList;