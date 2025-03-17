import React from 'react';
import { Link } from 'react-router-dom';
import '../LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="header">
        <h1>Welcome to Freelance Job Marketplace</h1>
        <p>Find the best freelancers or post your job today!</p>
        <div className="buttons">
          <Link to="/signup" className="btn">Sign Up</Link>
          <Link to="/login" className="btn">Login</Link>
        </div>
      </header>
    </div>
  );
};

export default LandingPage;