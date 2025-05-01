import React, { useState } from 'react';
import axios from 'axios';
import './JobForm.css';

const JobForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess(false);
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.budget || isNaN(formData.budget) || formData.budget <= 0) {
      return 'Please enter a valid budget';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://gigplatform.onrender.com/jobs', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFormData({ title: '', description: '', budget: '' });
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Error posting job. Please try again.');
      console.error('Error posting job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-form-container">
      <h2>Post a New Job</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Job posted successfully!</div>}
      <form onSubmit={handleSubmit} className="job-form">
        <div className="form-group">
          <label htmlFor="title">Job Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter job title"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Job Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter job description"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="budget">Budget ($)</label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            placeholder="Enter budget"
            min="1"
            disabled={loading}
          />
        </div>
        <button 
          type="submit" 
          className={`submit-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
};


export default JobForm;