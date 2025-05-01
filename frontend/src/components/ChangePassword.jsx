import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../auth.css';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.currentPassword) return 'Current password is required';
    if (!formData.newPassword) return 'New password is required';
    if (!formData.confirmPassword) return 'Confirm password is required';
    if (formData.newPassword.length < 6) return 'New password must be at least 6 characters';
    if (formData.newPassword !== formData.confirmPassword) return 'New password and confirm password do not match';
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
      await axios.put('https://gigplatform.onrender.com/auth/change-password', 
        { currentPassword: formData.currentPassword, newPassword: formData.newPassword },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Error changing password. Please try again.');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="signup-box">
        <h2>Change Password</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input 
            type="password" 
            name="currentPassword" 
            value={formData.currentPassword} 
            onChange={handleChange} 
            placeholder="Current Password" 
            disabled={loading}
          />
          <input 
            type="password" 
            name="newPassword" 
            value={formData.newPassword} 
            onChange={handleChange} 
            placeholder="New Password" 
            disabled={loading}
          />
          <input 
            type="password" 
            name="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            placeholder="Confirm New Password" 
            disabled={loading}
          />
          <button 
            type="submit" 
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;