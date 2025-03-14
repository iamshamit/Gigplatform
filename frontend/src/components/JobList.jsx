import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobList = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/jobs')
      .then(response => setJobs(response.data))
      .catch(error => console.error('Error fetching jobs:', error));
  }, []);

  return (
    <div>
      <h1>Job Listings</h1>
      <ul>
        {jobs.map(job => (
          <li key={job._id}>
            {job.title} - {job.description} - ${job.budget}
            <button onClick={() => applyForJob(job._id)}>Apply</button>
          </li>
        ))}
      </ul>
    </div>
  );

  const applyForJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/jobs/${jobId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Applied successfully!');
    } catch (error) {
      console.error('Error applying for job:', error);
    }
  };
};

export default JobList; 