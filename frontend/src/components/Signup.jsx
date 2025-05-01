import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'freelancer',
    skills: '', // Store as a string for the input field
    bio: '',
    profileImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.name === 'profileImage') {
      setFormData({ ...formData, profileImage: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.name || !formData.email || !formData.password || !formData.role) {
        throw new Error('Please fill in all required fields.');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address.');
      }

      // Validate password length
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      // Validate skills (optional, but if provided, ensure it's not empty after trimming)
      if (formData.skills.trim() && formData.skills.split(',').every(skill => !skill.trim())) {
        throw new Error('Please enter valid skills (comma-separated).');
      }

      // Validate bio length (optional)
      if (formData.bio && formData.bio.length > 500) {
        throw new Error('Bio must not exceed 500 characters.');
      }

      // Verify profileImage is a valid File object
      if (!formData.profileImage || !(formData.profileImage instanceof File)) {
        throw new Error('Please select a valid profile image.');
      }

      console.log('Selected file:', {
        name: formData.profileImage.name,
        type: formData.profileImage.type,
        size: formData.profileImage.size,
      });

      let profileImageUrl = '';
      const imageData = new FormData();
      imageData.append('image', formData.profileImage);

      // Log FormData entries for debugging
      for (let pair of imageData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }

      // Use base64 endpoint for testing
      const uploadResponse = await axios.post(`${import.meta.env.VITE_BASE_URL}/upload/public-base64`, imageData);
      if (!uploadResponse.data.imageUrl) {
        throw new Error('Failed to upload profile image.');
      }
      profileImageUrl = uploadResponse.data.imageUrl;

      // Convert the skills string to an array for submission
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        skills: skillsArray.join(', '), // Send as a comma-separated string to match backend expectation
        bio: formData.bio,
        profileImage: profileImageUrl,
      };

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/signup`, userData);
      toast.success(response.data.message || 'Signup successful! Please login.');
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sign up.';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="signup-box">
        <h2>Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="freelancer">Freelancer</option>
            <option value="employer">Employer</option>
          </select>
          {formData.role === 'freelancer' && (
            <>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Skills (comma separated)"
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Bio"
              />
            </>
          )}
          <input
            type="file"
            name="profileImage"
            accept="image/*"
            onChange={handleChange}
            required
          />
          <button
            type="submit"
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;