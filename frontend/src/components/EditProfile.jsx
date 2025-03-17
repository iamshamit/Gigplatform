import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: '',
    bio: '',
    profilePicture: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { name, email, skills, bio, profilePicture } = response.data;
        setFormData({ name, email, skills: skills.join(', '), bio, profilePicture });
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'profilePicture') {
      setFormData({ ...formData, profilePicture: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('skills', formData.skills);
    data.append('bio', formData.bio);
    if (formData.profilePicture) {
      data.append('profilePicture', formData.profilePicture);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/auth/me', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="signup-box">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
          <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="Skills (comma separated)" />
          <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio"></textarea>
          <input type="file" name="profilePicture" accept="image/*" onChange={handleChange} />
          <button type="submit" className="auth-button">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;