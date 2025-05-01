import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../AuthForm.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
      toast.success('Login successful!');
      setError(null);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Error logging in:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="auth-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          <button type="submit" className="auth-button">Login</button>
          {error && <p className="auth-error mt-3 " style={{ color: 'red' }}>{error}</p>}
        </form>
        <p className="auth-link">Not a member? <a href="/signup">Signup now</a></p>
      </div>
    </div>
  );
};

export default Login;
