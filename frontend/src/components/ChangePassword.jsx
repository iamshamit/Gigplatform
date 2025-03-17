import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/auth/change-password', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="signup-box">
        <h2>Change Password</h2>
        <form onSubmit={handleSubmit}>
          <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} placeholder="Current Password" required />
          <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="New Password" required />
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm New Password" required />
          <button type="submit" className="auth-button">Change Password</button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;