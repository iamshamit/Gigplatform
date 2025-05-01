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
    skills: [],
    bio: '',
    profileImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.name === 'profileImage') {
      setFormData({ ...formData, profileImage: e.target.files[0] });
    } else if (e.target.name === 'skills') {
      const skills = e.target.value.split(',').map(skill => skill.trim());
      setFormData({ ...formData, skills });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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
      profileImageUrl = uploadResponse.data.imageUrl;

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        skills: formData.skills,
        bio: formData.bio,
        profileImage: profileImageUrl,
      };

      await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/signup`, userData);
      toast.success('Signup successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to sign up.');
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
                value={formData.skills.join(', ')}
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