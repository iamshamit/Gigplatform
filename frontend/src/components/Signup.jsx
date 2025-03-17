import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../AuthForm.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'freelancer',
    name: '',
    skills: [],
    bio: '',
    profilePicture: null
  });
  const navigate = useNavigate();
  const handleChange = (e) => {
    if (e.target.name === 'profilePicture') {
      setFormData({ ...formData, profilePicture: e.target.files[0] });
    } else if (e.target.name === 'skills') {
      const skills = e.target.value.split(',').map(skill => skill.trim());
      setFormData({ ...formData, skills });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("role", formData.role);
    data.append("name", formData.name);
    data.append("bio", formData.bio);
    data.append("skills", formData.skills.join(',')); // Convert array to string
    if (formData.profilePicture) {
      data.append("profilePicture", formData.profilePicture);
    }

    try {
      await axios.post('http://localhost:5000/auth/signup', data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      navigate('/login');
      toast.success('Signup successful! Please log in.');
      setFormData({
        email: '',
        password: '',
        role: 'freelancer',
        name: '',
        skills: [],
        bio: '',
        profilePicture: null
      });
    } catch (error) {
      console.error('Error signing up:', error.response?.data || error.message);
      alert('Signup failed!');
    }
  };

  return (
    <div className="auth-container">
      <div className="signup-box">
        <h2>Signup</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
          {formData.role === 'freelancer' && (
            <>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="Skills (comma separated)" />
              <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio"></textarea>
            </>
          )}
          <input type="file" name="profilePicture" accept="image/*" onChange={handleChange} />
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="freelancer">Freelancer</option>
            <option value="employer">Employer</option>
          </select>
          <button type="submit" className="auth-button">Signup</button>
        </form>
        <p className="auth-link">Already a member? <a href="/login">Login now</a></p>
      </div>
    </div>
  );
};

export default Signup;